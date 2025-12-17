const { z } = require("zod");

const orderItemInputSchema = z.object({
  productId: z.string().min(1), // FE gửi _id Mongo (hoặc slug - xem fallback ở controller)
  quantity: z.number().int().min(1),
});

const createOrderSchema = z.object({
  customerName: z.string().min(2),
  customerPhone: z.string().min(8).optional(),
  customerAddress: z.string().min(5),
  paymentMethod: z.enum(["cod", "banking", "momo"]).default("cod"),
  note: z.string().max(500).optional(),
  items: z.array(orderItemInputSchema).min(1),
});

module.exports = { createOrderSchema };