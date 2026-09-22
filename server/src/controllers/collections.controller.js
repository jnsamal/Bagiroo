const prisma = require('../config/prismaClient');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

const listCollections = asyncHandler(async (req, res) => {
  const collections = await prisma.collection.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json({ success: true, data: collections });
});

const getCollectionBySlug = asyncHandler(async (req, res) => {
  const collection = await prisma.collection.findUnique({
    where: { slug: req.params.slug },
    include: {
      products: {
        where: { product: { isPublished: true, deletedAt: null } },
        include: { product: { include: { media: { take: 1 }, variations: true } } },
      },
    },
  });
  if (!collection) throw new ApiError(404, 'Collection not found.');

  res.json({
    success: true,
    data: { ...collection, products: collection.products.map((p) => p.product) },
  });
});

module.exports = { listCollections, getCollectionBySlug };
