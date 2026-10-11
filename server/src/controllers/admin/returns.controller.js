const { z } = require('zod');
const prisma = require('../../config/prismaClient');
const asyncHandler = require('../../middleware/asyncHandler');
const { ApiError } = require('../../middleware/errorHandler');

const RETURNS_ENABLED_KEY = 'returns_enabled';

const listReturns = asyncHandler(async (req, res) => {
  const returns = await prisma.return.findMany({
    orderBy: { createdAt: 'desc' },
    include: { items: true, order: { select: { orderNumber: true } }, user: { select: { name: true, email: true, phone: true } } },
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

const returnSettingsSchema = z.object({ enabled: z.boolean() });

const getReturnSettings = asyncHandler(async (req, res) => {
  const setting = await prisma.siteSetting.findUnique({ where: { key: RETURNS_ENABLED_KEY } });
  res.json({ success: true, data: { enabled: setting?.value !== 'false' } });
});

const updateReturnSettings = asyncHandler(async (req, res) => {
  const { enabled } = returnSettingsSchema.parse(req.body);
  await prisma.siteSetting.upsert({
    where: { key: RETURNS_ENABLED_KEY },
    create: { key: RETURNS_ENABLED_KEY, value: String(enabled) },
    update: { value: String(enabled) },
  });
  res.json({ success: true, data: { enabled } });
});

module.exports = { listReturns, decideReturn, getReturnSettings, updateReturnSettings };
