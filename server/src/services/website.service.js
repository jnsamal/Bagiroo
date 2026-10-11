const { z } = require('zod');
const prisma = require('../config/prismaClient');
const { deleteStoredMedia } = require('./media.service');
const navigation = [
  { key: 'new-arrivals', label: 'New Arrivals', to: '/new-arrivals', megaMenu: true, visible: true, viewAllImageUrl: '' },
  { key: 'best-sellers', label: 'Best Sellers', to: '/best-sellers', megaMenu: true, visible: true, viewAllImageUrl: '' },
  { key: 'shop-by-category', label: 'Shop by Category', to: '/shop', megaMenu: true, visible: true, viewAllImageUrl: '' },
  { key: 'featured-collections', label: 'Featured Collections', to: '/collections/featured-collection', megaMenu: true, visible: true, viewAllImageUrl: '' },
  { key: 'gifting', label: 'Gifting', to: '/gifting', megaMenu: true, visible: true, viewAllImageUrl: '' },
  { key: 'shop-by-video', label: 'Shop by Video', to: '/shop-by-video', megaMenu: false, visible: true, viewAllImageUrl: '' },
  { key: 'store-locator', label: 'Store Locator', to: '/store-locator', megaMenu: false, visible: true, viewAllImageUrl: '' },
];
const footerShopLinks = [
  { key: 'collection', label: 'Collection', to: '/shop', visible: true },
  { key: 'new-arrivals', label: 'New Arrivals', to: '/new-arrivals', visible: true },
  { key: 'best-sellers', label: 'Best Sellers', to: '/best-sellers', visible: true },
  { key: 'shop-by-video', label: 'Shop by Video', to: '/shop-by-video', visible: true },
];
const footerHelpLinks = [
  { key: 'contact', label: 'Contact', to: '/contact', visible: true },
  { key: 'refund-policy', label: 'Refund Policy', to: '/refund-policy', visible: true },
  { key: 'terms', label: 'Terms & Conditions', to: '/terms', visible: true },
  { key: 'privacy', label: 'Privacy Policy', to: '/privacy', visible: true },
];
const fields = [
  ['siteName', 'Store name', 'text', 'Bagiroo & Co.', 'Brand'],
  ['logoUrl', 'Logo image', 'image', '/images/bagiroo-logo.png', 'Brand'],
  ['logoWidth', 'Desktop logo width (px)', 'number', 180, 'Brand', 80, 260],
  ['background', 'Background colour', 'color', '#FAFAF8', 'Appearance'],
  ['surface', 'Surface colour', 'color', '#F1F1EE', 'Appearance'],
  ['ink', 'Text / button colour', 'color', '#171716', 'Appearance'],
  ['muted', 'Secondary text colour', 'color', '#686864', 'Appearance'],
  ['border', 'Border colour', 'color', '#DDDDD8', 'Appearance'],
  ['fontFamily', 'Font family', 'select', 'Arial', 'Appearance', ['Arial', 'Georgia', 'Verdana', 'Trebuchet MS']],
  ['navigation', 'Navigation links', 'navigation', navigation, 'Navigation'],
  ['metaDescription', 'Search description', 'textarea', 'Contemporary bags from Bagiroo & Co.', 'Brand'],
  ['heroTitle', 'Hero heading', 'text', 'Designed for every move', 'Homepage'],
  ['heroDescription', 'Hero description', 'textarea', 'Considered silhouettes, confident colour and room for the rhythm of your day.', 'Homepage'],
  ['heroImage', 'Hero fallback photograph', 'image', '/uploads/site/hero.png', 'Homepage'],
  ['heroSlides', 'Hero carousel media', 'hero-slides', [{ id: 'hero-default', type: 'image', url: '/uploads/site/hero.png', altText: 'Bagiroo collection' }], 'Homepage'],
  ['heroButtonLabel', 'Hero button label', 'text', 'Explore the collection', 'Homepage'],
  ['heroButtonUrl', 'Hero button destination', 'url', '/shop', 'Homepage'],
  ['heroOverlay', 'Hero dark overlay (%)', 'number', 40, 'Homepage', 0, 80],
  ['categoryTitle', 'Category section heading', 'text', 'Shop by category', 'Homepage'],
  ['categoryDescription', 'Category section description', 'textarea', 'Find the shape that fits your day.', 'Homepage'],
  ['editorialTitle', 'Editorial banner heading', 'text', 'Form follows feeling', 'Homepage'],
  ['editorialDescription', 'Editorial banner description', 'textarea', 'A focused edit of structured companions, soft carryalls and everyday statements.', 'Homepage'],
  ['editorialButtonLabel', 'Editorial button label', 'text', 'Discover all bags', 'Homepage'],
  ['editorialButtonUrl', 'Editorial button destination', 'url', '/shop', 'Homepage'],
  ['showCategories', 'Show categories', 'boolean', true, 'Homepage sections'],
  ['showBestSellers', 'Show best sellers', 'boolean', true, 'Homepage sections'],
  ['showNewArrivals', 'Show new arrivals', 'boolean', true, 'Homepage sections'],
  ['showEditorial', 'Show editorial banner', 'boolean', true, 'Homepage sections'],
  ['showUsp', 'Show benefits', 'boolean', true, 'Homepage sections'],
  ['showVideos', 'Show videos', 'boolean', true, 'Homepage sections'],
  ['showTestimonials', 'Show testimonials', 'boolean', true, 'Homepage sections'],
  ['showInstagram', 'Show Instagram posts', 'boolean', true, 'Homepage sections'],
  ['showFeaturedCollection', 'Show featured collection', 'boolean', true, 'Homepage sections'],
  ['showNewsletter', 'Show newsletter', 'boolean', true, 'Homepage sections'],
  ['uspTitle', 'Benefits section heading', 'text', 'Why shop with Bagiroo', 'Homepage'],
  ['uspText', 'Benefit tiles (one per line)', 'textarea', 'Thoughtful design\nPremium finish\nEasy returns\nCustomer support', 'Homepage'],
  ['newsletterTitle', 'Newsletter heading', 'text', 'Join our world', 'Homepage'],
  ['newsletterDescription', 'Newsletter description', 'textarea', 'Product stories, new arrivals and considered edits, delivered occasionally.', 'Homepage'],
  ['footerFollowLabel', 'Social section heading', 'text', 'Follow Bagiroo & Co.', 'Footer'],
  ['footerDescription', 'Footer description', 'textarea', 'Contemporary bags designed for everyday movement.', 'Footer'],
  ['footerShopTitle', 'Shop column heading', 'text', 'Shop', 'Footer'],
  ['footerShopLinks', 'Shop links', 'link-list', footerShopLinks, 'Footer'],
  ['footerHelpTitle', 'Help column heading', 'text', 'Help', 'Footer'],
  ['footerHelpLinks', 'Help links', 'link-list', footerHelpLinks, 'Footer'],
  ['footerCareTitle', 'Customer care heading', 'text', 'Customer Care', 'Footer'],
  ['footerCareText', 'Customer care text', 'text', 'Questions about an order? Visit our', 'Footer'],
  ['footerCareLinkLabel', 'Customer care link label', 'text', 'Contact page', 'Footer'],
  ['footerCareLinkUrl', 'Customer care link destination', 'url', '/contact', 'Footer'],
  ['contactContent', 'Contact page content', 'textarea', '', 'Pages and policies'],
  ['refundContent', 'Refund policy content', 'textarea', '', 'Pages and policies'],
  ['termsContent', 'Terms and conditions', 'textarea', '', 'Pages and policies'],
  ['privacyContent', 'Privacy policy content', 'textarea', '', 'Pages and policies'],
  ['shippingContent', 'Product shipping and returns text', 'textarea', '', 'Pages and policies'],
  ['storeLocatorContent', 'Store locations', 'textarea', '', 'Pages and policies'],
  ['shippingMinor', 'Flat shipping charge (paise)', 'number', 0, 'Checkout', 0, 10000000],
  ['freeShippingThresholdMinor', 'Free shipping threshold (paise; 0 disables)', 'number', 0, 'Checkout', 0, 100000000],
  ['taxPercent', 'Tax percentage', 'number', 0, 'Checkout', 0, 100],
  ['taxIncluded', 'Product prices include tax', 'boolean', true, 'Checkout'],
];
const safeUrl = z.string().max(2000).refine(value => !value || (/^\/(?!\/)/.test(value) && !/[\\\s]/.test(value)) || /^https?:\/\/[^\s]+$/i.test(value), 'Use a relative /path or an http(s) URL.');
const footerLinkSchema = z.object({
  key: z.string().min(1).max(100),
  label: z.string().min(1).max(80),
  to: safeUrl.refine(Boolean),
  visible: z.boolean(),
}).strict();
const heroSlideSchema = z.object({
  id: z.string().min(1).max(100),
  type: z.enum(['image', 'video']),
  url: safeUrl.refine(Boolean, 'Choose an image or video for every hero slide.'),
  altText: z.string().max(200),
}).strict();
const shape = Object.fromEntries(fields.map(([key, , type, , , min, max]) => [key,
  type === 'navigation' ? z.array(z.object({ key: z.enum(navigation.map(item => item.key)), label: z.string().min(1).max(80), to: safeUrl.refine(Boolean), megaMenu: z.boolean(), visible: z.boolean(), viewAllImageUrl: safeUrl.optional().default('') }).strict()).length(navigation.length).refine(items => new Set(items.map(item => item.key)).size === navigation.length, 'Each navigation item must appear once.') : type === 'link-list' ? z.array(footerLinkSchema).max(20).refine(items => new Set(items.map(item => item.key)).size === items.length, 'Each footer link must have a unique key.') : type === 'hero-slides' ? z.array(heroSlideSchema).min(1, 'Add at least one hero slide.').max(10) : type === 'boolean' ? z.boolean() : type === 'number' ? z.number().min(min).max(max).refine(value => key === 'taxPercent' || Number.isInteger(value), 'Use a whole number.') : type === 'color' ? z.string().regex(/^#[0-9a-f]{6}$/i) : type === 'select' ? z.enum(min) : ['url', 'image'].includes(type) ? safeUrl : z.string().max(20000),
]));
const schema = z.object(shape).strict();
const defaults = Object.fromEntries(fields.map(([key, , , value]) => [key, value]));
function normalizeNavigation(values) {
  return {
    ...values,
    navigation: values.navigation.map(item => item.key === 'featured-collections'
      ? { ...item, to: '/collections/featured-collection', megaMenu: true }
      : item),
  };
}
async function getWebsite() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: 'website_config' } });
  if (!setting) return defaults;
  try {
    const stored = JSON.parse(setting.value);
    const merged = { ...defaults, ...stored };
    if (!Array.isArray(stored.heroSlides)) merged.heroSlides = [{ id: 'hero-migrated', type: 'image', url: stored.heroImage || defaults.heroImage, altText: 'Bagiroo collection' }];
    return normalizeNavigation(schema.parse(merged));
  } catch { return defaults; }
}
async function saveWebsite(input) {
  const previous = await getWebsite();
  const values = normalizeNavigation(schema.parse({ ...previous, ...schema.partial().parse(input) }));
  await prisma.siteSetting.upsert({ where: { key: 'website_config' }, create: { key: 'website_config', value: JSON.stringify(values) }, update: { value: JSON.stringify(values) } });
  const replacedMedia = fields
    .filter(([, , type]) => type === 'image')
    .map(([key]) => previous[key] && previous[key] !== values[key] ? previous[key] : null)
    .filter(Boolean);
  previous.navigation.forEach(previousItem => {
    const nextItem = values.navigation.find(item => item.key === previousItem.key);
    if (previousItem.viewAllImageUrl && previousItem.viewAllImageUrl !== nextItem?.viewAllImageUrl) replacedMedia.push(previousItem.viewAllImageUrl);
  });
  const retainedMedia = new Set([
    ...fields.filter(([, , type]) => type === 'image').map(([key]) => values[key]).filter(Boolean),
    ...values.heroSlides.map(slide => slide.url),
    ...values.navigation.map(item => item.viewAllImageUrl).filter(Boolean),
  ]);
  previous.heroSlides.forEach(slide => {
    if (!values.heroSlides.some(next => next.url === slide.url) && !retainedMedia.has(slide.url)) replacedMedia.push(slide.url);
  });
  const cleanup = await Promise.allSettled([...new Set(replacedMedia.filter(url => !retainedMedia.has(url)))].map(deleteStoredMedia));
  cleanup.filter(result => result.status === 'rejected').forEach(result => console.error('[media] Cloudinary cleanup failed:', result.reason?.message));
  return values;
}
module.exports = { fields, defaults, getWebsite, saveWebsite };
