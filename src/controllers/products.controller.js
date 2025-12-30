// src/controllers/products.controller.js
const { Product } = require("../models/product.model");
const { asyncHandler } = require("../utils/async");

/**
 * 1. LẤY DANH SÁCH SẢN PHẨM (Có lọc, tìm kiếm, phân trang)
 */
const getAllProducts = asyncHandler(async (req, res) => {
  // Lấy các tham số từ query string
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 12;
  const skip = (page - 1) * limit;

  const { q, category, minPrice, maxPrice, sort } = req.query;

  // Xây dựng bộ lọc
  const filter = {};

  // Tìm kiếm theo tên
  if (q) {
    filter.title = { $regex: q, $options: "i" };
  }

  // Lọc theo danh mục
  if (category && category !== "all") {
    filter.category = category;
  }

  // Lọc theo khoảng giá
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }

  // Xây dựng sắp xếp
  let sortOption = { createdAt: -1 }; // Mặc định mới nhất
  if (sort === "price_asc") sortOption = { price: 1 };
  if (sort === "price_desc") sortOption = { price: -1 };
  if (sort === "best_selling") sortOption = { sold: -1 };

  // Thực hiện query song song (đếm tổng + lấy data)
  const [products, total] = await Promise.all([
    Product.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit)
      .lean(), 
    Product.countDocuments(filter),
  ]);

  // 🔥 SỬA QUAN TRỌNG TẠI ĐÂY:
  // Đổi cấu trúc JSON trả về để Frontend đọc được
  res.status(200).json({
    data: products,                // Frontend tìm 'data.data' nên chỗ này phải tên là 'data'
    page,
    limit,
    total,
    hasNext: page * limit < total, // Frontend cần biến này để hiện nút "Tiếp theo"
    totalPages: Math.ceil(total / limit),
  });
});

/**
 * 2. LẤY CHI TIẾT SẢN PHẨM THEO SLUG (Cho trang chi tiết)
 */
const getProductBySlug = asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const product = await Product.findOne({ slug });

  if (!product) {
    return res.status(404).json({ ok: false, message: "Sản phẩm không tồn tại" });
  }

  // 🔥 SỬA: Bọc product vào object { ok: true, product: ... }
  res.status(200).json({ ok: true, product });
});

/**
 * 3. LẤY CHI TIẾT SẢN PHẨM THEO ID
 */
const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);

  if (!product) {
    return res.status(404).json({ ok: false, message: "Sản phẩm không tồn tại" });
  }

  res.status(200).json({ ok: true, product });
});

/**
 * 4. TẠO SẢN PHẨM MỚI
 */
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  // 🔥 SỬA: Bọc kết quả trả về
  res.status(201).json({ ok: true, product });
});

/**
 * 5. CẬP NHẬT SẢN PHẨM
 */
const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  
  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ ok: false, message: "Sản phẩm không tồn tại" });
  }

  Object.assign(product, req.body);
  await product.save();

  // 🔥 SỬA: Bọc kết quả trả về
  res.status(200).json({ ok: true, product });
});

/**
 * 6. XÓA SẢN PHẨM
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findByIdAndDelete(id);

  if (!product) {
    return res.status(404).json({ message: "Sản phẩm không tồn tại" });
  }

  res.status(200).json({ message: "Đã xóa sản phẩm thành công" });
});

module.exports = {
  getAllProducts,
  getProductBySlug,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
};