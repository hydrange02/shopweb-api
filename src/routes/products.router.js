const express = require("express");
const router = express.Router();
const { Product } = require("../models/product.model");

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// GET /api/v1/products/slug/:slug
router.get("/slug/:slug", async (req, res, next) => {
  try {
    const raw = (req.params.slug || "").toLowerCase().trim();
    const candidates = new Set([raw]);

    const m = raw.match(/^(.*-)?(\d+)$/);
    if (m) {
      const base = m[1] || "san-pham-";
      const num = m[2];
      candidates.add(base + num.padStart(2, "0"));
      candidates.add(base + num.padStart(3, "0"));
    }

    // 🔥 ĐÃ THÊM 'variants' VÀO SELECT PHÍA DƯỚI
    const p = await Product.findOne({ slug: { $in: Array.from(candidates) } })
      .select("_id slug title price images stock description category brand discountPercent rating variants")
      .lean();

    if (!p) {
      return res.status(404).json({ 
        ok: false, 
        error: { code: "PRODUCT_NOT_FOUND", message: "Sản phẩm không tồn tại" } 
      });
    }
    return res.json({ ok: true, product: p });
  } catch (e) {
    next(e);
  }
});

router.get("/", async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit || "12", 10), 1), 50);
    const q = String(req.query.q || "").trim();

    let filter = {};
    if (q) {
      const safeQ = escapeRegex(q);
      const regex = new RegExp(safeQ, "i");
      filter = {
        $or: [ { title: regex }, { brand: regex }, { category: regex } ],
      };
    }

    const [total, data] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
    ]);

    res.json({ data, page, limit, total, hasNext: page * limit < total });
  } catch (err) {
    next(err);
  }
});

module.exports = router;