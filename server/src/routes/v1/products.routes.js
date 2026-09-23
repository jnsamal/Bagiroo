const express = require('express');
const controller = require('../../controllers/products.controller');
const { reviewRateLimiter } = require('../../middleware/rateLimiter');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();

router.get('/', controller.listProducts);
router.post('/:slug/reviews', requireAuth, reviewRateLimiter, controller.createReview);
router.get('/:slug', controller.getProductBySlug);

module.exports = router;
