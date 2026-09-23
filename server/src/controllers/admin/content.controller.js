const { z } = require('zod');
const prisma = require('../../config/prismaClient');
const asyncHandler = require('../../middleware/asyncHandler');
const { ApiError } = require('../../middleware/errorHandler');
const website = require('../../services/website.service');
const text = z.string().max(20000);
const url = z.string().max(2000).refine(value => !value || /^\/(?!\/)[^\\\s]*$/.test(value) || /^https?:\/\/[^\s]+$/i.test(value), 'Use a /path or http(s) URL.');
const number = z.number().int();
const date = z.string().refine(value => !value || !Number.isNaN(Date.parse(value)), 'Enter a valid date.').transform(value => value ? new Date(value) : null);
const definitions = {
  testimonials: { model: 'testimonial', title: 'Testimonials', fields: [['authorName','Customer name','text'],['avatarUrl','Customer image','image'],['rating','Rating (1–5)','number'],['quote','Testimonial','textarea'],['isVisible','Visible','boolean'],['sortOrder','Display order','number']], schema: z.object({ authorName: text.min(1), avatarUrl: url, rating: number.min(1).max(5), quote: text.min(1), isVisible: z.boolean(), sortOrder: number }) },
  announcements: { model: 'announcementOffer', title: 'Announcements', fields: [['message','Message','text'],['linkUrl','Destination','url'],['sortOrder','Display order','number'],['isActive','Active','boolean'],['startsAt','Starts at','datetime'],['endsAt','Ends at','datetime']], schema: z.object({ message: text.min(1), linkUrl: url, sortOrder: number, isActive: z.boolean(), startsAt: date, endsAt: date }).refine(value => !value.startsAt || !value.endsAt || value.endsAt > value.startsAt, 'End date must be after the start date.') },
  coupons: { model: 'coupon', title: 'Coupons', fields: [['code','Coupon code','text'],['description','Description','textarea'],['discountType','Discount type','select',null,null,['PERCENTAGE','FLAT']],['discountValue','Discount (% or paise)','number'],['minOrderMinor','Minimum order (paise)','number'],['isActive','Active','boolean'],['startsAt','Starts at','datetime'],['endsAt','Ends at','datetime']], schema: z.object({ code: text.min(1), description: text, discountType: z.enum(['PERCENTAGE','FLAT']), discountValue: number.min(0), minOrderMinor: number.min(0), isActive: z.boolean(), startsAt: date, endsAt: date }).refine(value => value.discountType !== 'PERCENTAGE' || value.discountValue <= 100, 'Percentage must be at most 100.').refine(value => !value.startsAt || !value.endsAt || value.endsAt > value.startsAt, 'End date must be after the start date.') },
  categories: { model: 'category', title: 'Categories', fields: [['name','Name','text'],['slug','Slug','text'],['description','Description','textarea'],['imageUrl','Image','image'],['sortOrder','Display order','number'],['isVisible','Visible','boolean']], schema: z.object({ name: text.min(1), slug: text.min(1), description: text, imageUrl: url, sortOrder: number, isVisible: z.boolean() }) },
  collections: { model: 'collection', title: 'Collections', fields: [['name','Name','text'],['slug','Slug','text'],['description','Description','textarea'],['imageUrl','Image','image'],['sortOrder','Display order','number'],['isFeatured','Featured on homepage','boolean'],['productIds','Products','products']], schema: z.object({ name: text.min(1), slug: text.min(1), description: text, imageUrl: url, sortOrder: number, isFeatured: z.boolean(), productIds: z.array(z.string()) }), include: { products: true } },
  videos: { model: 'productVideo', title: 'Product videos', fields: [['productId','Product','product'],['url','Video URL','video'],['posterUrl','Poster image','image'],['caption','Caption','text'],['sortOrder','Display order','number'],['isActive','Active','boolean']], schema: z.object({ productId: text.min(1), url: url.refine(Boolean, 'Video is required.'), posterUrl: url, caption: text, sortOrder: number, isActive: z.boolean() }) },
  instagram: { model: 'instagramPost', title: 'Instagram posts', fields: [['imageUrl','Image','image'],['permalink','Post URL','url'],['caption','Caption','textarea'],['sortOrder','Display order','number'],['isVisible','Visible','boolean']], schema: z.object({ imageUrl: url, permalink: url, caption: text, sortOrder: number, isVisible: z.boolean() }) },
  reviews: { model: 'review', title: 'Product reviews', orderBy: { createdAt: 'desc' }, fields: [['productId','Product','product'],['authorName','Customer name','text'],['rating','Rating (1–5)','number'],['comment','Review','textarea'],['isApproved','Approved','boolean']], schema: z.object({ productId: text.min(1), authorName: text.min(1), rating: number.min(1).max(5), comment: text, isApproved: z.boolean() }) },
  inventory: { model: 'inventory', title: 'Inventory', editOnly: true, fields: [['quantityAvailable','On-hand quantity','number']], schema: z.object({ quantityAvailable: number.min(0) }), include: { product: { select: { title: true, sku: true } }, variation: { select: { colorName: true, sku: true, product: { select: { title: true } } } } } },
  contacts: { model: 'contactMessage', title: 'Contact messages', editOnly: true, orderBy: { createdAt: 'desc' }, fields: [['status','Status','select',null,null,['NEW','IN_PROGRESS','RESOLVED']]], schema: z.object({ status: z.enum(['NEW','IN_PROGRESS','RESOLVED']) }) },
};
function definition(req) { const value = definitions[req.params.resource]; if (!value) throw new ApiError(404, 'Content section not found.'); return value; }
const getWebsite = asyncHandler(async (req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json({ success: true, data: { fields: website.fields, values: await website.getWebsite() } });
});
const saveWebsite = asyncHandler(async (req, res) => res.json({ success: true, data: await website.saveWebsite(req.body) }));
const list = asyncHandler(async (req, res) => {
  const def = definition(req);
  const [items, products] = await Promise.all([prisma[def.model].findMany({ include: def.include, orderBy: def.orderBy }), prisma.product.findMany({ where: { deletedAt: null }, select: { id: true, title: true }, orderBy: { title: 'asc' } })]);
  res.json({ success: true, data: { title: def.title, fields: def.fields, editOnly: !!def.editOnly, products, items: items.map(item => ({ ...item, ...(item.products ? { productIds: item.products.map(entry => entry.productId) } : {}) })) } });
});
const save = asyncHandler(async (req, res) => {
  const def = definition(req);
  if (def.editOnly && !req.params.id) throw new ApiError(400, 'Select an existing stock record.');
  const { productIds, ...data } = def.schema.parse(req.body);
  const record = await prisma.$transaction(async tx => {
    if (req.params.id && !await tx[def.model].findUnique({ where: { id: req.params.id } })) throw new ApiError(404, 'Record not found.');
    if (def.model === 'inventory') {
      const result = await tx.inventory.updateMany({ where: { id: req.params.id, quantityReserved: { lte: data.quantityAvailable } }, data });
      if (!result.count) throw new ApiError(409, 'On-hand quantity cannot be below reserved stock.');
      return tx.inventory.findUnique({ where: { id: req.params.id } });
    }
    if (productIds) data.products = req.params.id ? { deleteMany: {}, create: productIds.map(productId => ({ productId })) } : { create: productIds.map(productId => ({ productId })) };
    if (def.model === 'collection') { data.isPlaceholder = false; if (data.isFeatured) await tx.collection.updateMany({ data: { isFeatured: false } }); }
    if (def.model === 'testimonial') data.isPlaceholder = false;
    return req.params.id ? tx[def.model].update({ where: { id: req.params.id }, data }) : tx[def.model].create({ data });
  });
  res.json({ success: true, data: record });
});
const remove = asyncHandler(async (req, res) => {
  const def = definition(req);
  if (def.editOnly) throw new ApiError(400, 'Inventory records cannot be deleted here.');
  await prisma.$transaction(async tx => {
    if (def.model === 'category') await tx.productCategory.deleteMany({ where: { categoryId: req.params.id } });
    if (def.model === 'collection') await tx.productCollection.deleteMany({ where: { collectionId: req.params.id } });
    if (def.model === 'coupon') await tx.couponUsage.deleteMany({ where: { couponId: req.params.id } });
    await tx[def.model].delete({ where: { id: req.params.id } });
  });
  res.json({ success: true, data: { message: 'Removed.' } });
});
module.exports = { getWebsite, saveWebsite, list, save, remove };
