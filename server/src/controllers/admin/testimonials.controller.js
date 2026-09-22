const { z } = require('zod');
const prisma = require('../../config/prismaClient');
const asyncHandler = require('../../middleware/asyncHandler');
const { ApiError } = require('../../middleware/errorHandler');

const testimonialSchema = z.object({
  authorName: z.string().min(1),
  avatarUrl: z.string().optional(),
  rating: z.coerce.number().int().min(1).max(5).default(5),
  quote: z.string().min(1),
  isPlaceholder: z.coerce.boolean().optional(),
  isVisible: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

const listTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await prisma.testimonial.findMany({ orderBy: { sortOrder: 'asc' } });
  res.json({ success: true, data: testimonials });
});

const createTestimonial = asyncHandler(async (req, res) => {
  const body = testimonialSchema.parse(req.body);
  // A real, admin-entered testimonial is never a placeholder — only the
  // original live-site seed data carries that flag.
  const testimonial = await prisma.testimonial.create({ data: { ...body, isPlaceholder: false } });
  res.status(201).json({ success: true, data: testimonial });
});

const updateTestimonial = asyncHandler(async (req, res) => {
  const body = testimonialSchema.partial().parse(req.body);
  const existing = await prisma.testimonial.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new ApiError(404, 'Testimonial not found.');
  const testimonial = await prisma.testimonial.update({ where: { id: req.params.id }, data: body });
  res.json({ success: true, data: testimonial });
});

const deleteTestimonial = asyncHandler(async (req, res) => {
  await prisma.testimonial.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { message: 'Testimonial deleted.' } });
});

module.exports = { listTestimonials, createTestimonial, updateTestimonial, deleteTestimonial };
