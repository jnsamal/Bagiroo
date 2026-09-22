const express = require('express');
const controller = require('../../controllers/wishlist.controller');
const { attachUserIfPresent } = require('../../middleware/auth');

const router = express.Router();
router.use(attachUserIfPresent);

router.get('/', controller.getWishlist);
router.post('/items', controller.addItem);
router.delete('/items/:productId', controller.removeItem);

module.exports = router;
