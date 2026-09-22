const { z } = require('zod');
const prisma = require('../../config/prismaClient');
const asyncHandler = require('../../middleware/asyncHandler');
const { ApiError } = require('../../middleware/errorHandler');

const listOrders = asyncHandler(async (req, res) => {
  const { status, q } = req.query;
  const where = {
    ...(status ? { status } : {}),
    ...(q ? { OR: [{ orderNumber: { contains: q } }, { guestEmail: { contains: q } }] } : {}),
  };

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: { items: true, user: { select: { name: true, phone: true } } },
    take: 100,
  });
  res.json({ success: true, data: orders });
});

const getOrder = asyncHandler(async (req, res) => {
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: { items: true, addresses: true, statusHistory: { orderBy: { createdAt: 'asc' } }, payments: true, user: true },
  });
  if (!order) throw new ApiError(404, 'Order not found.');
  res.json({ success: true, data: order });
});

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  note: z.string().optional(),
});

const updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note } = updateStatusSchema.parse(req.body);

  const order = await prisma.order.update({ where: { id: req.params.id }, data: { status } });
  await prisma.orderStatusHistory.create({ data: { orderId: order.id, status, note } });

  res.json({ success: true, data: order });
});

module.exports = { listOrders, getOrder, updateOrderStatus };
