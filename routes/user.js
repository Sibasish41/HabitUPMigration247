const express = require('express');
const { body, param, validationResult } = require('express-validator');
const userController = require('../controllers/userController');
const { authorize } = require('../middleware/auth');
const router = express.Router();

// Middleware to handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation Error',
      errors: errors.array()
    });
  }
  next();
};

// Get current user profile
router.get('/profile', userController.getCurrentUser);

// Get user dashboard
router.get('/dashboard', userController.getDashboard);

// Get user statistics
router.get('/statistics', userController.getStatistics);

// Update user profile
router.put('/profile', [
  body('name').optional().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('phoneNo').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits'),
  body('gender').optional().isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Invalid gender'),
  body('dob').optional().isDate().withMessage('Invalid date of birth'),
  handleValidationErrors
], userController.updateProfile);

// Update profile photo
router.put('/profile/photo', 
  userController.constructor.getUploadMiddleware(),
  userController.updateProfilePhoto
);

// Get profile photo by email
router.get('/profile-photo/:email', [
  param('email').isEmail().withMessage('Invalid email format'),
  handleValidationErrors
], userController.getProfilePhoto);

// Change password
router.put('/password', [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  handleValidationErrors
], userController.changePassword);

// Delete user account
router.delete('/account', [
  body('password').notEmpty().withMessage('Password is required for account deletion'),
  handleValidationErrors
], userController.deleteAccount);

module.exports = router;
