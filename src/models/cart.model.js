// src/models/cart.model.js
const { Schema, model, Types } = require("mongoose");

const CartItemSchema = new Schema(
  {
    productId: { type: Types.ObjectId, ref: "Product", required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    // 🟢 Lưu size đã chọn
    selectedSize: { type: String }, 
  },
  { _id: false }
);

const CartSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: "User", required: true, unique: true },
    items: [CartItemSchema],
  },
  { timestamps: true, versionKey: false }
);

const Cart = model("Cart", CartSchema);
module.exports = { Cart };