const { query } = require('express-validator');

const listProductsRules = [
  query('search')
    .optional()
    .isString().withMessage('Search must be text').bail()
    .isLength({ max: 100 }).withMessage('Search must be at most 100 characters'),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
];

module.exports = { listProductsRules };
