const prisma = require('../config/prismaClient');
const asyncHandler = require('../middleware/asyncHandler');

// Single aggregated endpoint for the homepage — avoids the client firing
// 8 separate requests on first paint. Order of keys matches the confirmed
// section order from the Phase 1 audit.
const getHomepage = asyncHandler(async (req, res) => {
  const [categories, bestSellers, newArrivals, videos, testimonials, instagramPosts, featuredCollection, announcements] =
    await Promise.all([
      prisma.category.findMany({ where: { isVisible: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.product.findMany({
        where: { isPublished: true, deletedAt: null, isBestSeller: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: 4,
        include: { media: { take: 1 }, variations: true },
      }),
      prisma.product.findMany({
        where: { isPublished: true, deletedAt: null, isNewArrival: true },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take: 4,
        include: { media: { take: 1 }, variations: true },
      }),
      prisma.productVideo.findMany({
        where: { isActive: true, product: { isPublished: true, deletedAt: null } },
        orderBy: { sortOrder: 'asc' },
        take: 12,
        include: { product: { include: { variations: true } } },
      }),
      prisma.testimonial.findMany({ where: { isVisible: true }, orderBy: { sortOrder: 'asc' } }),
      prisma.instagramPost.findMany({ where: { isVisible: true }, orderBy: { sortOrder: 'asc' }, take: 5 }),
      prisma.collection.findFirst({
        where: { isFeatured: true },
        include: {
          products: {
            where: { product: { isPublished: true, deletedAt: null } },
            take: 4,
            include: { product: { include: { media: { orderBy: { sortOrder: 'asc' }, take: 1 }, variations: true } } },
          },
        },
      }),
      prisma.announcementOffer.findMany({ where: { isActive: true, AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }] }, { OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] }] }, orderBy: { sortOrder: 'asc' } }),
    ]);

  res.json({
    success: true,
    data: { categories, bestSellers, newArrivals, videos, testimonials, instagramPosts, featuredCollection, announcements },
  });
});

module.exports = { getHomepage };
