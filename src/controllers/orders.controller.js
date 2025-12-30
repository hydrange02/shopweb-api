// src/controllers/orders.controller.js
const { Product } = require("../models/product.model");
const { Order } = require("../models/order.model");
const { Cart } = require("../models/cart.model"); 
const { asyncHandler } = require("../utils/async");

/**
 * 1. TẠO ĐƠN HÀNG MỚI
 */
const createOrder = asyncHandler(async (req, res) => {
  const { customerName, customerPhone, customerAddress, paymentMethod, note, items } = req.body;
  
  // 1.1. Chuẩn bị dữ liệu và kiểm tra tồn kho
  const snapshot = [];
  
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ message: `Sản phẩm ${item.productId} không tồn tại` });
    }

    // Logic kiểm tra tồn kho: Ưu tiên theo Size (Variants)
    let stockAvailable = product.stock; // Mặc định là stock tổng
    let variant = null;

    if (product.variants && product.variants.length > 0) {
      // Nếu sản phẩm có phân loại Size
      if (!item.selectedSize) {
        return res.status(400).json({ message: `Sản phẩm "${product.title}" yêu cầu chọn Size.` });
      }

      variant = product.variants.find(v => v.size === item.selectedSize);
      if (!variant) {
        return res.status(400).json({ message: `Sản phẩm "${product.title}" không có size "${item.selectedSize}"` });
      }
      
      stockAvailable = variant.stock;
    }

    // Kiểm tra số lượng
    if (stockAvailable < item.quantity) {
      return res.status(400).json({ 
        message: `Sản phẩm "${product.title}" (${item.selectedSize || 'Tiêu chuẩn'}) chỉ còn ${stockAvailable} sản phẩm.` 
      });
    }

    // Tính giá sau giảm
    const finalPrice = product.discountPercent 
      ? Math.round(product.price * (1 - product.discountPercent / 100)) 
      : product.price;

    snapshot.push({
      productId: product._id,
      title: product.title,
      price: finalPrice,
      quantity: item.quantity,
      image: product.images?.[0] || "",
      selectedSize: item.selectedSize // Lưu size khách chọn
    });
  }

  // 1.2. Tính tổng tiền
  const subtotal = snapshot.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const shippingFee = subtotal > 500000 ? 0 : 30000; // Ví dụ: Freeship đơn > 500k
  const total = subtotal + shippingFee;

  // 1.3. Tạo payload đơn hàng
  const orderPayload = {
    items: snapshot,
    customerName,
    customerPhone,
    customerAddress,
    paymentMethod,
    note,
    subtotal,
    shippingFee,
    total,
    status: "pending"
  };

  // Nếu user đã đăng nhập, gắn userId vào đơn
  if (req.user && req.user.sub) {
    orderPayload.userId = req.user.sub;
  }

  // 1.4. Lưu đơn hàng vào DB
  const order = await Order.create(orderPayload);

  // 1.5. 🔥 TRỪ KHO (Quan trọng)
  // Duyệt qua từng item để trừ kho và lưu lại (để kích hoạt pre-save hook tính tổng stock)
  for (const item of snapshot) {
    const product = await Product.findById(item.productId);
    
    if (product.variants && product.variants.length > 0) {
      // Trừ stock của Size cụ thể
      const vIndex = product.variants.findIndex(v => v.size === item.selectedSize);
      if (vIndex > -1) {
        product.variants[vIndex].stock -= item.quantity;
      }
    } else {
      // Trừ stock tổng (nếu sp không có size)
      product.stock -= item.quantity;
    }

    // Lưu lại -> Hook pre('save') trong Model sẽ tự động tính lại Stock Tổng
    await product.save();
  }

  // 1.6. Xóa giỏ hàng sau khi đặt thành công (nếu là user)
  if (req.user && req.user.sub) {
    await Cart.findOneAndDelete({ userId: req.user.sub });
  }

  res.status(201).json({ ok: true, order });
});

/**
 * 2. LẤY DANH SÁCH ĐƠN HÀNG CỦA TÔI (User)
 */
const listMyOrders = asyncHandler(async (req, res) => {
  const userId = req.user.sub; 
  const orders = await Order.find({ userId }).sort({ createdAt: -1 });
  res.status(200).json({ ok: true, data: orders });
});

/**
 * 3. LẤY CHI TIẾT 1 ĐƠN HÀNG
 */
const getOrderById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await Order.findById(id);
  
  if (!order) {
    return res.status(404).json({ message: "Đơn hàng không tồn tại" });
  }
  res.status(200).json({ ok: true, order });
});

