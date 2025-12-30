const { Review } = require("../models/review.model");
const { Product } = require("../models/product.model");
const { asyncHandler } = require("../utils/async");

const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;
  
  // 🔥 FIX: Lấy userId nếu có (đã đăng nhập), nếu không thì để null
  // Middleware identifyUser sẽ gán req.user nếu token hợp lệ
  const userId = req.user ? (req.user.id || req.user._id || req.user.sub) : null;

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Sản phẩm không tồn tại" });
  }

  // 🔥 ĐÃ BỎ: Đoạn code kiểm tra existingReview để cho phép đánh giá nhiều lần

  const review = await Review.create({
    rating,
    comment,
    product: productId,
    user: userId, // Nếu khách thì userId là null
  });

  res.status(201).json(review);
});

const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const reviews = await Review.find({ product: productId })
    .populate("user", "name") 
    .sort({ createdAt: -1 });

  res.status(200).json(reviews);
});

const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const userId = req.user.id || req.user._id || req.user.sub;

  const review = await Review.findById(reviewId);
  if (!review) return res.status(404).json({ message: "Review not found" });

  if (!review.user || review.user.toString() !== userId.toString()) {
    return res.status(403).json({ message: "Không có quyền sửa đánh giá này" });
  }

  review.rating = rating;
  review.comment = comment;
  await review.save();

  res.status(200).json(review);
});

const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  
  if (!req.user) return res.status(401).json({ message: "Unauthorized" });
  const userId = req.user.id || req.user._id || req.user.sub;

  const review = await Review.findById(reviewId);
  if (!review) return res.status(404).json({ message: "Review not found" });

  const isOwner = review.user && review.user.toString() === userId.toString();
  const isAdmin = req.user.role === "admin";

  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: "Không có quyền xóa đánh giá này" });
  }

  await review.deleteOne();
  res.status(200).json({ message: "Đã xóa đánh giá" });
});

module.exports = {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
};