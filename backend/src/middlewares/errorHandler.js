// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';
    let errors = err.errors || null;
  
    // Sequelize / DB errors
    if (err.name === 'SequelizeUniqueConstraintError') {
      statusCode = 409;
      message = 'Duplicate value';
      errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
    } else if (err.name === 'SequelizeValidationError') {
      statusCode = 400;
      message = 'Validation failed';
      errors = err.errors.map((e) => ({ field: e.path, message: e.message }));
    } else if (err.name === 'SequelizeForeignKeyConstraintError') {
      statusCode = 400;
      message = 'Invalid reference to related resource';
      errors = null;
    }
  
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
      statusCode = 401;
      message = 'Invalid token';
    } else if (err.name === 'TokenExpiredError') {
      statusCode = 401;
      message = 'Token expired';
    }
  
    // Malformed JSON body
    if (err.type === 'entity.parse.failed') {
      statusCode = 400;
      message = 'Invalid JSON payload';
    }
  
    if (statusCode === 500) {
      console.error(err); // log unexpected errors only
      if (process.env.NODE_ENV === 'production') message = 'Internal server error';
    }
  
    res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors }),
    });
  };