const prisma = require('../config/prismaClient');
const asyncHandler = require('../middleware/asyncHandler');
const { getWebsite } = require('../services/website.service');

// Public, non-sensitive settings only (WhatsApp number, social links) —
// admin-editable fields, never hard-coded per the spec.
const getPublicSettings = asyncHandler(async (req, res) => {
  const [whatsappSetting, socialLinks, website] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: 'whatsapp_business_number' } }),
    prisma.socialLink.findMany({ where: { isVisible: true, NOT: { url: '' } } }),
    getWebsite(),
  ]);

  res.json({
    success: true,
    data: {
      whatsappNumber: whatsappSetting?.value || null,
      socialLinks,
      website,
    },
  });
});

module.exports = { getPublicSettings };
