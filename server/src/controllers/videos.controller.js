const prisma = require('../config/prismaClient');
const asyncHandler = require('../middleware/asyncHandler');

// Powers both the homepage "Shop by Video" section and the dedicated
// /shop-by-video page (grouped by category on the client).
const listVideos = asyncHandler(async (req, res) => {
  const videos = await prisma.productVideo.findMany({
    where: { isActive: true, product: { isPublished: true, deletedAt: null } },
    orderBy: { sortOrder: 'asc' },
    include: {
      product: {
        include: { categories: { include: { category: true } } },
      },
    },
  });
  res.json({ success: true, data: videos });
});

module.exports = { listVideos };
