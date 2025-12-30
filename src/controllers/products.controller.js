// src/controllers/products.controller.js
const { Product } = require("../models/product.model");
const { Review } = require("../models/review.model");

// Lấy danh sách (có lọc & phân trang)
async function getProducts(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page || "1"), 1);
    const limit = parseInt(req.query.limit || "12");
    const { category, q, minPrice, maxPrice, sort } = req.query;

    const filter = {};
    if (category) filter.category = category;
    if (q) filter.title = { $regex: q, $options: "i" };
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = parseInt(minPrice);
      if (maxPrice) filter.price.$lte = parseInt(maxPrice);
    }

    let sortOption = { createdAt: -1 };
    if (sort === "price_asc") sortOption = { price: 1 };
    if (sort === "price_desc") sortOption = { price: -1 };

    const [total, products] = await Promise.all([
      Product.countDocuments(filter),
      Product.find(filter)
        .sort(sortOption)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    // 🔥 LOGIC QUAN TRỌNG: Kiểm tra xem còn trang sau không
    const hasNext = page * limit < total;

    res.json({ 
      ok: true, 
      data: products, 
      page, 
      limit, 
      total,
      hasNext // <-- Frontend cần biến này để bật sáng nút "Tiếp theo"
    });
  } catch (err) { next(err); }
}

// Lấy chi tiết 1 sản phẩm
async function getProductBySlug(req, res, next) {
  try {
    const { slug } = req.params;
    let product = await Product.findOne({ slug }).lean();
    if (!product && slug.match(/^[0-9a-fA-F]{24}$/)) {
      product = await Product.findById(slug).lean();
    }

    if (!product) return res.status(404).json({ ok: false, error: "Not found" });

    const reviews = await Review.find({ product: product._id }).populate('user', 'name').lean();

    res.json({ ok: true, product: { ...product, reviews } });
  } catch (err) { next(err); }
}

// Thêm sản phẩm
async function createProduct(req, res, next) {
  try {
    const body = req.body;
    if (!body.slug && body.title) {
       body.slug = body.title.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
    }
    const product = await Product.create(body);
    res.status(201).json({ ok: true, product });
  } catch (err) { next(err); }
}

// Sửa sản phẩm
async function updateProduct(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, { new: true });
    if (!product) return res.status(404).json({ ok: false, error: "Product not found" });
    res.json({ ok: true, product });
  } catch (err) { next(err); }
}

// Xóa sản phẩm
async function deleteProduct(req, res, next) {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);
    if (!product) return res.status(404).json({ ok: false, error: "Product not found" });
    res.json({ ok: true, deletedId: id });
  } catch (err) { next(err); }
}

module.exports = { getProducts, getProductBySlug, createProduct, updateProduct, deleteProduct };