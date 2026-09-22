const { z } = require('zod');
const asyncHandler = require('../middleware/asyncHandler');
const wishlistService = require('../services/wishlist.service');

const addItemSchema = z.object({ productId: z.string().min(1) });

const getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.resolveWishlist(req, res);
  res.json({ success: true, data: await wishlistService.getWishlistPayload(wishlist.id) });
});

const addItem = asyncHandler(async (req, res) => {
  const { productId } = addItemSchema.parse(req.body);
  const wishlist = await wishlistService.resolveWishlist(req, res);
  await wishlistService.addItem(wishlist.id, productId);
  res.status(201).json({ success: true, data: await wishlistService.getWishlistPayload(wishlist.id) });
});

const removeItem = asyncHandler(async (req, res) => {
  const wishlist = await wishlistService.resolveWishlist(req, res);
  await wishlistService.removeItem(wishlist.id, req.params.productId);
  res.json({ success: true, data: await wishlistService.getWishlistPayload(wishlist.id) });
});

module.exports = { getWishlist, addItem, removeItem };
