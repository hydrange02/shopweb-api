// src/routes/cart.router.js
const express = require("express");
const router = express.Router();
const { requireAuth } = require("../middlewares/auth");
const { getCart, addToCart, updateCartItem, removeCartItem } = require("../controllers/cart.controller");

// Tất cả thao tác giỏ hàng đều cần đăng nhập
router.use(requireAuth);

router.get("/", getCart);           // Xem giỏ
router.post("/add", addToCart);     // Thêm vào giỏ
router.put("/update", updateCartItem); // Sửa số lượng
router.delete("/remove", removeCartItem); // Xóa sản phẩm

module.exports = router;