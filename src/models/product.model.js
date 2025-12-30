// src/models/product.model.js
const { Schema, model } = require("mongoose");
const slugify = require("slugify");

const ProductSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, unique: true },
    description: String,
    price: { type: Number, required: true },
    originalPrice: Number,
    discountPercent: { type: Number, default: 0 },
    images: [String],
    category: { type: String, default: "Uncategorized" },
    
    // 🟢 Stock tổng (Sẽ được tự động tính, không cần nhập tay)
    stock: { type: Number, default: 0 },

    // 🟢 Các biến thể (Size)
    variants: [
      {
        size: { type: String, required: true }, // S, M, L...
        stock: { type: Number, default: 0 },    // Stock riêng của size đó
      }
    ],

    ratings: {
      average: { type: Number, default: 0 },
      count: { type: Number, default: 0 },
    },
    sold: { type: Number, default: 0 },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
  },
  { timestamps: true, versionKey: false }
);

// 🟢 HOOK QUAN TRỌNG: Trước khi Save, tự động tính tổng Stock
ProductSchema.pre("save", function (next) {
  // 1. Tạo slug nếu chưa có hoặc đổi tên
  if (this.isModified("title")) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }

  // 2. Tính tổng stock từ variants (nếu có variants)
  if (this.variants && this.variants.length > 0) {
    this.stock = this.variants.reduce((total, v) => total + (v.stock || 0), 0);
  }

  next();
});

const Product = model("Product", ProductSchema);
module.exports = { Product };