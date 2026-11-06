const AppError = require('../utils/AppError');

const authorizeRoles =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) return next(new AppError('Authentication required', 401));
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You are not allowed to perform this action', 403));
    }
    return next();
  };

const requireAccess =
  (...levels) =>
  (req, res, next) => {
    if (!req.user) return next(new AppError('Authentication required', 401));
    if (req.user.role === 'ADMIN') return next();
    if (!levels.includes(req.user.access)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    return next();
  };

module.exports = { authorizeRoles, requireAccess };
