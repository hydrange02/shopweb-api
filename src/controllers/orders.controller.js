const { isValidObjectId } = require("mongoose");
const { Product } = require("../models/product.model");
const { Order } = require("../models/order.model");
const { calcTotals } = require("../lib/checkout");

async function createOrder(req, res, next) {
  try {
    const { customerName, customerPhone, customerAddress, paymentMethod, note, items } = req.body;

    const snapshot = [];

    for (const it of items) {
      let p = null;

      if (isValidObjectId(it.productId)) {
        p = await Product.findById(it.productId).lean();
      } else {
        // Fallback: nếu không phải ObjectId → coi là slug
        p = await Product.findOne({ slug: it.productId }).lean();
      }

      if (!p) return res.status(404).json({ ok: false, error: { code: "PRODUCT_NOT_FOUND", message: String(it.productId) } });
      if ((p.stock ?? 0) < it.quantity) return res.status(400).json({ ok: false, error: { code: "OUT_OF_STOCK", message: p.title } });

      snapshot.push({ productId: p._id, title: p.title, price: p.price, quantity: it.quantity, image: p.images?.[0] });
    }

    const totals = calcTotals(snapshot, customerAddress);

    const order = await Order.create({
      items: snapshot,
      subtotal: totals.subtotal,
      shippingFee: totals.shippingFee,
      total: totals.total,
      customerName, customerPhone, customerAddress, paymentMethod, note,
      status: "pending",
    });

    return res.status(201).json({ ok: true, order: order.toJSON() });
  } catch (err) { next(err); }
}

async function getOrderById(req, res, next) {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ ok: false, error: { code: "BAD_ID", message: "Invalid order id" } });
    const order = await Order.findById(id).lean();
    if (!order) return res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Order not found" } });
    return res.json({ ok: true, order });
  } catch (err) { next(err); }
}

async function listOrders(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "10", 10), 1), 50);
    const qPhone = (req.query.phone || "").trim();
    const qStatus = (req.query.status || "").trim();

    const cond = {};
    if (qPhone) cond.customerPhone = new RegExp(qPhone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    if (qStatus) cond.status = qStatus;

    const [data, total] = await Promise.all([
      Order.find(cond).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      Order.countDocuments(cond)
    ]);

    return res.json({ ok: true, data, page, limit, total, hasNext: page * limit < total });
  } catch (err) { next(err); }
}

module.exports = { createOrder, getOrderById, listOrders };