const express = require('express');

const authRoutes = require('./auth.routes');
const productsRoutes = require('./products.routes');
const categoriesRoutes = require('./categories.routes');
const collectionsRoutes = require('./collections.routes');
const homepageRoutes = require('./homepage.routes');
const videosRoutes = require('./videos.routes');
const testimonialsRoutes = require('./testimonials.routes');
const cartRoutes = require('./cart.routes');
const wishlistRoutes = require('./wishlist.routes');
const checkoutRoutes = require('./checkout.routes');
const ordersRoutes = require('./orders.routes');
const accountRoutes = require('./account.routes');
const adminRoutes = require('./admin.routes');
const newsletterRoutes = require('./newsletter.routes');
const settingsRoutes = require('./settings.routes');
const contactRoutes = require('./contact.routes');

const router = express.Router();
router.get('/csrf', require('../../middleware/csrf').issueCsrfToken);
router.get('/navigation', require('../../controllers/navigation.controller').getNavigation);

router.use('/auth', authRoutes);
router.use('/products', productsRoutes);
router.use('/categories', categoriesRoutes);
router.use('/collections', collectionsRoutes);
router.use('/homepage', homepageRoutes);
router.use('/videos', videosRoutes);
router.use('/testimonials', testimonialsRoutes);
router.use('/cart', cartRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/checkout', checkoutRoutes);
router.use('/orders', ordersRoutes);
router.use('/account', accountRoutes);
router.use('/admin', adminRoutes);
router.use('/newsletter', newsletterRoutes);
router.use('/settings', settingsRoutes);
router.use('/contact', contactRoutes);

module.exports = router;
