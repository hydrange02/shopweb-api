// src/controllers/orders.controller.js
const { Product } = require("../models/product.model");
const { Order } = require("../models/order.model");
const { Cart } = require("../models/cart.model"); // <-- Import Cart
const { calcTotals } = require("../lib/checkout");

async function createOrder(req, res, next) {
  try {
    const { customerName, customerPhone, customerAddress, paymentMethod, note, items } = req.body;
    const snapshot = [];

    // 1. Duyệt qua từng sản phẩm để lấy giá và thông tin mới nhất từ DB
    for (const it of items) {
      const p = await Product.findById(it.productId);
      if (!p) throw new Error(`Sản phẩm ${it.productId} không tồn tại`);
      
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

    // 2. Tính toán tổng tiền
    const totals = calcTotals(snapshot, customerAddress);

    // 3. Tạo đơn hàng
    const order = await Order.create({
      items: snapshot,
      ...totals,
      customerName, customerPhone, customerAddress, paymentMethod, note
    });

    // 4. 🔥 LOGIC MỚI: XÓA GIỎ HÀNG SAU KHI ĐẶT THÀNH CÔNG
    // Nếu người dùng đang đăng nhập (có req.user), tìm và xóa giỏ hàng của họ
    if (req.user && req.user.sub) {
       await Cart.findOneAndDelete({ userId: req.user.sub });
    }

    return res.status(201).json({ ok: true, order });
  } catch (err) { next(err); }
}

async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    const order = await Order.findById(id).lean();
    
    if (!order) {
      return res.status(404).json({ 
        ok: false, 
        error: { code: "NOT_FOUND", message: "Đơn hàng không tồn tại" } 
      });
    }
    return res.json({ ok: true, order });
  } catch (err) {
    next(err);
  }
}

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

async function updateOrderStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "paid", "canceled", "shipping", "completed"];
    if (!validStatuses.includes(status)) {
       return res.status(400).json({ ok: false, message: "Trạng thái không hợp lệ" });
    }

    const order = await Order.findByIdAndUpdate(
      id, 
      { status }, 
      { new: true } 
    );

    if (!order) {
      return res.status(404).json({ ok: false, error: "Không tìm thấy đơn hàng" });
    }

    return res.json({ ok: true, order });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, getOrderById, listOrders, updateOrderStatus };