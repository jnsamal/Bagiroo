const { validateCoupon } = require('./coupon.service');
const { getWebsite } = require('./website.service');

function lineItemPrice(item) {
  return item.variation?.priceMinor ?? item.product.priceMinor;
}

// Computes subtotal/discount/shipping/tax/total for a cart, tolerating an
// invalid/expired coupon by silently dropping the discount rather than
// throwing — a cart view should never hard-fail because a coupon expired
// while it sat in someone's browser.
async function computeTotals(cart) {
  const priceableItems = cart.items.filter((i) => lineItemPrice(i) !== null && lineItemPrice(i) !== undefined);
  const unpriceableItems = cart.items.filter((i) => !priceableItems.includes(i));

  const subtotalMinor = priceableItems.reduce((sum, i) => sum + lineItemPrice(i) * i.quantity, 0);

  let discountMinor = 0;
  let appliedCoupon = null;
  if (cart.couponCode) {
    try {
      const result = await validateCoupon(cart.couponCode, subtotalMinor);
      discountMinor = result.discountMinor;
      appliedCoupon = result.coupon;
    } catch (err) {
      // expired/invalid coupon on an existing cart — drop it silently
    }
  }

  const settings = await getWebsite();
  const shippingMinor = subtotalMinor > 0 && !(settings.freeShippingThresholdMinor > 0 && subtotalMinor >= settings.freeShippingThresholdMinor) ? settings.shippingMinor : 0;
  const taxableMinor = Math.max(subtotalMinor - discountMinor, 0);
  const rate = settings.taxPercent / 100;
  const taxMinor = Math.round(settings.taxIncluded ? taxableMinor - taxableMinor / (1 + rate) : taxableMinor * rate);
  const totalMinor = taxableMinor + shippingMinor + (settings.taxIncluded ? 0 : taxMinor);

  return {
    subtotalMinor,
    discountMinor,
    shippingMinor,
    taxMinor,
    totalMinor,
    appliedCoupon,
    hasUnpriceableItems: unpriceableItems.length > 0,
    unpriceableItems,
  };
}

module.exports = { computeTotals, lineItemPrice };
