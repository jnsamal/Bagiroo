const prisma = require('../../config/prismaClient');
const asyncHandler = require('../../middleware/asyncHandler');

const listCollections = asyncHandler(async (req, res) => {
  res.json({ success: true, data: await prisma.collection.findMany({ orderBy: { sortOrder: 'asc' } }) });
});

module.exports = { listCollections };
