const express = require('express');
const { body, param, query } = require('express-validator');
const doctorController = require('../controllers/doctorController');
const { authorize } = require('../middleware/auth');
const router = express.Router();

// Get all doctors (public)
router.get('/', [
  query('specialization').optional().isString(),
  query('rating').optional().isFloat({ min: 0, max: 5 }),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], doctorController.getAllDoctors);

// Get specific doctor details (public)
router.get('/:doctorId', [
  param('doctorId').isInt().withMessage('Doctor ID must be an integer')
], doctorController.getDoctorDetails);

// Get doctor availability
router.get('/:doctorId/availability', [
  param('doctorId').isInt().withMessage('Doctor ID must be an integer'),
  query('date').optional().isDate().withMessage('Invalid date format')
], doctorController.getDoctorAvailability);

// Book appointment with doctor
router.post('/:doctorId/book', [
  param('doctorId').isInt().withMessage('Doctor ID must be an integer'),
  body('scheduledDate').isISO8601().withMessage('Valid date is required'),
  body('meetingType').isIn(['VIDEO_CALL', 'PHONE_CALL', 'IN_PERSON', 'CHAT']).withMessage('Invalid meeting type'),
  body('agenda').optional().isString()
], doctorController.bookAppointment);

// Rate doctor after consultation
router.post('/:doctorId/rate', [
  param('doctorId').isInt().withMessage('Doctor ID must be an integer'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('feedback').optional().isString(),
  body('meetingId').isInt().withMessage('Meeting ID is required')
], doctorController.rateDoctor);

module.exports = router;
