const express = require('express');
const { body, param, query } = require('express-validator');
const feedbackController = require('../controllers/feedbackController');
const { authorize } = require('../middleware/auth');
const router = express.Router();

// Middleware for feedback permissions
const requireFeedbackAccess = authorize(['MANAGE_FEEDBACK', 'VIEW_FEEDBACK']);

// Submit feedback
router.post('/', [
  body('feedbackType').isIn(['GENERAL', 'BUG_REPORT', 'FEATURE_REQUEST', 'DOCTOR_REVIEW', 'APP_REVIEW']).withMessage('Invalid feedback type'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('targetId').optional().isInt().withMessage('Target ID must be an integer'),
  body('targetType').optional().isIn(['DOCTOR', 'HABIT', 'APP', 'SUPPORT']).withMessage('Invalid target type')
], feedbackController.submitFeedback);

// Get user's feedback history
router.get('/my-feedback', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], feedbackController.getUserFeedback);

// Get all feedback (Admin only)
router.get('/all', [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
  query('status').optional().isIn(['PENDING', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).withMessage('Invalid status'),
  query('feedbackType').optional().isIn(['GENERAL', 'BUG_REPORT', 'FEATURE_REQUEST', 'DOCTOR_REVIEW', 'APP_REVIEW']).withMessage('Invalid feedback type'),
  query('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid priority'),
  requireFeedbackAccess
], feedbackController.getAllFeedback);

// Get specific feedback by ID
router.get('/:feedbackId', [
  param('feedbackId').isInt().withMessage('Feedback ID must be an integer'),
  requireFeedbackAccess
], feedbackController.getFeedbackById);

// Update feedback status (Admin only)
router.put('/:feedbackId', [
  param('feedbackId').isInt().withMessage('Feedback ID must be an integer'),
  body('status').isIn(['PENDING', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).withMessage('Invalid status'),
  body('adminResponse').optional().isString(),
  body('priority').optional().isIn(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).withMessage('Invalid priority'),
  requireFeedbackAccess
], feedbackController.updateFeedbackStatus);

// Get public reviews
router.get('/public/reviews', [
  query('targetType').optional().isIn(['DOCTOR', 'HABIT', 'APP', 'SUPPORT']).withMessage('Invalid target type'),
  query('targetId').optional().isInt().withMessage('Target ID must be an integer'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50')
], feedbackController.getPublicReviews);

// Get feedback statistics (Admin only)
router.get('/admin/stats', requireFeedbackAccess, feedbackController.getFeedbackStats);

module.exports = router;
