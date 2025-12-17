const { Schema, model, Types } = require("mongoose");

const OrderItemSchema = new Schema(
  {
    productId: { type: Types.ObjectId, ref: "Product", required: true },
    title: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    image: { type: String },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },

    customerName: { type: String, required: true },
    customerPhone: { type: String },
    customerAddress: { type: String },
    paymentMethod: { type: String, enum: ["cod", "banking", "momo"], default: "cod" },
    note: { type: String },
    status: { type: String, enum: ["pending", "paid", "canceled"], default: "pending" },
  },
  { timestamps: true, versionKey: false }
);

OrderSchema.index({ createdAt: -1 });
OrderSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => { ret.id = ret._id; return ret; },
});

const Order = model("Order", OrderSchema);
module.exports = { Order };