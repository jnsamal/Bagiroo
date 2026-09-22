const express = require('express');
const controller = require('../../controllers/auth.controller');
const { requireAuth } = require('../../middleware/auth');
const { otpRequestRateLimiter } = require('../../middleware/rateLimiter');

const router = express.Router();

router.post('/otp/request', otpRequestRateLimiter, controller.requestOtp);
router.post('/otp/verify', controller.verifyOtp);
router.post('/logout', controller.logout);
router.get('/me', requireAuth, controller.me);

module.exports = router;
