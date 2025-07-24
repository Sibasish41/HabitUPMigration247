const { body, validationResult } = require('express-validator');
const { ApiError } = require('./errorHandler');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path,
      message: error.msg,
      value: error.value
    }));
    return next(new ApiError('Validation failed', 400, errorMessages));
  }
  next();
};

// Payment validation rules
const validatePayment = [
  body('entityId')
    .notEmpty()
    .withMessage('Entity ID is required')
    .isUUID()
    .withMessage('Entity ID must be a valid UUID'),
  
  body('entityType')
    .notEmpty()
    .withMessage('Entity type is required')
    .isIn(['MEETING', 'SUBSCRIPTION'])
    .withMessage('Entity type must be either MEETING or SUBSCRIPTION'),
  
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  
  handleValidationErrors
];

// Refund validation rules
const validateRefund = [
  body('refundReason')
    .notEmpty()
    .withMessage('Refund reason is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Refund reason must be between 10 and 1000 characters'),
  
  body('refundAmount')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Refund amount must be a positive number'),
  
  handleValidationErrors
];

// User validation rules
const validateUser = [
  body('name')
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .optional()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  handleValidationErrors
];

// Habit validation rules
const validateHabit = [
  body('name')
    .notEmpty()
    .withMessage('Habit name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Habit name must be between 2 and 100 characters'),
  
  body('description')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Description must be less than 500 characters'),
  
  body('frequency')
    .optional()
    .isIn(['DAILY', 'WEEKLY', 'MONTHLY'])
    .withMessage('Frequency must be DAILY, WEEKLY, or MONTHLY'),
  
  body('targetCount')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Target count must be a positive integer'),
  
  handleValidationErrors
];

// Meeting validation rules
const validateMeeting = [
  body('doctorId')
    .notEmpty()
    .withMessage('Doctor ID is required')
    .isUUID()
    .withMessage('Doctor ID must be a valid UUID'),
  
  body('scheduledAt')
    .notEmpty()
    .withMessage('Scheduled time is required')
    .isISO8601()
    .withMessage('Scheduled time must be a valid date'),
  
  body('meetingType')
    .optional()
    .isIn(['VIDEO_CALL', 'PHONE_CALL', 'IN_PERSON'])
    .withMessage('Meeting type must be VIDEO_CALL, PHONE_CALL, or IN_PERSON'),
  
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters'),
  
  handleValidationErrors
];

// Feedback validation rules
const validateFeedback = [
  body('rating')
    .notEmpty()
    .withMessage('Rating is required')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  
  body('comment')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Comment must be less than 1000 characters'),
  
  body('entityType')
    .optional()
    .isIn(['MEETING', 'DOCTOR', 'APP'])
    .withMessage('Entity type must be MEETING, DOCTOR, or APP'),
  
  handleValidationErrors
];

// Subscription validation rules
const validateSubscription = [
  body('planType')
    .notEmpty()
    .withMessage('Plan type is required')
    .isIn(['BASIC', 'PREMIUM', 'PRO'])
    .withMessage('Plan type must be BASIC, PREMIUM, or PRO'),
  
  body('billingCycle')
    .notEmpty()
    .withMessage('Billing cycle is required')
    .isIn(['MONTHLY', 'YEARLY'])
    .withMessage('Billing cycle must be MONTHLY or YEARLY'),
  
  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isFloat({ min: 1 })
    .withMessage('Amount must be a positive number'),
  
  body('currency')
    .optional()
    .isIn(['INR', 'USD', 'EUR'])
    .withMessage('Currency must be INR, USD, or EUR'),
  
  handleValidationErrors
];

// Subscription update validation rules
const validateSubscriptionUpdate = [
  body('planType')
    .optional()
    .isIn(['BASIC', 'PREMIUM', 'PRO'])
    .withMessage('Plan type must be BASIC, PREMIUM, or PRO'),
  
  body('autoRenewal')
    .optional()
    .isBoolean()
    .withMessage('Auto renewal must be a boolean'),
  
  body('paymentMethodId')
    .optional()
    .isLength({ min: 1 })
    .withMessage('Payment method ID cannot be empty'),
  
  handleValidationErrors
];

module.exports = {
  validatePayment,
  validateRefund,
  validateUser,
  validateHabit,
  validateMeeting,
  validateFeedback,
  validateSubscription,
  validateSubscriptionUpdate,
  handleValidationErrors
};
