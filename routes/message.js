const express = require('express');
const { body, param, query } = require('express-validator');
const messageController = require('../controllers/messageController');
const { authorize } = require('../middleware/auth');
const router = express.Router();

// Middleware for message permissions
const requireMessageAccess = authorize(['SEND_MESSAGES', 'VIEW_MESSAGES']);

// Send a message
router.post('/', [
  body('receiverId').isInt().withMessage('Receiver ID must be an integer'),
  body('receiverType').isIn(['USER', 'DOCTOR', 'ADMIN']).withMessage('Invalid receiver type'),
  body('messageContent').notEmpty().withMessage('Message content is required'),
  body('messageType').optional().isIn(['TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO']).withMessage('Invalid message type'),
  body('priority').optional().isIn(['LOW', 'NORMAL', 'HIGH', 'URGENT']).withMessage('Invalid priority'),
  requireMessageAccess
], messageController.sendMessage);

// Get all conversations
router.get('/conversations', requireMessageAccess, messageController.getConversations);

// Get conversation with specific participant
router.get('/conversation/:participantType/:participantId', [
  param('participantId').isInt().withMessage('Participant ID must be an integer'),
  param('participantType').isIn(['USER', 'DOCTOR', 'ADMIN']).withMessage('Invalid participant type'),
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  requireMessageAccess
], messageController.getConversation);

// Delete a message
router.delete('/:messageId', [
  param('messageId').isInt().withMessage('Message ID must be an integer'),
  requireMessageAccess
], messageController.deleteMessage);

// Get unread message count
router.get('/unread-count', requireMessageAccess, messageController.getUnreadCount);

module.exports = router;
