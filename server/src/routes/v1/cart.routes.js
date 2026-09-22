const express = require('express');
const controller = require('../../controllers/cart.controller');
const { attachUserIfPresent } = require('../../middleware/auth');

const router = express.Router();
router.use(attachUserIfPresent); // cart works for guests, but recognizes logged-in users too

router.get('/', controller.getCart);
router.post('/items', controller.addItem);
router.patch('/items/:id', controller.updateItem);
router.delete('/items/:id', controller.removeItem);
router.post('/coupon', controller.applyCoupon);

module.exports = router;
