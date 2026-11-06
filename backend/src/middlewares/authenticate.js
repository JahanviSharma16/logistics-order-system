const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const { verifyToken } = require('../utils/jwt');
const { User } = require('../models');

module.exports = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new AppError('Authentication required', 401);
  }

  const payload = verifyToken(token);

  const user = await User.findByPk(payload.id);
  if (!user) {
    throw new AppError('User no longer exists', 401);
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role,
    access: user.access,
  };

  next();
});
