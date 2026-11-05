const express = require('express');
const productController = require('../controllers/product.controller');
const { listProductsRules } = require('../validators/product.validator');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.get('/', authenticate, listProductsRules, validate, productController.list);

module.exports = router;
