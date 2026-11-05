const { Op } = require('sequelize');
const { sequelize, Order, OrderItem, Product, User } = require('../models');
const AppError = require('../utils/AppError');
const { toCents, fromCents } = require('../utils/money');
const { generateOrderNumber } = require('../utils/orderNumber');
const { buildPagination } = require('../utils/pagination');

const CANCELLABLE_STATUSES = ['PENDING', 'CONFIRMED'];

const ownershipFilter = (user) => (user.role === 'ADMIN' ? {} : { user_id: user.id });

const mergeItems = (items) => {
  const merged = new Map();
  for (const { sku, qty } of items) {
    const key = String(sku).trim();
    merged.set(key, (merged.get(key) || 0) + Number(qty));
  }
  return merged;
};

const orderDetailsInclude = [
  {
    model: OrderItem,
    as: 'items',
    attributes: ['id', 'product_id', 'quantity', 'unit_price', 'created_at'],
    include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'sku'] }],
  },
  { model: User, as: 'user', attributes: ['id', 'email'] },
];

const createOrder = async (user, items) => {
  const requested = mergeItems(items);
  const skus = [...requested.keys()];

  return sequelize.transaction(async (t) => {
    const products = await Product.findAll({
      where: { sku: skus },
      order: [['id', 'ASC']],
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    const bySku = new Map(products.map((p) => [p.sku, p]));

    const missing = skus.filter((sku) => !bySku.has(sku));
    if (missing.length) {
      throw new AppError(
        `Product(s) not found: ${missing.join(', ')}`,
        404,
        missing.map((sku) => ({ field: sku, message: 'Product not found' }))
      );
    }

    const insufficient = [];
    for (const [sku, qty] of requested) {
      const product = bySku.get(sku);
      if (product.stock_qty < qty) {
        insufficient.push({
          field: sku,
          message: `Requested ${qty}, only ${product.stock_qty} available`,
        });
      }
    }
    if (insufficient.length) {
      throw new AppError('Insufficient stock', 409, insufficient);
    }

    let totalCents = 0;
    const itemRows = [];
    for (const product of products) {
      const qty = requested.get(product.sku);
      await product.decrement('stock_qty', { by: qty, transaction: t });

      totalCents += toCents(product.price) * qty;
      itemRows.push({
        product_id: product.id,
        quantity: qty,
        unit_price: fromCents(toCents(product.price)), 
      });
    }

    const order = await Order.create(
      {
        user_id: user.id,
        order_number: generateOrderNumber(),
        status: 'PENDING',
        total_amount: fromCents(totalCents),
      },
      { transaction: t }
    );

    await OrderItem.bulkCreate(
      itemRows.map((row) => ({ ...row, order_id: order.id })),
      { transaction: t }
    );

    return Order.findByPk(order.id, { include: orderDetailsInclude, transaction: t });
  });
};

const buildDateRange = (from, to) => {
  const range = {};
  if (from) range[Op.gte] = new Date(from);
  if (to) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(to)) {
      const end = new Date(to);
      end.setUTCDate(end.getUTCDate() + 1);
      range[Op.lt] = end;
    } else {
      range[Op.lte] = new Date(to);
    }
  }
  return range;
};

const listOrders = async (user, { status, from, to, page, limit, offset }) => {
  const where = { ...ownershipFilter(user) };
  if (status) where.status = status;
  if (from || to) where.created_at = buildDateRange(from, to);

  const { rows, count } = await Order.findAndCountAll({
    where,
    attributes: {
      include: [
        [
          sequelize.literal(
            '(SELECT COALESCE(SUM(oi.quantity), 0)::int FROM order_items oi WHERE oi.order_id = "Order"."id")'
          ),
          'item_count',
        ],
        [
          sequelize.literal(
            '(SELECT COUNT(*)::int FROM order_items oi WHERE oi.order_id = "Order"."id")'
          ),
          'product_count',
        ],
      ],
    },
    include: [{ model: User, as: 'user', attributes: ['id', 'email'] }],
    order: [['created_at', 'DESC'], ['id', 'DESC']],
    limit,
    offset,
  });

  return { data: rows, pagination: buildPagination(page, limit, count) };
};

const getOrderById = async (user, id) => {
  const order = await Order.findOne({
    where: { id, ...ownershipFilter(user) },
    include: orderDetailsInclude,
  });
  if (!order) throw new AppError('Order not found', 404);
  return order;
};

const cancelOrder = async (user, id) =>
  sequelize.transaction(async (t) => {
    const order = await Order.findOne({
      where: { id, ...ownershipFilter(user) },
      lock: t.LOCK.UPDATE,
      transaction: t,
    });
    if (!order) throw new AppError('Order not found', 404);

    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      throw new AppError(
        `Only PENDING or CONFIRMED orders can be cancelled (current status: ${order.status})`,
        409
      );
    }

    const items = await OrderItem.findAll({
      where: { order_id: order.id },
      order: [['product_id', 'ASC']], 
      transaction: t,
    });

    for (const item of items) {
      await Product.increment('stock_qty', {
        by: item.quantity,
        where: { id: item.product_id },
        transaction: t,
      });
    }

    order.status = 'CANCELLED';
    await order.save({ transaction: t });

    return Order.findByPk(order.id, { include: orderDetailsInclude, transaction: t });
  });

const confirmOrder = async (id) =>
  sequelize.transaction(async (t) => {
    const order = await Order.findByPk(id, { lock: t.LOCK.UPDATE, transaction: t });
    if (!order) throw new AppError('Order not found', 404);
    if (order.status !== 'PENDING') {
      throw new AppError(`Only PENDING orders can be confirmed (current status: ${order.status})`, 409);
    }
    order.status = 'CONFIRMED';
    await order.save({ transaction: t });
    return order;
  });

module.exports = { createOrder, listOrders, getOrderById, cancelOrder, confirmOrder };
