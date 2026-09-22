const { z } = require('zod');

const addressSchema = z.object({
  fullName: z.string().min(1),
  phone: z.string().min(6),
  line1: z.string().min(1),
  line2: z.string().optional(),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(3),
  country: z.string().default('IN'),
});

const createOrderSchema = z.object({
  guestEmail: z.string().email().optional(),
  guestPhone: z.string().optional(),
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
});

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

module.exports = { addressSchema, createOrderSchema, verifyPaymentSchema };
