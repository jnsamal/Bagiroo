const crypto = require('crypto');
const prisma = require('../config/prismaClient');
const { ApiError } = require('../middleware/errorHandler');
const { baseCookieOptions, httpOnlyCookieOptions } = require('../config/cookieOptions');

const GUEST_CART_COOKIE = 'bagiroo_guest_cart';
const GUEST_COOKIE_OPTIONS = httpOnlyCookieOptions(90 * 24 * 60 * 60 * 1000);

// Resolves (and creates if needed) the cart for the current request —
// a real user's cart if logged in, otherwise a guest cart tracked by a
// long-lived httpOnly cookie. This is the single place that decides
// "which cart" so every controller stays consistent.
async function resolveCart(req, res) {
  if (req.user) {
    let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) cart = await prisma.cart.create({ data: { userId: req.user.id } });
    return cart;
  }

  let guestToken = req.cookies?.[GUEST_CART_COOKIE];
  let cart = guestToken ? await prisma.cart.findUnique({ where: { guestToken } }) : null;

  if (!cart) {
    guestToken = crypto.randomUUID();
    cart = await prisma.cart.create({ data: { guestToken } });
    res.cookie(GUEST_CART_COOKIE, guestToken, GUEST_COOKIE_OPTIONS);
  }

  return cart;
}

// Called from auth.controller on successful login/register — folds any
// guest-cart items into the user's cart so people don't lose what they
// added before signing in.
async function mergeGuestCartIntoUser(req, res, userId) {
  const guestToken = req.cookies?.[GUEST_CART_COOKIE];
  if (!guestToken) return;

  const guestCart = await prisma.cart.findUnique({ where: { guestToken }, include: { items: true } });
  if (!guestCart || guestCart.items.length === 0) {
    if (guestCart) await prisma.cart.delete({ where: { id: guestCart.id } });
    res.clearCookie(GUEST_CART_COOKIE, baseCookieOptions());
    return;
  }

  let userCart = await prisma.cart.findUnique({ where: { userId } });
  if (!userCart) userCart = await prisma.cart.create({ data: { userId } });

  for (const item of guestCart.items) {
    await prisma.cartItem.upsert({
      where: {
        cartId_productId_variationId: {
          cartId: userCart.id,
          productId: item.productId,
          variationId: item.variationId,
        },
      },
      update: { quantity: { increment: item.quantity } },
      create: {
        cartId: userCart.id,
        productId: item.productId,
        variationId: item.variationId,
        quantity: item.quantity,
      },
    });
  }

  await prisma.cart.delete({ where: { id: guestCart.id } }); // cascade removes guest items
  res.clearCookie(GUEST_CART_COOKIE, baseCookieOptions());
}

async function addItem(cartId, { productId, variationId, quantity }) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isPublished) throw new ApiError(404, 'Product not found.');

  if (variationId) {
    const variation = await prisma.productVariation.findUnique({ where: { id: variationId } });
    if (!variation || variation.productId !== productId) {
      throw new ApiError(400, 'Invalid variation for this product.');
    }
  }

  return prisma.cartItem.upsert({
    where: { cartId_productId_variationId: { cartId, productId, variationId: variationId ?? null } },
    update: { quantity: { increment: quantity } },
    create: { cartId, productId, variationId, quantity },
  });
}

async function updateItemQuantity(cartId, itemId, quantity) {
  if (quantity <= 0) {
    const result = await prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
    if (!result.count) throw new ApiError(404, 'Cart item not found.');
    return null;
  }
  const result = await prisma.cartItem.updateMany({ where: { id: itemId, cartId }, data: { quantity } });
  if (!result.count) throw new ApiError(404, 'Cart item not found.');
  return prisma.cartItem.findFirst({ where: { id: itemId, cartId } });
}

async function removeItem(cartId, itemId) {
  const result = await prisma.cartItem.deleteMany({ where: { id: itemId, cartId } });
  if (!result.count) throw new ApiError(404, 'Cart item not found.');
}

// Full cart payload with server-computed totals — the client never
// supplies or trusts prices; everything here is read fresh from the DB.
async function getCartPayload(cartId) {
  const cart = await prisma.cart.findUnique({
    where: { id: cartId },
    include: {
      items: {
        include: {
          product: { include: { media: { take: 1 } } },
          variation: true,
        },
      },
    },
  });

  const { computeTotals } = require('./pricing.service');
  const totals = await computeTotals(cart);

  return { ...cart, ...totals };
}

module.exports = {
  GUEST_CART_COOKIE,
  resolveCart,
  mergeGuestCartIntoUser,
  addItem,
  updateItemQuantity,
  removeItem,
  getCartPayload,
};
