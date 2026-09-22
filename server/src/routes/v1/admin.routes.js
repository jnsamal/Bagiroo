const express = require('express');
const multer = require('multer');
const { auditLog } = require('../../middleware/auditLog');
const { upload } = require('../../services/media.service');

const productsController = require('../../controllers/admin/products.controller');
const importController = require('../../controllers/admin/import.controller');
const ordersController = require('../../controllers/admin/orders.controller');
const returnsController = require('../../controllers/admin/returns.controller');
const couponsController = require('../../controllers/admin/coupons.controller');
const testimonialsController = require('../../controllers/admin/testimonials.controller');
const settingsController = require('../../controllers/admin/settings.controller');
const taxonomyController = require('../../controllers/admin/taxonomy.controller');
const mediaController = require('../../controllers/admin/media.controller');

const router = express.Router();

// Login is public; management routes require a separate password-authenticated admin session.
const adminAuth = require('../../controllers/admin-auth.controller');
const { authRateLimiter } = require('../../middleware/rateLimiter');
router.post('/login', adminAuth.login);
router.post('/logout', adminAuth.logout);
router.use(adminAuth.requireAdminAuth);
router.get('/me', adminAuth.me);
router.patch('/password', authRateLimiter, adminAuth.changePassword);
const contentController = require('../../controllers/admin/content.controller');
router.get('/website', contentController.getWebsite);
router.patch('/website', auditLog('update', 'Website'), contentController.saveWebsite);
router.get('/content/:resource', contentController.list);
router.post('/content/:resource', auditLog('create', 'Content'), contentController.save);
router.patch('/content/:resource/:id', auditLog('update', 'Content'), contentController.save);
router.delete('/content/:resource/:id', auditLog('delete', 'Content'), contentController.remove);

// Products
router.get('/products', productsController.listProducts);
router.get('/products/:id', productsController.getProduct);
router.post('/products', auditLog('create', 'Product'), productsController.createProduct);
router.patch('/products/:id', auditLog('update', 'Product'), productsController.updateProduct);
router.delete('/products/:id', auditLog('delete', 'Product'), productsController.deleteProduct);
router.post('/products/:id/archive', auditLog('archive', 'Product'), productsController.archiveProduct);
router.post('/products/:id/restore', auditLog('restore', 'Product'), productsController.restoreProduct);
router.post('/products/:id/toggle-publish', auditLog('toggle-publish', 'Product'), productsController.togglePublish);
router.post('/products/:id/variations', auditLog('create', 'ProductVariation'), productsController.createVariation);
router.patch('/products/:id/variations/:variationId', auditLog('update', 'ProductVariation'), productsController.updateVariation);
router.delete('/products/:id/variations/:variationId', auditLog('delete', 'ProductVariation'), productsController.deleteVariation);
router.post(
  '/products/bulk-import',
  auditLog('bulk-import', 'Product'),
  multer({ storage: multer.memoryStorage() }).single('file'),
  importController.bulkImport
);

// Categories & Collections
router.get('/categories', taxonomyController.listCategories);
router.post('/categories', auditLog('create', 'Category'), taxonomyController.createCategory);
router.patch('/categories/:id', auditLog('update', 'Category'), taxonomyController.updateCategory);
router.delete('/categories/:id', auditLog('delete', 'Category'), taxonomyController.deleteCategory);

router.get('/collections', taxonomyController.listCollections);
router.post('/collections', auditLog('create', 'Collection'), taxonomyController.createCollection);
router.patch('/collections/:id', auditLog('update', 'Collection'), taxonomyController.updateCollection);
router.delete('/collections/:id', auditLog('delete', 'Collection'), taxonomyController.deleteCollection);

// Orders
router.get('/orders', ordersController.listOrders);
router.get('/orders/:id', ordersController.getOrder);
router.patch('/orders/:id/status', auditLog('update-status', 'Order'), ordersController.updateOrderStatus);

// Returns
router.get('/returns', returnsController.listReturns);
router.patch('/returns/:id', auditLog('decide', 'Return'), returnsController.decideReturn);

// Coupons
router.get('/coupons', couponsController.listCoupons);
router.post('/coupons', auditLog('create', 'Coupon'), couponsController.createCoupon);
router.patch('/coupons/:id', auditLog('update', 'Coupon'), couponsController.updateCoupon);
router.delete('/coupons/:id', auditLog('delete', 'Coupon'), couponsController.deleteCoupon);

// Testimonials
router.get('/testimonials', testimonialsController.listTestimonials);
router.post('/testimonials', auditLog('create', 'Testimonial'), testimonialsController.createTestimonial);
router.patch('/testimonials/:id', auditLog('update', 'Testimonial'), testimonialsController.updateTestimonial);
router.delete('/testimonials/:id', auditLog('delete', 'Testimonial'), testimonialsController.deleteTestimonial);

// Settings / content (WhatsApp number, social links, announcements)
router.get('/settings', settingsController.getSettings);
router.patch('/settings/gifting', auditLog('update', 'SiteSetting'), settingsController.updateGifting);
router.patch('/settings/whatsapp', auditLog('update', 'SiteSetting'), settingsController.updateWhatsapp);
router.put('/settings/social-links', auditLog('upsert', 'SocialLink'), settingsController.upsertSocialLink);
router.post('/settings/announcements', auditLog('create', 'AnnouncementOffer'), settingsController.createAnnouncement);
router.patch('/settings/announcements/:id', auditLog('update', 'AnnouncementOffer'), settingsController.updateAnnouncement);
router.delete('/settings/announcements/:id', auditLog('delete', 'AnnouncementOffer'), settingsController.deleteAnnouncement);

// Media upload
router.post('/media', auditLog('upload', 'Media'), upload.single('file'), mediaController.uploadMedia);
router.delete('/media/:id', auditLog('delete', 'Media'), mediaController.deleteMedia);
router.patch('/media/:id', auditLog('reorder', 'Media'), mediaController.updateMediaOrder);

module.exports = router;
