const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = { ...err };
  error.message = err.message;

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    const messages = err.errors.map(error => error.message);
    error = {
      message: 'Validation Error',
      details: messages
    };
    return res.status(400).json(error);
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    const field = err.errors[0].path;
    error = {
      message: `${field} already exists`,
      field: field
    };
    return res.status(400).json(error);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token'
    };
    return res.status(401).json(error);
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired'
    };
    return res.status(401).json(error);
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      message: 'File too large'
    };
    return res.status(400).json(error);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      message: 'Unexpected file field'
    };
    return res.status(400).json(error);
  }

  // Database connection errors
  if (err.name === 'SequelizeConnectionError') {
    error = {
      message: 'Database connection error'
    };
    return res.status(500).json(error);
  }

  // Custom API errors
  if (err.isOperational) {
    return res.status(err.statusCode || 500).json({
      message: err.message
    });
  }

  // Default to 500 server error
  res.status(err.statusCode || 500).json({
    message: err.message || 'Internal Server Error'
  });
};

// Custom error class for operational errors
class ApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = { errorHandler, ApiError };
