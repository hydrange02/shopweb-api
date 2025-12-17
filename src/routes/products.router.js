const express = require("express");
const router = express.Router(); // Khai báo router ngay đầu

// 1. Imports Models & Utils
const { Product } = require("../models/product.model");
const { createProduct, updateProduct, deleteProduct } = require("../controllers/products.controller");
const { createProductSchema, updateProductSchema } = require("../schemas/product.dto");
const { validate } = require("../middlewares/validate");
const { asyncHandler } = require("../utils/async");
const { requireAuth, requireRole } = require("../middlewares/auth");

// ==========================================
// PUBLIC ROUTES (Ai cũng xem được)
// ==========================================

// GET /api/v1/products?page=&limit=&q=
router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "12", 10), 1), 50);
    const q = String(req.query.q || "").trim();

    const filter = q
      ? {
          $or: [
            { title: new RegExp(q, "i") },
            { brand: new RegExp(q, "i") },
            { category: new RegExp(q, "i") },
          ],
        }
      : {};

    const total = await Product.countDocuments(filter);
    const data = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    const hasNext = page * limit < total;
    res.json({ data, page, limit, total, hasNext });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/products/slug/:slug (Tìm thông minh 01, 001)
router.get("/slug/:slug", async (req, res, next) => {
  try {
    const raw = (req.params.slug || "").toLowerCase().trim();
    const candidates = new Set([raw]);

    const m = raw.match(/^(.*-)(\d+)$/);
    if (m) {
      const base = m[1];
      const num = m[2];
      candidates.add(base + num.padStart(2, "0")); // vd: san-pham-01
      candidates.add(base + num.padStart(3, "0")); // vd: san-pham-001
    }

    const p = await Product.findOne({ slug: { $in: Array.from(candidates) } })
      .select("_id slug title price images stock")
      .lean();

    if (!p) {
      return res.status(404).json({ ok: false, error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" } });
    }
    return res.json({ ok: true, product: p });
  } catch (e) {
    next(e);
  }
});

// GET /api/v1/products/:slug (Tìm chính xác slug hoặc id tùy logic của bạn, đặt sau route /slug/...)
router.get("/:slug", async (req, res, next) => {
  try {
    const { slug } = req.params;
    const product = await Product.findOne({ slug }).lean();
    if (!product) {
      return res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Product not found" } });
    }
    res.json(product);
  } catch (err) {
    next(err);
  }
});

// ==========================================
// PROTECTED ROUTES (Phải là Admin mới làm được)
// ==========================================

// Create
router.post(
  "/",
  requireAuth,           // 1. Kiểm tra đăng nhập
  requireRole("admin"),  // 2. Kiểm tra quyền Admin
  validate(createProductSchema, "body"), // 3. Validate dữ liệu
  asyncHandler(createProduct) // 4. Xử lý logic
);

// Update by id
router.patch(
  "/:id",
  requireAuth,
  requireRole("admin"),
  validate(updateProductSchema, "body"),
  asyncHandler(updateProduct)
);

// Delete by id
router.delete(
  "/:id",
  requireAuth,
  requireRole("admin"),
  asyncHandler(deleteProduct)
);

module.exports = router;