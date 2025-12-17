const { z } = require("zod");

const variantSchema = z.object({ color: z.string().min(1), size: z.string().optional() });

const base = {
  title: z.string().min(2),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/).optional(),
  price: z.number().nonnegative(),
  images: z.array(z.string()).optional(),
  stock: z.number().int().min(0),
  rating: z.number().min(0).max(5).optional(),
  brand: z.string().optional(),
  variants: z.array(variantSchema).optional(),
  description: z.string().optional(),
  category: z.string().optional(),
};

const createProductSchema = z.object(base);

const updateProductSchema = z
  .object({
    title: z.string().min(2).optional(),
    slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
    price: z.number().nonnegative().optional(),
    images: z.array(z.string()).optional(),
    stock: z.number().int().min(0).optional(),
    rating: z.number().min(0).max(5).optional(),
    brand: z.string().optional(),
    variants: z.array(variantSchema).optional(),
    description: z.string().optional(),
    category: z.string().optional(),
  })
  .refine((o) => Object.keys(o).length > 0, { message: "No fields to update" });

module.exports = { createProductSchema, updateProductSchema };