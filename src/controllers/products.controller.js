const slugify = require("slugify");
const { Product } = require("../models/product.model");

function makeSlug(input) {
  return slugify(input, { lower: true, strict: true, locale: "vi" });
}

function pickUpdatable(body) {
  const allow = ["title", "slug", "price", "images", "stock", "rating", "brand", "variants", "description", "category"];
  const out = {};
  for (const k of allow) if (k in body) out[k] = body[k];
  return out;
}

async function createProduct(req, res, next) {
  try {
    const payload = req.body;
    const slug = payload.slug ? payload.slug : makeSlug(payload.title);
    const doc = await Product.create({ ...payload, slug });
    return res.status(201).json({ ok: true, product: doc.toJSON() });
  } catch (err) {
    if (err && err.code === 11000) {
      err.status = 409; // Conflict: duplicate slug
      err.message = "Duplicate slug";
    }
    return next(err);
  }
}

async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const patch = pickUpdatable(req.body);
    if (patch.title && !patch.slug) patch.slug = makeSlug(patch.title);

    const updated = await Product.findByIdAndUpdate(id, patch, { new: true, runValidators: true });
    if (!updated) return res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Product not found" } });
    return res.json({ ok: true, product: updated.toJSON() });
  } catch (err) {
    if (err && err.code === 11000) {
      err.status = 409;
      err.message = "Duplicate slug";
    }
    return next(err);
  }
}

async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const del = await Product.findByIdAndDelete(id);
    if (!del) return res.status(404).json({ ok: false, error: { code: "NOT_FOUND", message: "Product not found" } });
    return res.json({ ok: true, deletedId: id });
  } catch (err) {
    return next(err);
  }
}

module.exports = { createProduct, updateProduct, deleteProduct };