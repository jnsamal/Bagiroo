const express = require('express');
const controller = require('../../controllers/categories.controller');

const router = express.Router();

router.get('/', controller.listCategories);
router.get('/:slug/products', controller.getCategoryProducts);

module.exports = router;
