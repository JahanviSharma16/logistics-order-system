const express = require('express');
const authController = require('../controllers/auth.controller');
const { registerRules, loginRules } = require('../validators/auth.validator');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');

const router = express.Router();

router.post('/register', registerRules, validate, authController.register);
router.post('/login', loginRules, validate, authController.login);
router.get('/me', authenticate, authController.me);

module.exports = router;
