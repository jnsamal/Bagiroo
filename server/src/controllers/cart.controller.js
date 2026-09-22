const asyncHandler = require('../middleware/asyncHandler');
const prisma = require('../config/prismaClient');
const cartService = require('../services/cart.service');
const { addCartItemSchema, updateCartItemSchema, applyCouponSchema } = require('../../../shared/validation/cartSchemas');

const getCart = asyncHandler(async (req, res) => {
  const cart = await cartService.resolveCart(req, res);
  res.json({ success: true, data: await cartService.getCartPayload(cart.id) });
});

const addItem = asyncHandler(async (req, res) => {
  const body = addCartItemSchema.parse(req.body);
  const cart = await cartService.resolveCart(req, res);
  await cartService.addItem(cart.id, body);
  res.status(201).json({ success: true, data: await cartService.getCartPayload(cart.id) });
});

const updateItem = asyncHandler(async (req, res) => {
  const { quantity } = updateCartItemSchema.parse(req.body);
  const cart = await cartService.resolveCart(req, res);
  await cartService.updateItemQuantity(cart.id, req.params.id, quantity);
  res.json({ success: true, data: await cartService.getCartPayload(cart.id) });
});

const removeItem = asyncHandler(async (req, res) => {
  const cart = await cartService.resolveCart(req, res);
  await cartService.removeItem(cart.id, req.params.id);
  res.json({ success: true, data: await cartService.getCartPayload(cart.id) });
});

const applyCoupon = asyncHandler(async (req, res) => {
  const { code } = applyCouponSchema.parse(req.body);
  const cart = await cartService.resolveCart(req, res);
  await prisma.cart.update({ where: { id: cart.id }, data: { couponCode: code || null } });
  // getCartPayload re-validates the coupon against the current subtotal —
  // if it's invalid, the response will simply show no discount applied,
  // and the client should surface that rather than a hard error here.
  res.json({ success: true, data: await cartService.getCartPayload(cart.id) });
});

module.exports = { getCart, addItem, updateItem, removeItem, applyCoupon };
