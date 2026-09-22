const prisma = require('../config/prismaClient');
const asyncHandler = require('../middleware/asyncHandler');

const listTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await prisma.testimonial.findMany({
    where: { isVisible: true },
    orderBy: { sortOrder: 'asc' },
  });
  res.json({ success: true, data: testimonials });
});

module.exports = { listTestimonials };
