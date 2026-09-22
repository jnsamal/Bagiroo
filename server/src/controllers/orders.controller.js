const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const prisma = require('../config/prismaClient');
const cartService = require('../services/cart.service');
const orderService = require('../services/order.service');
const env = require('../config/env');
const { createOrderSchema, verifyPaymentSchema } = require('../../../shared/validation/orderSchemas');

const createOrder = asyncHandler(async (req, res) => {
  const body = createOrderSchema.parse(req.body);

  if (!req.user && !body.guestEmail) {
    throw new ApiError(400, 'Guest checkout requires an email address.');
  }

  const cart = await cartService.resolveCart(req, res);
  const fullCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: { items: { include: { product: true, variation: true } } },
  });

  const user = req.user ? await prisma.user.findUnique({ where: { id: req.user.id } }) : null;

  const { order, providerOrderId } = await orderService.createOrderFromCart({
    cart: fullCart,
    user,
    guestEmail: body.guestEmail,
    guestPhone: body.guestPhone,
    shippingAddress: body.shippingAddress,
    billingAddress: body.billingAddress,
  });

  res.status(201).json({
    success: true,
    data: { order, providerOrderId, razorpayKeyId: env.razorpayKeyId || null },
  });
});

const verifyPayment = asyncHandler(async (req, res) => {
  const body = verifyPaymentSchema.parse(req.body);
  const order = await orderService.confirmPayment(req.params.id, body, req.user?.id || null);
  res.json({ success: true, data: { order } });
});

module.exports = { createOrder, verifyPayment };
