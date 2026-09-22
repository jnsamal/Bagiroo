const { z } = require('zod');
const asyncHandler = require('../../middleware/asyncHandler');
const { ApiError } = require('../../middleware/errorHandler');
const prisma = require('../../config/prismaClient');

// Returns a URL under /uploads (served statically by app.js). Optionally
// attaches the uploaded file straight to a product as ProductMedia when
// productId is supplied, per the spec's "Image URL or media ID mapping"
// requirement for the admin media flow.
const uploadMedia = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No file uploaded.');

  const url = `/uploads/${req.file.filename}`;

  if (req.body.productId) {
    const variationId = req.body.variationId || null;
    if (variationId && !await prisma.productVariation.findFirst({ where: { id: variationId, productId: req.body.productId } })) throw new ApiError(400, 'Colour does not belong to this product.');
    const last = await prisma.productMedia.aggregate({ where: { productId: req.body.productId }, _max: { sortOrder: true } });
    const media = await prisma.productMedia.create({
      data: { productId: req.body.productId, variationId, url, altText: req.body.altText, sortOrder: (last._max.sortOrder ?? -1) + 1 },
    });
    return res.status(201).json({ success: true, data: media });
  }

  res.status(201).json({ success: true, data: { url, filename: req.file.filename } });
});

const deleteMedia = asyncHandler(async (req, res) => {
  const existing = await prisma.productMedia.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Image not found.');
  await prisma.productMedia.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { message: 'Image removed.' } });
});

// Simple swap-based reordering: pass the sortOrder value to move this
// image to; the gallery re-sorts on next read since ProductGallery/admin
// list both order by sortOrder ascending.
const updateMediaOrder = asyncHandler(async (req, res) => {
  const data = z.object({ sortOrder: z.coerce.number().int().optional(), variationId: z.string().nullable().optional(), altText: z.string().optional() }).parse(req.body);
  const existing = await prisma.productMedia.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Image not found.');
  if (data.variationId && !await prisma.productVariation.findFirst({ where: { id: data.variationId, productId: existing.productId } })) throw new ApiError(400, 'Colour does not belong to this product.');
  const media = await prisma.productMedia.update({ where: { id: req.params.id }, data });
  res.json({ success: true, data: media });
});

module.exports = { uploadMedia, deleteMedia, updateMediaOrder };
