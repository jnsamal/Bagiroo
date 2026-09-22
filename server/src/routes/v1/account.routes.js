const express = require('express');
const controller = require('../../controllers/account.controller');
const wishlistController = require('../../controllers/wishlist.controller');
const returnsController = require('../../controllers/returns.controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();
router.use(requireAuth); // every /account route requires a logged-in user

router.get('/', controller.getAccount);
router.patch('/', controller.updateAccount);

router.get('/orders', controller.listOrders);
router.get('/orders/:id', controller.getOrder);
router.get('/orders/:id/invoice', controller.downloadInvoice);

router.get('/addresses', controller.listAddresses);
router.post('/addresses', controller.createAddress);
router.patch('/addresses/:id', controller.updateAddress);
router.delete('/addresses/:id', controller.deleteAddress);

// Security/details/support are thin wrappers for now — real content
// (password-less, so "security" mostly means session/device management,
// which is Phase 5 admin-adjacent work) lives here once designed.
router.get('/wishlist', wishlistController.getWishlist);

router.get('/returns', returnsController.listReturns);
router.post('/returns', returnsController.createReturn);

module.exports = router;
