const express = require('express');
const controller = require('../../controllers/collections.controller');

const router = express.Router();

router.get('/', controller.listCollections);
router.get('/:slug', controller.getCollectionBySlug);

module.exports = router;
