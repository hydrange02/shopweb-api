// src/controllers/orders.controller.js
const { Product } = require("../models/product.model");
const { Order } = require("../models/order.model");
const { Cart } = require("../models/cart.model"); 
const { calcTotals } = require("../lib/checkout");

/**
 * 1. TẠO ĐƠN HÀNG MỚI
 * - Kiểm tra tồn kho
 * - Trừ kho ngay khi tạo đơn thành công
 * - Xóa giỏ hàng (nếu là user)
 */
async function createOrder(req, res, next) {
  try {
    const { customerName, customerPhone, customerAddress, paymentMethod, note, items } = req.body;
    const snapshot = [];

    // 1.1. Duyệt qua từng sản phẩm để kiểm tra kho & lấy giá
    for (const it of items) {
      const p = await Product.findById(it.productId);
      if (!p) throw new Error(`Sản phẩm ${it.productId} không tồn tại`);
      
      // Kiểm tra số lượng tồn kho
      if (p.stock < it.quantity) {
        return res.status(400).json({ 
            ok: false, 
            message: `Sản phẩm "${p.title}" chỉ còn ${p.stock} cái, không đủ để đặt ${it.quantity} cái.` 
        });
      }

      const finalPrice = p.discountPercent 
        ? Math.round(p.price * (1 - p.discountPercent / 100)) 
        : p.price;

      snapshot.push({
        productId: p._id,
        title: p.title,
        price: finalPrice,
        quantity: it.quantity,
        image: p.images?.[0],
        size: it.selectedSize // Lưu size khách chọn
      });
    }

    // 1.2. Tính toán tổng tiền
    const totals = calcTotals(snapshot, customerAddress);

    // 1.3. Chuẩn bị dữ liệu đơn hàng
    const payload = {
      items: snapshot,
      ...totals,
      customerName, customerPhone, customerAddress, paymentMethod, note
    };

    // Nếu user đang đăng nhập, gắn userId vào đơn
    if (req.user && req.user.sub) {
      payload.userId = req.user.sub;
    }

    // 1.4. Tạo đơn hàng
    const order = await Order.create(payload);

    // 1.5. 🔥 TRỪ KHO NGAY LẬP TỨC
    await Promise.all(
        snapshot.map(item => 
            Product.findByIdAndUpdate(item.productId, { 
                $inc: { stock: -item.quantity } // Trừ số lượng
            })
        )
    );

    // 1.6. Xóa giỏ hàng sau khi đặt thành công (nếu là user)
    if (req.user && req.user.sub) {
       await Cart.findOneAndDelete({ userId: req.user.sub });
    }

    return res.status(201).json({ ok: true, order });
  } catch (err) { next(err); }
}

/**
 * 2. LẤY DANH SÁCH ĐƠN HÀNG CỦA TÔI (Cho User)
 */
async function listMyOrders(req, res, next) {
  try {
    const userId = req.user.sub; 
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
    return res.json({ ok: true, data: orders });
  } catch (err) {
    next(err);
  }
}

/**
 * 3. LẤY CHI TIẾT 1 ĐƠN HÀNG
 */
async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).lean();
    
    if (!order) {
      return res.status(404).json({ ok: false, error: "Đơn hàng không tồn tại" });
    }
    return res.json({ ok: true, order });
  } catch (err) {
    next(err);
  }
}

/**
 * 4. LẤY DANH SÁCH TẤT CẢ ĐƠN HÀNG (Cho Admin)
 */
async function listOrders(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "20", 10), 1), 50);
    const q = req.query.q; 

    const filter = {};
    if (q) {
      const isObjectId = /^[0-9a-fA-F]{24}$/.test(q);
      if (isObjectId) {
         filter._id = q;
      } else {
         filter.$or = [
            { customerName: { $regex: q, $options: "i" } },
            { customerPhone: { $regex: q, $options: "i" } }
         ];
      }
    }

    const [total, data] = await Promise.all([
      Order.countDocuments(filter),
      Order.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return res.json({ 
      ok: true, 
      data, 
      page, 
      limit, 
      total, 
      hasNext: page * limit < total 
    });
  } catch (err) {
    next(err);
  }
}

