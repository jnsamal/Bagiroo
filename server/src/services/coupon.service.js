const prisma = require('../config/prismaClient');
const { ApiError } = require('../middleware/errorHandler');

// Validates a coupon against the current subtotal and returns the discount
// in minor units. Re-checked at every read (cart view, checkout, order
// creation) rather than cached, so an expiring/deactivated coupon stops
// applying immediately rather than silently persisting.
async function validateCoupon(code, subtotalMinor) {
  if (!code) return { coupon: null, discountMinor: 0 };

  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.isActive) throw new ApiError(400, 'This coupon is not valid.');

  const now = new Date();
  if (coupon.startsAt && now < coupon.startsAt) throw new ApiError(400, 'This coupon is not active yet.');
  if (coupon.endsAt && now > coupon.endsAt) throw new ApiError(400, 'This coupon has expired.');
  if (coupon.minOrderMinor && subtotalMinor < coupon.minOrderMinor) {
    throw new ApiError(400, `This coupon requires a minimum order of ${coupon.minOrderMinor / 100}.`);
  }

  const discountMinor =
    coupon.discountType === 'PERCENTAGE'
      ? Math.round((subtotalMinor * coupon.discountValue) / 100)
      : Math.min(coupon.discountValue, subtotalMinor);

  return { coupon, discountMinor };
}

async function recordCouponUsage(couponId, userId, orderId) {
  await prisma.couponUsage.create({ data: { couponId, userId, orderId } });
}

module.exports = { validateCoupon, recordCouponUsage };
