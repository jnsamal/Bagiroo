const { z } = require('zod');
const prisma = require('../../config/prismaClient');
const asyncHandler = require('../../middleware/asyncHandler');
const { ApiError } = require('../../middleware/errorHandler');

const couponSchema = z.object({
  code: z.string().min(1).toUpperCase(),
  description: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FLAT']),
  discountValue: z.coerce.number().int().positive(),
  minOrderMinor: z.coerce.number().int().nonnegative().optional(),
  isActive: z.coerce.boolean().optional(),
  startsAt: z.coerce.date().optional(),
  endsAt: z.coerce.date().optional(),
});

const listCoupons = asyncHandler(async (req, res) => {
  const coupons = await prisma.coupon.findMany({ orderBy: { code: 'asc' } });
  res.json({ success: true, data: coupons });
});

const createCoupon = asyncHandler(async (req, res) => {
  const body = couponSchema.parse(req.body);
  const coupon = await prisma.coupon.create({ data: body });
  res.status(201).json({ success: true, data: coupon });
});

const updateCoupon = asyncHandler(async (req, res) => {
  const body = couponSchema.partial().parse(req.body);
  const existing = await prisma.coupon.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Coupon not found.');
  const coupon = await prisma.coupon.update({ where: { id: req.params.id }, data: body });
  res.json({ success: true, data: coupon });
});

const deleteCoupon = asyncHandler(async (req, res) => {
  await prisma.coupon.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { message: 'Coupon deleted.' } });
});

module.exports = { listCoupons, createCoupon, updateCoupon, deleteCoupon };
