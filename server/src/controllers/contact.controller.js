const { z } = require('zod');
const prisma = require('../config/prismaClient');
const asyncHandler = require('../middleware/asyncHandler');

const contactSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform(value => value.toLowerCase()),
  phone: z.string().trim().max(30).optional().default(''),
  orderNumber: z.string().trim().max(100).optional().default(''),
  subject: z.enum(['Order help', 'Product question', 'Returns and refunds', 'Wholesale enquiry', 'Other']),
  message: z.string().trim().min(10).max(5000),
  website: z.string().max(0).optional(),
});

const create = asyncHandler(async (req, res) => {
  const { website: _honeypot, ...data } = contactSchema.parse(req.body);
  const enquiry = await prisma.contactMessage.create({ data: { ...data, phone: data.phone || null, orderNumber: data.orderNumber || null } });
  res.status(201).json({ success: true, data: { id: enquiry.id, message: 'Thanks — your message has been received.' } });
});

module.exports = { create };
