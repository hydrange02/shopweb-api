// Nội dung đúng cho src/controllers/orders.controller.js
const { Product } = require("../models/product.model");
const { calcTotals } = require("../lib/checkout");

async function createOrder(req, res, next) {
  try {
    const { Order } = require("../models/order.model");
    const { customerName, customerPhone, customerAddress, paymentMethod, note, items } = req.body;
    const snapshot = [];

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
        size: it.selectedSize // Lưu size từ FE gửi lên
      });
    }

    const totals = calcTotals(snapshot, customerAddress);
    const order = await Order.create({
      items: snapshot,
      ...totals,
      customerName, customerPhone, customerAddress, paymentMethod, note
    });

    return res.status(201).json({ ok: true, order });
  } catch (err) { next(err); }
}

module.exports = { createOrder };