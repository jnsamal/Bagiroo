const express = require('express');
const rateLimit = require('express-rate-limit');
const controller = require('../../controllers/contact.controller');
const { requireAuth } = require('../../middleware/auth');

const router = express.Router();
const contactLimiter = rateLimit({ windowMs: 60 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { success: false, error: { message: 'Too many messages. Please try again later.' } } });
router.post('/', requireAuth, contactLimiter, controller.create);
module.exports = router;
