const prisma = require('../../config/prismaClient');
const asyncHandler = require('../../middleware/asyncHandler');
const { ApiError } = require('../../middleware/errorHandler');
const { parseCsv } = require('../../utils/csv');

// Expected CSV columns: title,slug,sku,priceMinor,categorySlug,isPublished
// Supports 50-200 products per the spec, with a dry-run preview mode and
// a downloadable-shaped error report (returned as JSON; the client can
// render/export it).
const bulkImport = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, 'No CSV file uploaded.');
  const dryRun = req.query.dryRun === 'true';

  const rows = parseCsv(req.file.buffer.toString('utf-8'));
  if (rows.length === 0) throw new ApiError(400, 'CSV file is empty or malformed.');
  if (rows.length > 200) throw new ApiError(400, 'Bulk import is limited to 200 rows at a time.');

  const results = { total: rows.length, created: 0, updated: 0, errors: [] };

  for (const [index, row] of rows.entries()) {
    const lineNumber = index + 2; // +1 for header, +1 for 1-indexing
    try {
      if (!row.title || !row.slug || !row.sku) {
        throw new Error('Missing required field (title, slug, or sku).');
      }

      const category = row.categorySlug
        ? await prisma.category.findUnique({ where: { slug: row.categorySlug } })
        : null;
      if (row.categorySlug && !category) {
        throw new Error(`Category "${row.categorySlug}" does not exist.`);
      }

      const data = {
        title: row.title,
        slug: row.slug,
        sku: row.sku,
        priceMinor: row.priceMinor ? Number(row.priceMinor) : null,
        isPublished: row.isPublished ? row.isPublished.toLowerCase() === 'true' : false,
      };

      if (!dryRun) {
        const existing = await prisma.product.findUnique({ where: { sku: row.sku } });
        if (existing) {
          await prisma.product.update({ where: { id: existing.id }, data });
          results.updated += 1;
        } else {
          await prisma.product.create({
            data: {
              ...data,
              categories: category ? { create: [{ categoryId: category.id }] } : undefined,
            },
          });
          results.created += 1;
        }
      } else {
        // Dry run: just validate and count what WOULD happen.
        const existing = await prisma.product.findUnique({ where: { sku: row.sku } });
        if (existing) results.updated += 1;
        else results.created += 1;
      }
    } catch (err) {
      results.errors.push({ line: lineNumber, sku: row.sku || '(missing)', message: err.message });
    }
  }

  res.json({ success: true, data: { ...results, dryRun } });
});

module.exports = { bulkImport };
