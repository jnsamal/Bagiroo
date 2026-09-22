const crypto = require('crypto');
const prisma = require('../config/prismaClient');
const { ApiError } = require('../middleware/errorHandler');
const { baseCookieOptions, httpOnlyCookieOptions } = require('../config/cookieOptions');

const GUEST_WISHLIST_COOKIE = 'bagiroo_guest_wishlist';
const GUEST_COOKIE_OPTIONS = httpOnlyCookieOptions(90 * 24 * 60 * 60 * 1000);

async function resolveWishlist(req, res) {
  if (req.user) {
    let wishlist = await prisma.wishlist.findUnique({ where: { userId: req.user.id } });
    if (!wishlist) wishlist = await prisma.wishlist.create({ data: { userId: req.user.id } });
    return wishlist;
  }

  let guestToken = req.cookies?.[GUEST_WISHLIST_COOKIE];
  let wishlist = guestToken ? await prisma.wishlist.findUnique({ where: { guestToken } }) : null;

  if (!wishlist) {
    guestToken = crypto.randomUUID();
    wishlist = await prisma.wishlist.create({ data: { guestToken } });
    res.cookie(GUEST_WISHLIST_COOKIE, guestToken, GUEST_COOKIE_OPTIONS);
  }

  return wishlist;
}

async function mergeGuestWishlistIntoUser(req, res, userId) {
  const guestToken = req.cookies?.[GUEST_WISHLIST_COOKIE];
  if (!guestToken) return;

  const guestWishlist = await prisma.wishlist.findUnique({ where: { guestToken }, include: { items: true } });
  if (!guestWishlist) return;

  let userWishlist = await prisma.wishlist.findUnique({ where: { userId } });
  if (!userWishlist) userWishlist = await prisma.wishlist.create({ data: { userId } });

  for (const item of guestWishlist.items) {
    await prisma.wishlistItem.upsert({
      where: { wishlistId_productId: { wishlistId: userWishlist.id, productId: item.productId } },
      update: {},
      create: { wishlistId: userWishlist.id, productId: item.productId },
    });
  }

  await prisma.wishlist.delete({ where: { id: guestWishlist.id } });
  res.clearCookie(GUEST_WISHLIST_COOKIE, baseCookieOptions());
}

async function addItem(wishlistId, productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new ApiError(404, 'Product not found.');

  return prisma.wishlistItem.upsert({
    where: { wishlistId_productId: { wishlistId, productId } },
    update: {},
    create: { wishlistId, productId },
  });
}

async function removeItem(wishlistId, productId) {
  await prisma.wishlistItem.deleteMany({ where: { wishlistId, productId } });
}

async function getWishlistPayload(wishlistId) {
  return prisma.wishlist.findUnique({
    where: { id: wishlistId },
    include: { items: { include: { product: { include: { media: { take: 1 } } } } } },
  });
}

module.exports = {
  GUEST_WISHLIST_COOKIE,
  resolveWishlist,
  mergeGuestWishlistIntoUser,
  addItem,
  removeItem,
  getWishlistPayload,
};
