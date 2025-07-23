const express = require('express');
const { body, param, query } = require('express-validator');
const { requireAdmin, authorize } = require('../middleware/auth');
const adminController = require('../controllers/adminController');
const router = express.Router();

// All admin routes require admin access
router.use(requireAdmin);

// Dashboard statistics
router.get('/dashboard', adminController.getDashboard);

// User management
router.get('/users', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  query('sortBy').optional().isIn(['createdAt', 'name', 'email', 'accountStatus']).withMessage('Invalid sort field'),
  query('sortOrder').optional().isIn(['ASC', 'DESC']).withMessage('Sort order must be ASC or DESC')
], adminController.getAllUsers);

router.get('/users/:userId', [
  param('userId').isInt().withMessage('User ID must be an integer')
], adminController.getUserDetails);

router.put('/users/:userId/status', [
  param('userId').isInt().withMessage('User ID must be an integer'),
  body('accountStatus').isIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING']).withMessage('Invalid account status')
], adminController.updateUserStatus);

router.put('/users/:userId/subscription', [
  param('userId').isInt().withMessage('User ID must be an integer'),
  body('subscriptionType').isIn(['FREE', 'PREMIUM', 'TRIAL']).withMessage('Invalid subscription type')
], adminController.updateUserSubscription);

router.delete('/users/:userId', [
  param('userId').isInt().withMessage('User ID must be an integer')
], adminController.deleteUser);

// System statistics
router.get('/stats', [
  query('period').optional().isInt({ min: 1, max: 365 }).withMessage('Period must be between 1 and 365 days')
], adminController.getSystemStats);

module.exports = router;
