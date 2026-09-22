const express = require('express');
const controller = require('../../controllers/checkout.controller');
const { attachUserIfPresent } = require('../../middleware/auth');

const router = express.Router();
router.use(attachUserIfPresent);

router.post('/validate', controller.validate);

module.exports = router;
