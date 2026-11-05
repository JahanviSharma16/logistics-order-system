const { Op } = require('sequelize');
const { Product } = require('../models');
const escapeLike = require('../utils/escapeLike');
const { buildPagination } = require('../utils/pagination');


const listProducts = async ({ search, page, limit, offset }) => {
  const where = {};
  const term = search ? String(search).trim() : '';

  if (term) {
    const pattern = `%${escapeLike(term)}%`;
    where[Op.or] = [
      { name: { [Op.iLike]: pattern } },
      { sku: { [Op.iLike]: pattern } },
    ];
  }

  const { rows, count } = await Product.findAndCountAll({
    where,
    attributes: ['id', 'name', 'sku', 'price', 'stock_qty', 'created_at'],
    order: [['name', 'ASC'], ['id', 'ASC']],
    limit,
    offset,
  });

  return { data: rows, pagination: buildPagination(page, limit, count) };
};

module.exports = { listProducts };
