const asyncHandler = require('../middleware/asyncHandler');
const cartService = require('../services/cart.service');
const env = require('../config/env');

// Lets the checkout page show an accurate summary (and catch out-of-stock
// or unpriceable items) before the customer fills in address details.
const validate = asyncHandler(async (req, res) => {
  const cart = await cartService.resolveCart(req, res);
  const payload = await cartService.getCartPayload(cart.id);

  res.json({
    success: true,
    data: {
      ...payload,
      canCheckout: payload.items.length > 0 && !payload.hasUnpriceableItems,
      razorpayKeyId: env.razorpayKeyId || null,
    },
  });
});

module.exports = { validate };
