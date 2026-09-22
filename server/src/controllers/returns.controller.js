const { z } = require('zod');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const prisma = require('../config/prismaClient');

const createReturnSchema = z.object({
  orderId: z.string().min(1),
  reason: z.string().min(1).max(500),
  items: z.array(z.object({ orderItemId: z.string().min(1), quantity: z.coerce.number().int().min(1) })).min(1),
});

// Returns foundation (Phase 4 scope per the brief) — request + status
// tracking exists; approval/refund workflow is admin-side (Phase 5).
const createReturn = asyncHandler(async (req, res) => {
  const body = createReturnSchema.parse(req.body);

  const order = await prisma.order.findFirst({
    where: { id: body.orderId, userId: req.user.id },
    include: { items: { select: { id: true, quantity: true } } },
  });
  if (!order) throw new ApiError(404, 'Order not found.');
  if (order.status !== 'DELIVERED') {
    throw new ApiError(400, 'Returns can only be requested for delivered orders.');
  }

  const orderItems = new Map(order.items.map(item => [item.id, item]));
  const requestedIds = new Set();
  for (const item of body.items) {
    const orderItem = orderItems.get(item.orderItemId);
    if (!orderItem || requestedIds.has(item.orderItemId) || item.quantity > orderItem.quantity) {
      throw new ApiError(400, 'One or more return items are invalid for this order.');
    }
    requestedIds.add(item.orderItemId);
  }

  const returnRequest = await prisma.return.create({
    data: {
      orderId: order.id,
      userId: req.user.id,
      reason: body.reason,
      items: { create: body.items },
    },
    include: { items: true },
  });

  res.status(201).json({ success: true, data: returnRequest });
});

const listReturns = asyncHandler(async (req, res) => {
  const returns = await prisma.return.findMany({
    where: { userId: req.user.id },
    orderBy: { createdAt: 'desc' },
    include: { items: true },
  });
  res.json({ success: true, data: returns });
});

module.exports = { createReturn, listReturns };
