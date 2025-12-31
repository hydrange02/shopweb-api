// src/controllers/cart.controller.js
const { Cart } = require("../models/cart.model");
const { asyncHandler } = require("../utils/async");

// 1. LẤY GIỎ HÀNG
const getCart = asyncHandler(async (req, res) => {
  const userId = req.user.id || req.user.sub || req.user._id;
  
  // Thêm try-catch hoặc xử lý an toàn cho findOne
  const cart = await Cart.findOne({ userId });

  if (!cart) {
    return res.status(200).json({ items: [] });
  }

  try {
    await cart.populate("items.productId");
  } catch (err) {
    console.error("GetCart Populate Error:", err);
  }

  res.status(200).json(cart);
});

// 2. THÊM VÀO GIỎ
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, selectedSize } = req.body;
  const userId = req.user.id || req.user.sub || req.user._id;

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({
      userId,
      items: [{ productId, quantity, selectedSize }],
    });
  } else {
    const itemIndex = cart.items.findIndex(
      (p) => p.productId.toString() === productId && p.selectedSize === selectedSize
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, selectedSize });
    }
    await cart.save();
  }

  // 🔥 QUAN TRỌNG: Phải populate trước khi res.json để Frontend không bị lỗi hiển thị
  try {
    await cart.populate("items.productId");
  } catch (err) {
    console.error("AddToCart Populate Error:", err);
  }
  
  res.status(200).json(cart);
});

// 3. CẬP NHẬT SỐ LƯỢNG
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity, selectedSize } = req.body;
  const userId = req.user.id || req.user.sub || req.user._id;

  const cart = await Cart.findOne({ userId });
  if (!cart) {
    return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.productId.toString() === productId && item.selectedSize === selectedSize
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity = quantity;
    await cart.save();
  }

  try {
    await cart.populate("items.productId");
  } catch (error) {
    console.error("UpdateCart Populate error:", error);
  }
  res.status(200).json(cart);
});

// 4. XÓA SẢN PHẨM
const removeCartItem = asyncHandler(async (req, res) => {
  const { productId, selectedSize } = req.body;
  const userId = req.user.id || req.user.sub || req.user._id;

  const cart = await Cart.findOne({ userId });
  if (cart) {
    cart.items = cart.items.filter(
      (item) => !(item.productId.toString() === productId && item.selectedSize === selectedSize)
    );
    await cart.save();
    
    try {
      await cart.populate("items.productId");
    } catch (err) {
      console.error("RemoveItem Populate error:", err);
    }
  }
  
  res.status(200).json(cart || { items: [] });
});

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };