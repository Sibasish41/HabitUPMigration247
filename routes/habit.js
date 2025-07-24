const express = require('express');
const { body, param, query } = require('express-validator');
const habitController = require('../controllers/habitController');
const { authorize } = require('../middleware/auth');
const router = express.Router();

// Middleware for habit management permissions
const requireHabitAccess = authorize(['MANAGE_HABITS', 'VIEW_HABITS']);

// Get all habits for user
router.get('/', requireHabitAccess, habitController.getUserHabits);

// Get specific habit by ID
router.get('/:habitId', [
  param('habitId').isInt().withMessage('Habit ID must be an integer'),
  requireHabitAccess
], habitController.getHabitById);

// Get habit progress/statistics
router.get('/:habitId/progress', [
  param('habitId').isInt().withMessage('Habit ID must be an integer'),
  query('days').optional().isInt({ min: 1, max: 365 }).withMessage('Days must be between 1 and 365'),
  requireHabitAccess
], habitController.getHabitProgress);

// Get habit analytics and insights
router.get('/:habitId/analytics', [
  param('habitId').isInt().withMessage('Habit ID must be an integer'),
  query('timeRange').optional().isInt({ min: 7, max: 365 }).withMessage('Time range must be between 7 and 365 days'),
  requireHabitAccess
], habitController.getHabitAnalytics);

// Get habit suggestions for user
router.get('/suggestions/for-me', requireHabitAccess, habitController.getHabitSuggestions);

// Create new habit
router.post('/', [
  body('habitName').notEmpty().withMessage('Habit name is required'),
  body('habitCategory').optional().isIn([
    'HEALTH_FITNESS', 'PRODUCTIVITY', 'MINDFULNESS', 'LEARNING', 
    'SOCIAL', 'PERSONAL_CARE', 'CREATIVITY', 'OTHER'
  ]).withMessage('Invalid habit category'),
  body('targetDays').optional().isInt({ min: 1, max: 365 }).withMessage('Target days must be between 1 and 365'),
  body('difficulty').optional().isIn(['EASY', 'MEDIUM', 'HARD']).withMessage('Invalid difficulty level'),
  requireHabitAccess
], habitController.createHabit);

// Update habit
router.put('/:habitId', [
  param('habitId').isInt().withMessage('Habit ID must be an integer'),
  body('habitName').optional().notEmpty().withMessage('Habit name cannot be empty'),
  body('habitCategory').optional().isIn([
    'HEALTH_FITNESS', 'PRODUCTIVITY', 'MINDFULNESS', 'LEARNING', 
    'SOCIAL', 'PERSONAL_CARE', 'CREATIVITY', 'OTHER'
  ]).withMessage('Invalid habit category'),
  body('difficulty').optional().isIn(['EASY', 'MEDIUM', 'HARD']).withMessage('Invalid difficulty level'),
  requireHabitAccess
], habitController.updateHabit);

// Delete habit
router.delete('/:habitId', [
  param('habitId').isInt().withMessage('Habit ID must be an integer'),
  requireHabitAccess
], habitController.deleteHabit);

// Mark habit as completed
router.post('/:habitId/complete', [
  param('habitId').isInt().withMessage('Habit ID must be an integer'),
  body('mood').optional().isIn(['EXCELLENT', 'GOOD', 'NEUTRAL', 'BAD', 'TERRIBLE']).withMessage('Invalid mood'),
  body('effortLevel').optional().isInt({ min: 1, max: 10 }).withMessage('Effort level must be between 1 and 10'),
  requireHabitAccess
], habitController.markHabitComplete);

module.exports = router;
