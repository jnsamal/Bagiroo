const prisma = require('../config/prismaClient');
const asyncHandler = require('../middleware/asyncHandler');

const getNavigation = asyncHandler(async (req, res) => {
  const published = { isPublished: true, deletedAt: null };
  const media = { orderBy: { sortOrder: 'asc' }, take: 1 };
  const [categories, collections, products, giftingSetting] = await Promise.all([
    prisma.category.findMany({ where: { isVisible: true }, orderBy: { sortOrder: 'asc' }, include: {
      products: { where: { product: published }, take: 1, include: { product: { include: { media } } } },
    } }),
    prisma.collection.findMany({ orderBy: { sortOrder: 'asc' }, include: {
      products: { where: { product: published }, take: 1, include: { product: { include: { media } } } },
    } }),
    prisma.product.findMany({ where: published, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }], include: { media, variations: true, collections: true } }),
    prisma.siteSetting.findUnique({ where: { key: 'gifting_collection_slug' } }),
  ]);
  const productLink = (p) => ({ slug: p.slug, label: p.title, to: `/product/${p.slug}`, imageUrl: p.media[0]?.url || p.variations.find((v) => v.isDefault)?.imageUrl || p.variations.find((v) => v.imageUrl)?.imageUrl || null });
  const taxonomyLink = (entry, route) => ({ slug: entry.slug, label: entry.name, to: `${route}/${entry.slug}`, imageUrl: entry.imageUrl || entry.products[0]?.product.media[0]?.url || null });
  const giftingCollection = collections.find((c) => c.slug === giftingSetting?.value);
  const featuredCollection = collections.find((c) => c.slug === 'featured-collection');
  res.json({ success: true, data: {
    'shop-by-category': categories.map((c) => taxonomyLink(c, '/shop/category')),
    'featured-collections': featuredCollection
      ? products.filter((p) => p.collections.some((entry) => entry.collectionId === featuredCollection.id)).map(productLink)
      : [],
    'new-arrivals': products.filter((p) => p.isNewArrival).map(productLink),
    'best-sellers': products.filter((p) => p.isBestSeller).map(productLink),
    gifting: giftingCollection ? products.filter((p) => p.collections.some((c) => c.collectionId === giftingCollection.id)).map(productLink) : [],
  } });
});

module.exports = { getNavigation };
