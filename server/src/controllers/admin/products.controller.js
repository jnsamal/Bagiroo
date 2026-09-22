const { z } = require('zod');
const prisma = require('../../config/prismaClient');
const asyncHandler = require('../../middleware/asyncHandler');
const { ApiError } = require('../../middleware/errorHandler');

const safeMediaUrl = z.string().max(2000).refine(value => !value || /^\/(?!\/)[^\\\s]*$/.test(value) || /^https?:\/\/[^\s]+$/i.test(value), 'Use a /path or http(s) URL.');

const productInputSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  sku: z.string().min(1),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  priceMinor: z.coerce.number().int().nonnegative().nullable().optional(),
  compareAtMinor: z.coerce.number().int().nonnegative().nullable().optional(),
  material: z.string().optional(),
  weightGrams: z.coerce.number().int().optional(),
  dimensions: z.string().optional(),
  features: z.array(z.string()).optional(),
  isPublished: z.coerce.boolean().optional(),
  isBestSeller: z.coerce.boolean().optional(),
  isNewArrival: z.coerce.boolean().optional(),
  categoryIds: z.array(z.string()).optional(),
  collectionIds: z.array(z.string()).optional(),
  sortOrder: z.coerce.number().int().optional(),
});

// Admin list includes unpublished/soft-deleted-excluded products, with
// basic pagination — unlike the public endpoint this doesn't filter to
// isPublished only.
const listProducts = asyncHandler(async (req, res) => {
  const { page, perPage, q, status } = z.object({ page: z.coerce.number().int().min(1).default(1), perPage: z.coerce.number().int().min(1).max(100).default(20), q: z.string().max(200).default(''), status: z.enum(['all', 'published', 'draft', 'archived']).default('all') }).parse(req.query);
  const where = { deletedAt: status === 'archived' ? { not: null } : null, ...(status === 'published' ? { isPublished: true } : status === 'draft' ? { isPublished: false } : {}), ...(q ? { OR: [{ title: { contains: q } }, { sku: { contains: q } }] } : {}) };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * perPage,
      take: perPage,
      include: { categories: { include: { category: true } }, variations: { include: { inventory: true } }, inventory: true, media: { orderBy: { sortOrder: 'asc' }, take: 1 } },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ success: true, data: { data: items, meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } } });
});

const getProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { categories: true, collections: true, variations: true, media: true, videos: true },
  });
  if (!product) throw new ApiError(404, 'Product not found.');
  res.json({ success: true, data: product });
});

const createProduct = asyncHandler(async (req, res) => {
  const body = productInputSchema.parse(req.body);
  const { categoryIds, collectionIds, ...data } = body;

  const product = await prisma.product.create({
    data: {
      ...data,
      // Admin-created products are storefront-visible unless the admin
      // deliberately saves them as a draft.
      isPublished: data.isPublished ?? true,
      categories: categoryIds ? { create: categoryIds.map((categoryId) => ({ categoryId })) } : undefined,
      inventory: { create: { quantityAvailable: 0 } },
      collections: collectionIds ? { create: collectionIds.map((collectionId) => ({ collectionId })) } : undefined,
    },
  });

  res.status(201).json({ success: true, data: product });
});

const updateProduct = asyncHandler(async (req, res) => {
  const body = productInputSchema.partial().parse(req.body);
  const { categoryIds, collectionIds, ...data } = body;

  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Product not found.');

  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: {
      ...data,
      ...(collectionIds && { collections: { deleteMany: {}, create: collectionIds.map((collectionId) => ({ collectionId })) } }),
      ...(categoryIds && {
        categories: {
          deleteMany: {},
          create: categoryIds.map((categoryId) => ({ categoryId })),
        },
      }),
    },
  });

  res.json({ success: true, data: product });
});

// Soft delete / archive — never a hard DELETE on a product that might
// already have order history attached to it.
const archiveProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { deletedAt: new Date(), isPublished: false },
  });
  res.json({ success: true, data: product });
});

