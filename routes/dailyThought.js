const express = require('express');
const router = express.Router();
const dailyThoughtController = require('../controllers/dailyThoughtController');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');

// Validation middleware to handle errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: 'Validation Error',
      errors: errors.array(),
    });
  }
  next();
};

// Public routes (accessible to authenticated users)
router.get('/today', authenticateToken, dailyThoughtController.getTodayThought);
router.get('/random', authenticateToken, dailyThoughtController.getRandomThought);
router.get('/category/:category', 
  authenticateToken,
  [
    param('category')
      .isIn(['motivation', 'wellness', 'productivity', 'mindfulness', 'inspiration'])
      .withMessage('Invalid category. Must be one of: motivation, wellness, productivity, mindfulness, inspiration'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100')
  ],
  handleValidationErrors,
  dailyThoughtController.getThoughtsByCategory
);
router.get('/:id', 
  authenticateToken,
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID must be a positive integer')
  ],
  handleValidationErrors,
  dailyThoughtController.getDailyThoughtById
);

// Admin routes (require admin privileges)
router.post('/', 
  authenticateToken, 
  isAdmin,
  [
    body('content')
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ min: 10, max: 500 })
      .withMessage('Content must be between 10 and 500 characters'),
    body('author')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Author name cannot exceed 100 characters'),
    body('category')
      .notEmpty()
      .withMessage('Category is required')
      .isIn(['motivation', 'wellness', 'productivity', 'mindfulness', 'inspiration'])
      .withMessage('Invalid category. Must be one of: motivation, wellness, productivity, mindfulness, inspiration'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],
  handleValidationErrors,
  dailyThoughtController.createDailyThought
);
router.get('/', 
  authenticateToken, 
  isAdmin,
  [
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    query('category')
      .optional()
      .isIn(['motivation', 'wellness', 'productivity', 'mindfulness', 'inspiration'])
      .withMessage('Invalid category'),
    query('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],
  handleValidationErrors,
  dailyThoughtController.getAllDailyThoughts
);
router.put('/:id', 
  authenticateToken, 
  isAdmin,
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID must be a positive integer'),
    body('content')
      .optional()
      .isLength({ min: 10, max: 500 })
      .withMessage('Content must be between 10 and 500 characters'),
    body('author')
      .optional()
      .isLength({ max: 100 })
      .withMessage('Author name cannot exceed 100 characters'),
    body('category')
      .optional()
      .isIn(['motivation', 'wellness', 'productivity', 'mindfulness', 'inspiration'])
      .withMessage('Invalid category'),
    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean')
  ],
  handleValidationErrors,
  dailyThoughtController.updateDailyThought
);
router.delete('/:id', 
  authenticateToken, 
  isAdmin,
  [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID must be a positive integer')
  ],
  handleValidationErrors,
  dailyThoughtController.deleteDailyThought
);
router.get('/admin/stats', authenticateToken, isAdmin, dailyThoughtController.getCategoriesStats);

module.exports = router;
