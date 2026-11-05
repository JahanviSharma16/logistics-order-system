const asyncHandler = require('../utils/asyncHandler');
const orderService = require('../services/order.service');
const { parsePagination } = require('../utils/pagination');

const create = asyncHandler(async (req, res) => {
  const order = await orderService.createOrder(req.user, req.body.items);
  res.status(201).json({ success: true, message: 'Order placed successfully', data: order });
});

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const { status, from, to } = req.query;
  const result = await orderService.listOrders(req.user, { status, from, to, page, limit, offset });
  res.json({ success: true, ...result });
});

const getById = asyncHandler(async (req, res) => {
  const order = await orderService.getOrderById(req.user, Number(req.params.id));
  res.json({ success: true, data: order });
});

const cancel = asyncHandler(async (req, res) => {
  const order = await orderService.cancelOrder(req.user, Number(req.params.id));
  res.json({ success: true, message: 'Order cancelled successfully', data: order });
});

const confirm = asyncHandler(async (req, res) => {
  const order = await orderService.confirmOrder(Number(req.params.id));
  res.json({ success: true, message: 'Order confirmed successfully', data: order });
});

module.exports = { create, list, getById, cancel, confirm };