// Permanently remove products that have never been ordered. Products with
// order history are archived instead so invoices and historical orders remain
// valid, while every storefront query excludes them.
const deleteProduct = asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({
    where: { id: req.params.id },
    include: { _count: { select: { orderItems: true } }, variations: { select: { id: true } } },
  });
  if (!existing) throw new ApiError(404, 'Product not found.');

  if (existing._count.orderItems > 0) {
    const product = await prisma.product.update({
      where: { id: existing.id },
      data: { deletedAt: new Date(), isPublished: false, isBestSeller: false, isNewArrival: false },
    });
    return res.json({ success: true, data: { product, permanentlyDeleted: false, message: 'Product removed from the website. Order history was preserved.' } });
  }

  const variationIds = existing.variations.map(variation => variation.id);
  await prisma.$transaction(async tx => {
    await tx.cartItem.deleteMany({ where: { productId: existing.id } });
    await tx.wishlistItem.deleteMany({ where: { productId: existing.id } });
    await tx.review.deleteMany({ where: { productId: existing.id } });
    await tx.productVideo.deleteMany({ where: { productId: existing.id } });
    await tx.productTag.deleteMany({ where: { productId: existing.id } });
    await tx.productCategory.deleteMany({ where: { productId: existing.id } });
    await tx.productCollection.deleteMany({ where: { productId: existing.id } });
    await tx.productMedia.deleteMany({ where: { productId: existing.id } });
    await tx.inventory.deleteMany({ where: { OR: [{ productId: existing.id }, { variationId: { in: variationIds } }] } });
    await tx.productVariation.deleteMany({ where: { productId: existing.id } });
    await tx.product.delete({ where: { id: existing.id } });
  });

  res.json({ success: true, data: { permanentlyDeleted: true, message: 'Product permanently deleted.' } });
});

const togglePublish = asyncHandler(async (req, res) => {
  const existing = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.deletedAt) throw new ApiError(404, 'Active product not found.');
  const product = await prisma.product.update({
    where: { id: req.params.id },
    data: { isPublished: !existing.isPublished },
  });
  res.json({ success: true, data: product });
});

const restoreProduct = asyncHandler(async (req, res) => {
  const product = await prisma.product.update({ where: { id: req.params.id }, data: { deletedAt: null, isPublished: false } });
  res.json({ success: true, data: product });
});

// --- Variations (colour options) ---------------------------------------

const variationInputSchema = z.object({
  sku: z.string().min(1),
  colorName: z.string().optional(),
  colorHex: z.string().regex(/^#[0-9a-f]{6}$/i).optional(),
  priceMinor: z.coerce.number().int().nonnegative().nullable().optional(),
  compareAtMinor: z.coerce.number().int().nonnegative().nullable().optional(),
  imageUrl: safeMediaUrl.optional(),
  isDefault: z.coerce.boolean().optional(),
});

const createVariation = asyncHandler(async (req, res) => {
  const product = await prisma.product.findUnique({ where: { id: req.params.id } });
  if (!product) throw new ApiError(404, 'Product not found.');

  const body = variationInputSchema.parse(req.body);
  const variation = await prisma.productVariation.create({ data: { ...body, productId: product.id } });

  // A fresh variation needs its own inventory row so it's purchasable —
  // starts at zero until the admin sets real stock.
  await prisma.inventory.create({ data: { variationId: variation.id, quantityAvailable: 0 } });

  res.status(201).json({ success: true, data: variation });
});

const updateVariation = asyncHandler(async (req, res) => {
  const existing = await prisma.productVariation.findUnique({ where: { id: req.params.variationId } });
  if (!existing || existing.productId !== req.params.id) throw new ApiError(404, 'Variation not found.');

  const { defaultImageMediaId, ...body } = variationInputSchema.partial().extend({ defaultImageMediaId: z.string().optional() }).parse(req.body);
  if (defaultImageMediaId !== undefined) {
    if (defaultImageMediaId === '') body.imageUrl = '';
    else {
      const image = await prisma.productMedia.findFirst({ where: { id: defaultImageMediaId, productId: existing.productId, variationId: existing.id } });
      if (!image) throw new ApiError(400, 'Choose an image assigned to this colour.');
      body.imageUrl = image.url;
    }
  }
  const variation = await prisma.productVariation.update({ where: { id: req.params.variationId }, data: body });
  res.json({ success: true, data: variation });
});

const deleteVariation = asyncHandler(async (req, res) => {
  const existing = await prisma.productVariation.findUnique({ where: { id: req.params.variationId } });
  if (!existing || existing.productId !== req.params.id) throw new ApiError(404, 'Variation not found.');

  await prisma.inventory.deleteMany({ where: { variationId: existing.id } });
  await prisma.productVariation.delete({ where: { id: existing.id } });
  res.json({ success: true, data: { message: 'Variation deleted.' } });
});

module.exports = {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  archiveProduct,
  deleteProduct,
  restoreProduct,
  togglePublish,
  createVariation,
  updateVariation,
  deleteVariation,
};
