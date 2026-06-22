const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  // Default error
  let statusCode = 500;
  let message = 'Internal server error';

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }
  // Validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = err.message;
  }
  // Database errors
  else if (err.code && err.code.startsWith('23')) {
    statusCode = 400;
    message = 'Database constraint violated';
  }
  // Custom error with status
  else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
