const { Schema, model } = require("mongoose");

const VariantSchema = new Schema(
  {
    color: { type: String, required: true },
    size: { type: String },
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, index: true },
    price: { type: Number, required: true, min: 0 },
    images: { type: [String], default: [] },
    stock: { type: Number, required: true, min: 0 },
    rating: { type: Number, min: 0, max: 5 },
    brand: { type: String },
    variants: { type: [VariantSchema], default: [] },
    description: { type: String },
    category: { type: String },
  },
  { timestamps: true, versionKey: false }
);

ProductSchema.index({ title: "text", brand: "text", category: "text" });

ProductSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    ret.id = ret._id;
    delete ret.__v;
    return ret;
  },
});

const Product = model("Product", ProductSchema);
module.exports = { Product };