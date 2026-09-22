const { z } = require('zod');
const prisma = require('../../config/prismaClient');
const asyncHandler = require('../../middleware/asyncHandler');
const { ApiError } = require('../../middleware/errorHandler');

// Covers admin CRUD for both Category and Collection — structurally
// identical enough to share one controller file.

const categorySchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  sortOrder: z.coerce.number().int().optional(),
  isVisible: z.coerce.boolean().optional(),
});

const listCategories = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await prisma.category.findMany({ orderBy: { sortOrder: 'asc' } }) });
});

const createCategory = asyncHandler(async (req, res) => {
  const body = categorySchema.parse(req.body);
  res.status(201).json({ success: true, data: await prisma.category.create({ data: body }) });
});

const updateCategory = asyncHandler(async (req, res) => {
  const body = categorySchema.partial().parse(req.body);
  const existing = await prisma.category.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Category not found.');
  res.json({ success: true, data: await prisma.category.update({ where: { id: req.params.id }, data: body }) });
});

const deleteCategory = asyncHandler(async (req, res) => {
  await prisma.category.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { message: 'Category deleted.' } });
});

const collectionSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  isFeatured: z.coerce.boolean().optional(),
  isPlaceholder: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
  productIds: z.array(z.string()).optional(),
});

const listCollections = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await prisma.collection.findMany({ orderBy: { sortOrder: 'asc' } }) });
});

const createCollection = asyncHandler(async (req, res) => {
  const { productIds, ...body } = collectionSchema.parse(req.body);
  const collection = await prisma.collection.create({
    data: {
      ...body,
      isPlaceholder: false, // an admin-created collection is real by definition
      products: productIds ? { create: productIds.map((productId) => ({ productId })) } : undefined,
    },
  });
  res.status(201).json({ success: true, data: collection });
});

const updateCollection = asyncHandler(async (req, res) => {
  const { productIds, ...body } = collectionSchema.partial().parse(req.body);
  const existing = await prisma.collection.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Collection not found.');

  const collection = await prisma.collection.update({
    where: { id: req.params.id },
    data: {
      ...body,
      ...(productIds && { products: { deleteMany: {}, create: productIds.map((productId) => ({ productId })) } }),
    },
  });
  res.json({ success: true, data: collection });
});

const deleteCollection = asyncHandler(async (req, res) => {
  await prisma.collection.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { message: 'Collection deleted.' } });
});

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listCollections,
  createCollection,
  updateCollection,
  deleteCollection,
};
