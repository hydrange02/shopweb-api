// src/controllers/cart.controller.js
const { Cart } = require("../models/cart.model");
const { asyncHandler } = require("../utils/async");

// 1. LẤY GIỎ HÀNG
const getCart = asyncHandler(async (req, res) => {
  // Lấy userId từ nhiều nguồn để tránh undefined
  const userId = req.user?.id || req.user?.sub || req.user?._id;

  if (!userId) {
    return res.status(401).json({ message: "Người dùng chưa xác thực" });
  }

  const cart = await Cart.findOne({ userId });

  if (!cart) {
    return res.status(200).json({ items: [] });
  }

  // Bảo vệ lệnh populate - Nếu sản phẩm bị xóa trong DB cũng không gây lỗi 500
  try {
    await cart.populate("items.productId");
  } catch (err) {
    console.error("Lỗi Populate GetCart:", err);
  }

  res.status(200).json(cart);
});

// 2. THÊM VÀO GIỎ
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, selectedSize } = req.body;
  const userId = req.user?.id || req.user?.sub || req.user?._id;

  if (!userId) {
    return res.status(401).json({ message: "Người dùng chưa xác thực" });
  }

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({
      userId,
      items: [{ productId, quantity, selectedSize }],
    });
  } else {
    // SỬA QUAN TRỌNG: Thêm dấu ?. trước toString() để tránh crash nếu productId bị null
    const itemIndex = cart.items.findIndex(
      (p) => p.productId?.toString() === productId && p.selectedSize === selectedSize
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += (quantity || 1);
    } else {
      cart.items.push({ productId, quantity, selectedSize });
    }
    await cart.save();
  }

  // Populate lại để Frontend có đủ dữ liệu (tên, ảnh) hiển thị ngay
  try {
    await cart.populate("items.productId");
  } catch (err) {
    console.error("Lỗi Populate AddToCart:", err);
  }

  res.status(200).json(cart);
});

// 3. CẬP NHẬT SỐ LƯỢNG
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity, selectedSize } = req.body;
  const userId = req.user?.id || req.user?.sub || req.user?._id;

  const cart = await Cart.findOne({ userId });
  if (!cart) {
    return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.productId?.toString() === productId && item.selectedSize === selectedSize
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity = quantity;
    await cart.save();
  }

  try {
    await cart.populate("items.productId");
  } catch (error) {
    console.error("Populate error:", error);
  }
  res.status(200).json(cart);
});

// 4. XÓA SẢN PHẨM
const removeCartItem = asyncHandler(async (req, res) => {
  const { productId, selectedSize } = req.body;
  const userId = req.user?.id || req.user?.sub || req.user?._id;

  const cart = await Cart.findOne({ userId });
  if (cart) {
    // SỬA QUAN TRỌNG: Kiểm tra p.productId tồn tại trước khi toString()
    cart.items = cart.items.filter(
      (item) => 
        !(item.productId?.toString() === productId && item.selectedSize === selectedSize)
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

module.exports = { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeCartItem 
};