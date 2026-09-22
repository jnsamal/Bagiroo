const prisma = require('../config/prismaClient');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

const listCategories = asyncHandler(async (req, res) => {
  const categories = await prisma.category.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ success: true, data: categories });
});

const getCategoryProducts = asyncHandler(async (req, res) => {
  const category = await prisma.category.findUnique({ where: { slug: req.params.slug } });
  if (!category) throw new ApiError(404, 'Category not found.');

  const products = await prisma.product.findMany({
    where: {
      isPublished: true,
      deletedAt: null,
      categories: { some: { categoryId: category.id } },
    },
    include: { media: { orderBy: { sortOrder: 'asc' }, take: 1 }, variations: true },
  });

  res.json({ success: true, data: { category, products } });
});

module.exports = { listCategories, getCategoryProducts };
