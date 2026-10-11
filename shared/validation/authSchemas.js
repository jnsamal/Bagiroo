const { z } = require('zod');

const phoneNumber = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{7,14}$/, 'Enter a valid phone number, e.g. +919999999999');

const emailOtpRequestSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(254).transform(value => value.toLowerCase()),
  purpose: z.enum(['LOGIN', 'REGISTER']),
});

const otpVerifySchema = z.object({
  email: z.string().trim().email('Enter a valid email address.').max(254).transform(value => value.toLowerCase()),
  code: z.string().length(6, 'Enter the 6-digit code.'),
  purpose: z.enum(['LOGIN', 'REGISTER']),
  name: z.string().trim().min(1).max(120).optional(),
});

module.exports = { emailOtpRequestSchema, otpVerifySchema, phoneNumber };