/**
 * 4. LẤY DANH SÁCH TẤT CẢ ĐƠN HÀNG (Admin)
 */
const listOrders = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page || "1", 10), 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 50);
  const q = req.query.q; 

  const filter = {};
  if (q) {
    // Nếu query giống ObjectId -> tìm theo ID
    if (/^[0-9a-fA-F]{24}$/.test(q)) {
      filter._id = q;
    } else {
      filter.$or = [
        { customerName: { $regex: q, $options: "i" } },
        { customerPhone: { $regex: q, $options: "i" } }
      ];
    }
  }

  const total = await Order.countDocuments(filter);
  const data = await Order.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  res.status(200).json({ 
    ok: true, 
    data, 
    page, 
    limit, 
    total, 
    hasNext: page * limit < total 
  });
});

/**
 * 5. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (Admin)
 * - Tự động hoàn kho nếu trạng thái chuyển sang "canceled"
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ["pending", "paid", "canceled", "shipping", "completed"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Trạng thái không hợp lệ" });
  }

  const currentOrder = await Order.findById(id);
  if (!currentOrder) {
    return res.status(404).json({ message: "Không tìm thấy đơn hàng" });
  }

  // 🔄 LOGIC HOÀN KHO: Nếu HỦY đơn -> Cộng lại số lượng
  if (status === "canceled" && currentOrder.status !== "canceled") {
    for (const item of currentOrder.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        if (product.variants && product.variants.length > 0) {
          const vIndex = product.variants.findIndex(v => v.size === item.selectedSize);
          if (vIndex > -1) product.variants[vIndex].stock += item.quantity;
        } else {
          product.stock += item.quantity;
        }
        await product.save(); // Kích hoạt tính lại tổng stock
      }
    }
  }

  // 🔄 LOGIC TRỪ LẠI KHO: Nếu đang HỦY mà chuyển sang trạng thái khác (Khôi phục đơn)
  if (currentOrder.status === "canceled" && status !== "canceled") {
    for (const item of currentOrder.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        if (product.variants && product.variants.length > 0) {
          const vIndex = product.variants.findIndex(v => v.size === item.selectedSize);
          if (vIndex > -1) product.variants[vIndex].stock -= item.quantity;
        } else {
          product.stock -= item.quantity;
        }
        await product.save();
      }
    }
  }

  currentOrder.status = status;
  await currentOrder.save();

  res.status(200).json({ ok: true, order: currentOrder });
});

/**
 * 6. XÓA ĐƠN HÀNG (Admin)
 * - Tự động hoàn kho trước khi xóa (nếu đơn chưa hủy)
 */
const deleteOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const order = await Order.findById(id);
  if (!order) return res.status(404).json({ message: "Đơn hàng không tồn tại" });

  // Nếu đơn hàng chưa bị hủy mà bị xóa -> Phải hoàn kho
  if (order.status !== "canceled") {
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product) {
        if (product.variants && product.variants.length > 0) {
          const vIndex = product.variants.findIndex(v => v.size === item.selectedSize);
          if (vIndex > -1) product.variants[vIndex].stock += item.quantity;
        } else {
          product.stock += item.quantity;
        }
        await product.save();
      }
    }
  }

  await Order.findByIdAndDelete(id);
  res.status(200).json({ ok: true, message: "Đã xóa đơn hàng và hoàn kho (nếu cần)" });
});

/**
 * 7. HỦY ĐƠN HÀNG (User tự hủy)
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.sub; 

  const order = await Order.findOne({ _id: id, userId });
  
  if (!order) {
    return res.status(404).json({ message: "Đơn hàng không tồn tại hoặc không phải của bạn" });
  }

  if (order.status !== "pending") {
    return res.status(400).json({ message: "Chỉ có thể hủy đơn hàng khi đang chờ xử lý." });
  }

  // Hoàn lại số lượng hàng vào kho
  for (const item of order.items) {
    const product = await Product.findById(item.productId);
    if (product) {
      if (product.variants && product.variants.length > 0) {
        const vIndex = product.variants.findIndex(v => v.size === item.selectedSize);
        if (vIndex > -1) product.variants[vIndex].stock += item.quantity;
      } else {
        product.stock += item.quantity;
      }
      await product.save();
    }
  }

  order.status = "canceled";
  await order.save();

  res.status(200).json({ ok: true, message: "Đơn hàng đã được hủy thành công" });
});

module.exports = { 
  createOrder, 
  listMyOrders, 
  getOrderById, 
  listOrders, 
  updateOrderStatus,
  deleteOrder,
  cancelOrder,
};