const { z } = require('zod');
const prisma = require('../../config/prismaClient');
const asyncHandler = require('../../middleware/asyncHandler');
const { ApiError } = require('../../middleware/errorHandler');

const listReturns = asyncHandler(async (req, res) => {
  const returns = await prisma.return.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: true, order: { select: { orderNumber: true } }, user: { select: { name: true, phone: true } } },
  });
  res.json({ success: true, data: returns });
});

const decisionSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'COMPLETED']),
  refundStatus: z.enum(['NONE', 'PENDING', 'ISSUED']).optional(),
});

const decideReturn = asyncHandler(async (req, res) => {
  const body = decisionSchema.parse(req.body);
  const existing = await prisma.return.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Return request not found.');

  const updated = await prisma.return.update({
    where: { id: req.params.id },
    data: { status: body.status, refundStatus: body.refundStatus },
  });
  res.json({ success: true, data: updated });
});

module.exports = { listReturns, decideReturn };
