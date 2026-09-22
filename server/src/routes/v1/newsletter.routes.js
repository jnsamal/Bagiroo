const express = require('express');
const controller = require('../../controllers/newsletter.controller');

const router = express.Router();

router.post('/', controller.subscribe);

module.exports = router;
