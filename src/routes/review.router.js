const express = require("express");
const router = express.Router({ mergeParams: true });
const {
  createReview,
  getProductReviews,
  updateReview,
  deleteReview,
} = require("../controllers/review.controller");

// identifyUser: Nhận diện user nếu có token, nếu không thì coi là khách
const { requireAuth, identifyUser } = require("../middlewares/auth");

// GET: Ai cũng xem được
router.get("/products/:productId/reviews", identifyUser, getProductReviews);

// POST: Dùng identifyUser để cho phép cả khách đánh giá
router.post("/products/:productId/reviews", identifyUser, createReview);

// PUT/DELETE: Vẫn giữ requireAuth (bảo mật khi sửa/xóa)
router.put("/reviews/:reviewId", requireAuth, updateReview);
router.delete("/reviews/:reviewId", requireAuth, deleteReview);

// 🔥 QUAN TRỌNG: Export trực tiếp router để tránh lỗi undefined bên app.js
module.exports = router;