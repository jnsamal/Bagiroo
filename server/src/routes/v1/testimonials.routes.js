const express = require('express');
const controller = require('../../controllers/testimonials.controller');

const router = express.Router();

router.get('/', controller.listTestimonials);

module.exports = router;
