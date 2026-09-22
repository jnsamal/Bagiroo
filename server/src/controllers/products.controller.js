const prisma = require('../config/prismaClient');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');
const { productQuerySchema } = require('../../../shared/validation/productSchemas');
const { DEFAULT_PAGE_SIZE } = require('../../../shared/constants');

// GET /api/v1/products
const listProducts = asyncHandler(async (req, res) => {
  const query = productQuerySchema.parse(req.query);
  const page = query.page || 1;
  const perPage = query.perPage || DEFAULT_PAGE_SIZE;

  const where = {
    isPublished: true,
    deletedAt: null,
    ...(query.slugs ? { slug: { in: query.slugs } } : {}),
    ...(query.category ? { categories: { some: { category: { slug: query.category } } } } : {}),
    ...(query.collection ? { collections: { some: { collection: { slug: query.collection } } } } : {}),
    ...(query.q ? { title: { contains: query.q } } : {}),
    ...(query.bestSeller !== undefined ? { isBestSeller: query.bestSeller } : {}),
    ...(query.newArrival !== undefined ? { isNewArrival: query.newArrival } : {}),
    ...(req.query.excludeSlug ? { slug: { not: req.query.excludeSlug } } : {}),
  };

  const orderBy =
    query.sort === 'price_asc'
      ? { priceMinor: 'asc' }
      : query.sort === 'price_desc'
      ? { priceMinor: 'desc' }
      : { createdAt: 'desc' };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
      include: { media: { orderBy: { sortOrder: 'asc' }, take: 1 }, variations: true },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({
    success: true,
    data: { data: items, meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } },
  });
});

// GET /api/v1/products/:slug
const getProductBySlug = asyncHandler(async (req, res) => {
  const product = await prisma.product.findFirst({
    where: { slug: req.params.slug, isPublished: true, deletedAt: null },
    include: {
      media: { orderBy: { sortOrder: 'asc' } },
      variations: true,
      videos: { where: { isActive: true } },
      reviews: { where: { isApproved: true }, orderBy: { createdAt: 'desc' } },
      categories: { include: { category: true } },
    },
  });

  if (!product) throw new ApiError(404, 'Product not found.');
  res.json({ success: true, data: product });
});

module.exports = { listProducts, getProductBySlug };
