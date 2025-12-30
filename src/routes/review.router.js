const { Router } = require("express");
const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
} = require("../controllers/review.controller");
const { auth } = require("../middlewares/auth");

const reviewRouter = Router();

reviewRouter.post("/products/:productId/reviews", auth, createReview);
reviewRouter.get("/products/:productId/reviews", getProductReviews);
reviewRouter.put("/reviews/:reviewId", auth, updateReview);
reviewRouter.delete("/reviews/:reviewId", auth, deleteReview);

module.exports = { reviewRouter };
