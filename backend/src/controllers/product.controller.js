const asyncHandler = require('../utils/asyncHandler');
const productService = require('../services/product.service');
const { parsePagination } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, offset } = parsePagination(req.query);
  const result = await productService.listProducts({
    search: req.query.search,
    page,
    limit,
    offset,
  });
  res.json({ success: true, ...result });
});

module.exports = { list };
