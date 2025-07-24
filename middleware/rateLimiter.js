const rateLimit = require('express-rate-limit');

// Create a flexible rate limiter
const createRateLimiter = (options = {}) => {
  const defaultOptions = {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Maximum requests per window
    message: {
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(options.windowMs / 1000 / 60) || 15 // minutes
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
      res.status(429).json(options.message || defaultOptions.message);
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      if (req.path === '/health') {
        return true;
      }
      // Skip for admin users in development
      if (process.env.NODE_ENV === 'development' && req.user?.userType === 'ADMIN') {
        return true;
      }
      return false;
    }
  };

  return rateLimit({ ...defaultOptions, ...options });
};

// Predefined rate limiters for different use cases
const rateLimiters = {
  // General API rate limiting
  general: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100,
    message: {
      success: false,
      message: 'Too many API requests. Please try again in 15 minutes.',
      retryAfter: 15
    }
  }),

  // Strict rate limiting for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Only 5 attempts per 15 minutes
    message: {
      success: false,
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
      retryAfter: 15
    }
  }),

  // Password reset rate limiting
  passwordReset: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Only 3 password reset attempts per hour
    message: {
      success: false,
      message: 'Too many password reset attempts. Please try again in 1 hour.',
      retryAfter: 60
    }
  }),

  // File upload rate limiting
  upload: createRateLimiter({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 10, // 10 uploads per 10 minutes
    message: {
      success: false,
      message: 'Too many file uploads. Please try again in 10 minutes.',
      retryAfter: 10
    }
  }),

  // Payment operations rate limiting
  payment: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // 10 payment operations per 15 minutes
    message: {
      success: false,
      message: 'Too many payment requests. Please try again in 15 minutes.',
      retryAfter: 15
    }
  }),

  // Message sending rate limiting
  messaging: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 messages per minute
    message: {
      success: false,
      message: 'Too many messages sent. Please slow down.',
      retryAfter: 1
    }
  }),

  // Admin operations rate limiting
  admin: createRateLimiter({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 200, // Higher limit for admin operations
    message: {
      success: false,
      message: 'Too many admin requests. Please try again in 5 minutes.',
      retryAfter: 5
    }
  }),

  // Feedback submission rate limiting
  feedback: createRateLimiter({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 feedback submissions per hour
    message: {
      success: false,
      message: 'Too many feedback submissions. Please try again in 1 hour.',
      retryAfter: 60
    }
  })
};

module.exports = {
  createRateLimiter,
  rateLimiters,
  rateLimiter: createRateLimiter // Default export for backward compatibility
};
