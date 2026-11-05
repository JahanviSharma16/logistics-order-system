const { body } = require('express-validator');

const registerRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required').bail()
    .isEmail().withMessage('Email must be valid').bail()
    .toLowerCase(),

  body('password')
    .isString().withMessage('Password is required').bail()
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),

  body('role')
    .notEmpty().withMessage('Role is required').bail()
    .isIn(['ADMIN', 'USER']).withMessage('Role must be either ADMIN or USER'),

  body('access')
    .optional({ values: 'null' })
    .isIn(['VIEW', 'CREATE']).withMessage('Access must be either VIEW or CREATE'),
];

const loginRules = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required').bail()
    .isEmail().withMessage('Email must be valid').bail()
    .toLowerCase(),

  body('password')
    .notEmpty().withMessage('Password is required'),
];

module.exports = { registerRules, loginRules };
