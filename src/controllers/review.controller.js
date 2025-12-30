const { Review } = require("../models/review.model");
const { Product } = require("../models/product.model");
const { asyncHandler } = require("../utils/async");

const createReview = asyncHandler(async (req, res) => {
  const { rating, comment } = req.body;
  const { productId } = req.params;
  const userId = req.user.id;

  const product = await Product.findById(productId);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const review = await Review.create({
    rating,
    comment,
    product: productId,
    user: userId,
  });

  res.status(201).json(review);
});

const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const reviews = await Review.find({ product: productId }).populate(
    "user",
    "name"
  );
  res.status(200).json(reviews);
});

const updateReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const { rating, comment } = req.body;
  const userId = req.user.id;

  const review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  if (review.user.toString() !== userId) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  review.rating = rating;
  review.comment = comment;
  await review.save();

  res.status(200).json(review);
});

const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;
  const userId = req.user.id;

  const review = await Review.findById(reviewId);
  if (!review) {
    return res.status(404).json({ message: "Review not found" });
  }

  if (review.user.toString() !== userId) {
    return res.status(403).json({ message: "Unauthorized" });
  }

  await review.remove();
  res.status(200).json({ message: "Review deleted" });
});

module.exports = {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
};
