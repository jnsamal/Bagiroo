const { z } = require('zod');

// E.164-ish phone validation (kept permissive; tighten once the SMS
// provider's exact format requirements are known).
const phoneNumber = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone number, e.g. +919999999999');

const phoneSchema = z.object({
  phone: phoneNumber,
  purpose: z.enum(['LOGIN', 'REGISTER']),
});

const otpVerifySchema = z.object({
  phone: phoneNumber,
  code: z.string().length(6, 'Enter the 6-digit code.'),
  purpose: z.enum(['LOGIN', 'REGISTER']),
  name: z.string().trim().min(1).max(120).optional(),
});

module.exports = { phoneSchema, otpVerifySchema };