/**
 * 5. CẬP NHẬT TRẠNG THÁI ĐƠN HÀNG (Cho Admin)
 * - Tự động hoàn kho nếu trạng thái chuyển sang "canceled"
 */
async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "paid", "canceled", "shipping", "completed"];
    if (!validStatuses.includes(status)) {
       return res.status(400).json({ ok: false, message: "Trạng thái không hợp lệ" });
    }

    const currentOrder = await Order.findById(id);
    if (!currentOrder) {
      return res.status(404).json({ ok: false, error: "Không tìm thấy đơn hàng" });
    }

    // 🔥 LOGIC HOÀN KHO: Nếu HỦY đơn -> Cộng lại số lượng
    if (status === "canceled" && currentOrder.status !== "canceled") {
        await Promise.all(
            currentOrder.items.map(item => 
                Product.findByIdAndUpdate(item.productId, { 
                    $inc: { stock: item.quantity } 
                })
            )
        );
    }

    // 🔥 LOGIC: Nếu đang HỦY mà chuyển sang trạng thái khác -> Trừ lại kho
    if (currentOrder.status === "canceled" && status !== "canceled") {
         await Promise.all(
            currentOrder.items.map(item => 
                Product.findByIdAndUpdate(item.productId, { 
                    $inc: { stock: -item.quantity } 
                })
            )
        );
    }

    currentOrder.status = status;
    await currentOrder.save();

    return res.json({ ok: true, order: currentOrder });
  } catch (err) {
    next(err);
  }
}

/**
 * 6. XÓA ĐƠN HÀNG (Cho Admin)
 * - Tự động hoàn kho trước khi xóa (nếu đơn chưa hủy)
 */
async function deleteOrder(req, res, next) {
  try {
    const { id } = req.params;
    
    // Tìm đơn hàng
    const order = await Order.findById(id);
    if (!order) return res.status(404).json({ ok: false, message: "Đơn hàng không tồn tại" });

    // Nếu đơn hàng CHƯA bị hủy, tức là hàng vẫn đang bị trừ kho.
    // Khi xóa đơn này, ta phải HOÀN TRẢ số lượng về kho.
    if (order.status !== "canceled") {
       await Promise.all(
          order.items.map(item =>
              Product.findByIdAndUpdate(item.productId, {
                  $inc: { stock: item.quantity }
              })
          )
      );
    }

    // Xóa vĩnh viễn khỏi DB
    await Order.findByIdAndDelete(id);

    return res.json({ ok: true, message: "Đã xóa đơn hàng và cập nhật kho thành công" });
  } catch (err) {
    next(err);
  }
}

async function cancelOrder(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.sub; // Lấy ID người dùng từ token

    // 1. Tìm đơn hàng của chính người dùng đó
    const order = await Order.findOne({ _id: id, userId });
    
    if (!order) {
      return res.status(404).json({ ok: false, message: "Đơn hàng không tồn tại hoặc không phải của bạn" });
    }

    // 2. Chỉ cho phép hủy nếu đơn hàng đang "Chờ xử lý"
    if (order.status !== "pending") {
      return res.status(400).json({ ok: false, message: "Chỉ có thể hủy đơn hàng khi đang chờ xử lý." });
    }

    // 3. Hoàn lại số lượng hàng vào kho
    await Promise.all(
        order.items.map(item =>
            Product.findByIdAndUpdate(item.productId, {
                $inc: { stock: item.quantity } // Cộng lại số lượng
            })
        )
    );

    // 4. Cập nhật trạng thái thành 'canceled'
    order.status = "canceled";
    await order.save();

    return res.json({ ok: true, message: "Đơn hàng đã được hủy thành công" });
  } catch (err) {
    next(err);
  }
}

// Xuất đầy đủ 6 hàm
module.exports = { 
  createOrder, 
  listMyOrders, 
  getOrderById, 
  listOrders, 
  updateOrderStatus,
  deleteOrder,
  cancelOrder,
};