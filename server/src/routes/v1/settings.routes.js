const express = require('express');
const controller = require('../../controllers/settings.controller');

const router = express.Router();

router.get('/public', controller.getPublicSettings);

module.exports = router;
