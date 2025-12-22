// src/controllers/cart.controller.js
const { Cart } = require("../models/cart.model");
const { Product } = require("../models/product.model");

// 1. Lấy giỏ hàng của user hiện tại
async function getCart(req, res, next) {
  try {
    const userId = req.user.sub; // Lấy từ token (middleware requireAuth)
    let cart = await Cart.findOne({ userId }).populate("items.productId", "title price images slug");

    if (!cart) {
      // Nếu chưa có, trả về mảng rỗng (hoặc tự tạo mới tùy logic FE)
      return res.json({ ok: true, items: [] });
    }

    return res.json({ ok: true, items: cart.items });
  } catch (err) {
    next(err);
  }
}

// 2. Thêm sản phẩm vào giỏ
async function addToCart(req, res, next) {
  try {
    const userId = req.user.sub;
    const { productId, quantity, selectedSize } = req.body;

    // Kiểm tra sản phẩm có tồn tại không
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ ok: false, message: "Sản phẩm không tồn tại" });

    // Tìm giỏ hàng của user
    let cart = await Cart.findOne({ userId });

    if (!cart) {
      // Nếu chưa có giỏ -> tạo mới
      cart = await Cart.create({
        userId,
        items: [{ productId, quantity, selectedSize }]
      });
    } else {
      // Nếu đã có giỏ -> kiểm tra sản phẩm trùng (cùng ID và cùng Size)
      const itemIndex = cart.items.findIndex(p => 
        p.productId.toString() === productId && p.selectedSize === selectedSize
      );

      if (itemIndex > -1) {
        // Đã có -> cộng dồn số lượng
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Chưa có -> push vào mảng
        cart.items.push({ productId, quantity, selectedSize });
      }
      await cart.save();
    }

    return res.json({ ok: true, message: "Đã thêm vào giỏ hàng", cart });
  } catch (err) {
    next(err);
  }
}

// 3. Cập nhật số lượng item
async function updateCartItem(req, res, next) {
  try {
    const userId = req.user.sub;
    const { productId, quantity, selectedSize } = req.body;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ ok: false, message: "Giỏ hàng trống" });

    const itemIndex = cart.items.findIndex(p => 
        p.productId.toString() === productId && p.selectedSize === selectedSize
    );

    if (itemIndex > -1) {
      if (quantity > 0) {
        cart.items[itemIndex].quantity = quantity;
      } else {
        // Nếu số lượng <= 0 thì xóa luôn
        cart.items.splice(itemIndex, 1);
      }
      await cart.save();
    }

    return res.json({ ok: true, cart });
  } catch (err) {
    next(err);
  }
}

// 4. Xóa item khỏi giỏ
async function removeCartItem(req, res, next) {
  try {
    const userId = req.user.sub;
    const { productId, selectedSize } = req.body;

    const cart = await Cart.findOne({ userId });
    if (cart) {
      cart.items = cart.items.filter(p => 
        !(p.productId.toString() === productId && p.selectedSize === selectedSize)
      );
      await cart.save();
    }
    return res.json({ ok: true, cart });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, addToCart, updateCartItem, removeCartItem };