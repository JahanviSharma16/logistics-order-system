const { body, query, param } = require('express-validator');

const ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'CANCELLED'];

const createOrderRules = [
  body('items')
    .isArray({ min: 1, max: 50 }).withMessage('Items must be a non-empty array (max 50 items)'),
  body('items.*.sku')
    .isString().withMessage('Each item must have a sku').bail()
    .trim()
    .notEmpty().withMessage('SKU cannot be empty'),
  body('items.*.qty')
    .isInt({ min: 1, max: 1000 }).withMessage('Quantity must be an integer between 1 and 1000')
    .toInt(),
];

const listOrdersRules = [
  query('status')
    .optional({ values: 'falsy' })
    .isIn(ORDER_STATUSES).withMessage(`Status must be one of ${ORDER_STATUSES.join(', ')}`),
  query('from')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('"from" must be a valid date (YYYY-MM-DD or ISO 8601)'),
  query('to')
    .optional({ values: 'falsy' })
    .isISO8601().withMessage('"to" must be a valid date (YYYY-MM-DD or ISO 8601)').bail()
    .custom((to, { req }) => {
      if (req.query.from && new Date(req.query.from) > new Date(to)) {
        throw new Error('"to" must be on or after "from"');
      }
      return true;
    }),
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
];

const orderIdRules = [
  param('id').isInt({ min: 1 }).withMessage('Order id must be a positive integer'),
];

module.exports = { createOrderRules, listOrdersRules, orderIdRules, ORDER_STATUSES };
