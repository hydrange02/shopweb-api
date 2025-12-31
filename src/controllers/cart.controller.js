// src/controllers/cart.controller.js
const { Cart } = require("../models/cart.model");
const { asyncHandler } = require("../utils/async");

// 1. LẤY GIỎ HÀNG
const getCart = asyncHandler(async (req, res) => {
  const userId = req.user.sub; // Hoặc req.user.id tùy middleware auth của bạn
  const cart = await Cart.findOne({ userId }).populate("items.productId");

  if (!cart) {
    return res.status(200).json({ items: [] });
  }
  res.status(200).json(cart);
});

// 2. THÊM VÀO GIỎ
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity, selectedSize } = req.body;
  const userId = req.user.sub;

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = await Cart.create({
      userId,
      items: [{ productId, quantity, selectedSize }],
    });
  } else {
    // Tìm item trùng cả ProductId và Size
    const itemIndex = cart.items.findIndex(
      (p) => 
        p.productId.toString() === productId && 
        p.selectedSize === selectedSize
    );

    if (itemIndex > -1) {
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, selectedSize });
    }
    await cart.save();
  } 

  res.status(200).json(cart);
});

// 3. CẬP NHẬT SỐ LƯỢNG (Hàm mới thêm để fix lỗi)
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId, quantity, selectedSize } = req.body;
  const userId = req.user.sub;

  const cart = await Cart.findOne({ userId });
  if (!cart) {
    return res.status(404).json({ message: "Giỏ hàng không tồn tại" });
  }

  const itemIndex = cart.items.findIndex(
    (item) => 
      item.productId.toString() === productId && 
      item.selectedSize === selectedSize
  );

  if (itemIndex > -1) {
    cart.items[itemIndex].quantity = quantity;
    await cart.save();
  }

  // Populate để trả về data đầy đủ (hình ảnh, tên...) cho frontend cập nhật ngay
  await cart.populate("items.productId");
  res.status(200).json(cart);
});

// 4. XÓA SẢN PHẨM (Đổi tên từ removeFromCart -> removeCartItem cho khớp Router)
const removeCartItem = asyncHandler(async (req, res) => {
  const { productId, selectedSize } = req.body;
  const userId = req.user.sub;

  const cart = await Cart.findOne({ userId });
  if (cart) {
    cart.items = cart.items.filter(
      (item) => 
        !(item.productId.toString() === productId && item.selectedSize === selectedSize)
    );
    await cart.save();
  }
  
  // Trả về cart mới nhất
  if (cart) await cart.populate("items.productId");
  res.status(200).json(cart || { items: [] });
});

// Xuất đúng tên hàm mà Router đang gọi
module.exports = { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeCartItem 
};