const { z } = require('zod');
const prisma = require('../config/prismaClient');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

const subscribeSchema = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  source: z.string().optional(),
});

const subscribe = asyncHandler(async (req, res) => {
  const { email, source } = subscribeSchema.parse(req.body);

  const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
  if (existing) {
    // Idempotent — don't error on a duplicate signup, just confirm.
    return res.json({ success: true, data: { message: "You're already subscribed." } });
  }

  await prisma.newsletterSubscriber.create({
    data: { email, source: source || 'homepage_footer' },
  });

  res.status(201).json({ success: true, data: { message: 'Subscribed.' } });
});

module.exports = { subscribe };
