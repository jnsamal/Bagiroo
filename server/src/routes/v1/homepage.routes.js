const express = require('express');
const controller = require('../../controllers/homepage.controller');

const router = express.Router();

router.get('/', controller.getHomepage);

module.exports = router;
