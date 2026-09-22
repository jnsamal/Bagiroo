const express = require('express');
const controller = require('../../controllers/orders.controller');
const { attachUserIfPresent } = require('../../middleware/auth');

const router = express.Router();
router.use(attachUserIfPresent); // guest checkout is allowed

router.post('/', controller.createOrder);
router.post('/:id/verify-payment', controller.verifyPayment);

module.exports = router;
