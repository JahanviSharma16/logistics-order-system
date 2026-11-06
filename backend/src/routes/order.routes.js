const express = require('express');
const orderController = require('../controllers/order.controller');
const {
  createOrderRules,
  listOrdersRules,
  orderIdRules,
} = require('../validators/order.validator');
const validate = require('../middlewares/validate');
const authenticate = require('../middlewares/authenticate');
const { authorizeRoles, requireAccess } = require('../middlewares/authorize');

const router = express.Router();

router.use(authenticate);

router.post('/', requireAccess('CREATE'), createOrderRules, validate, orderController.create);
router.get('/', listOrdersRules, validate, orderController.list);
router.get('/:id', orderIdRules, validate, orderController.getById);
router.post('/:id/cancel', requireAccess('CREATE'), orderIdRules, validate, orderController.cancel);
router.post(
  '/:id/confirm',
  authorizeRoles('ADMIN'),
  orderIdRules,
  validate,
  orderController.confirm
);

module.exports = router;
