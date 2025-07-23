const express = require('express');
const router = express.Router();
const meetingController = require('../controllers/meetingController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Public routes (none for meetings - all require authentication)

// Protected routes - require authentication
router.use(authenticateToken);

// Patient routes
router.get('/my-meetings', meetingController.getMyMeetings);
router.post('/request', meetingController.requestMeeting);
router.put('/:id/cancel', meetingController.cancelMeeting);
router.get('/:id/status', meetingController.getMeetingStatus);

// Doctor routes
router.get('/doctor/meetings', authorizeRoles(['doctor']), meetingController.getDoctorMeetings);
router.put('/:id/accept', authorizeRoles(['doctor']), meetingController.acceptMeeting);
router.put('/:id/reject', authorizeRoles(['doctor']), meetingController.rejectMeeting);
router.put('/:id/reschedule', authorizeRoles(['doctor']), meetingController.rescheduleMeeting);
router.put('/:id/start', authorizeRoles(['doctor']), meetingController.startMeeting);
router.put('/:id/end', authorizeRoles(['doctor']), meetingController.endMeeting);
router.post('/:id/notes', authorizeRoles(['doctor']), meetingController.addMeetingNotes);

// Admin routes
router.get('/all', authorizeRoles(['admin']), meetingController.getAllMeetings);
router.get('/analytics', authorizeRoles(['admin']), meetingController.getMeetingAnalytics);
router.delete('/:id', authorizeRoles(['admin']), meetingController.deleteMeeting);
router.put('/:id/status', authorizeRoles(['admin']), meetingController.updateMeetingStatus);

// Common routes (authenticated users)
router.get('/:id', meetingController.getMeetingById);
router.get('/', meetingController.getMeetings);

module.exports = router;
