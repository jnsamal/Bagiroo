const { z } = require('zod');
const prisma = require('../../config/prismaClient');
const asyncHandler = require('../../middleware/asyncHandler');

const safeUrl = z.string().max(2000).refine(value => !value || /^\/(?!\/)[^\\\s]*$/.test(value) || /^https?:\/\/[^\s]+$/i.test(value), 'Use a /path or http(s) URL.');

// Everything the spec groups under admin "Content" that's a simple
// key/value or small list — WhatsApp number, social links, announcement
// bar messages. Product/category/collection content management lives in
// their own admin controllers.

const getSettings = asyncHandler(async (req, res) => {
  const [whatsapp, socialLinks, announcements, gifting] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: 'whatsapp_business_number' } }),
    prisma.socialLink.findMany(),
    prisma.announcementOffer.findMany({ orderBy: { sortOrder: 'asc' } }),
    prisma.siteSetting.findUnique({ where: { key: 'gifting_collection_slug' } }),
  ]);
  res.json({
    success: true,
    data: { whatsappNumber: whatsapp?.value || '', giftingCollectionSlug: gifting?.value || '', socialLinks, announcements },
  });
});

const updateGifting = asyncHandler(async (req, res) => {
  const { collectionSlug } = z.object({ collectionSlug: z.string() }).parse(req.body);
  if (collectionSlug) await prisma.collection.findUniqueOrThrow({ where: { slug: collectionSlug } });
  const setting = await prisma.siteSetting.upsert({ where: { key: 'gifting_collection_slug' }, update: { value: collectionSlug }, create: { key: 'gifting_collection_slug', value: collectionSlug } });
  res.json({ success: true, data: setting });
});

const updateWhatsappSchema = z.object({ whatsappNumber: z.string() });

const updateWhatsapp = asyncHandler(async (req, res) => {
  const { whatsappNumber } = updateWhatsappSchema.parse(req.body);
  const setting = await prisma.siteSetting.upsert({
    where: { key: 'whatsapp_business_number' },
    update: { value: whatsappNumber },
    create: { key: 'whatsapp_business_number', value: whatsappNumber },
  });
  res.json({ success: true, data: setting });
});

const socialLinkSchema = z.object({
  platform: z.enum(['instagram', 'facebook', 'pinterest', 'whatsapp']),
  url: z.string().refine(value => !value || /^https?:\/\/[^\s]+$/i.test(value), 'Use an http(s) URL.'),
  isVisible: z.coerce.boolean().optional(),
});

const upsertSocialLink = asyncHandler(async (req, res) => {
  const body = socialLinkSchema.parse(req.body);
  const existing = await prisma.socialLink.findFirst({ where: { platform: body.platform } });
  const link = existing
    ? await prisma.socialLink.update({ where: { id: existing.id }, data: body })
    : await prisma.socialLink.create({ data: body });
  res.json({ success: true, data: link });
});

const announcementSchema = z.object({
  message: z.string().min(1),
  linkUrl: safeUrl.optional(),
  isActive: z.coerce.boolean().optional(),
  sortOrder: z.coerce.number().int().optional(),
});

const createAnnouncement = asyncHandler(async (req, res) => {
  const body = announcementSchema.parse(req.body);
  const announcement = await prisma.announcementOffer.create({ data: body });
  res.status(201).json({ success: true, data: announcement });
});

const updateAnnouncement = asyncHandler(async (req, res) => {
  const body = announcementSchema.partial().parse(req.body);
  const announcement = await prisma.announcementOffer.update({ where: { id: req.params.id }, data: body });
  res.json({ success: true, data: announcement });
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  await prisma.announcementOffer.delete({ where: { id: req.params.id } });
  res.json({ success: true, data: { message: 'Announcement deleted.' } });
});

module.exports = {
  updateGifting,
  getSettings,
  updateWhatsapp,
  upsertSocialLink,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
