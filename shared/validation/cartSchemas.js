const { z } = require('zod');

const addCartItemSchema = z.object({
  productId: z.string().min(1),
  variationId: z.string().min(1).optional(),
  quantity: z.coerce.number().int().min(1).max(20).default(1),
});

const updateCartItemSchema = z.object({
  quantity: z.coerce.number().int().min(0).max(20),
});

const applyCouponSchema = z.object({
  code: z.string().trim().min(1).nullable(),
});

module.exports = { addCartItemSchema, updateCartItemSchema, applyCouponSchema };
