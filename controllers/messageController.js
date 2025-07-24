const { Message, User, Doctor } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

class MessageController {
  // Send a message
  async sendMessage(req, res, next) {
    try {
      const { receiverId, receiverType, messageContent, messageType = 'TEXT', priority = 'NORMAL' } = req.body;
      const senderId = req.user.userId;
      const senderType = req.user.userType || 'USER';

      // Validate receiver exists
      let receiver;
      if (receiverType === 'DOCTOR') {
        receiver = await Doctor.findByPk(receiverId);
      } else if (receiverType === 'USER') {
        receiver = await User.findByPk(receiverId);
      }

      if (!receiver) {
        return next(new ApiError('Receiver not found', 404));
      }

      // Generate conversation ID
      const conversationId = Message.generateConversationId(
        senderId, senderType, receiverId, receiverType
      );

      const message = await Message.create({
        senderId,
        senderType,
        receiverId,
        receiverType,
        messageContent,
        messageType,
        conversationId,
        priority
      });

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: message
      });
    } catch (error) {
      next(error);
    }
  }

  // Get messages for a conversation
  async getConversation(req, res, next) {
    try {
      const { participantId, participantType } = req.params;
      const { page = 1, limit = 50 } = req.query;
      
      const userId = req.user.userId;
      const userType = req.user.userType || 'USER';

      const conversationId = Message.generateConversationId(
        userId, userType, participantId, participantType
      );

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const messages = await Message.findAll({
        where: {
          conversationId,
          isDeleted: false
        },
        order: [['sentAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      // Mark messages as read
      await Message.update(
        { isRead: true, readAt: new Date() },
        {
          where: {
            conversationId,
            receiverId: userId,
            receiverType: userType,
            isRead: false
          }
        }
      );

      res.json({
        success: true,
        data: {
          messages: messages.reverse(), // Reverse to show oldest first
          conversationId
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all conversations for a user
  async getConversations(req, res, next) {
    try {
      const userId = req.user.userId;
      const userType = req.user.userType || 'USER';

      const conversations = await Message.findAll({
        where: {
          [Op.or]: [
            { senderId: userId, senderType: userType },
            { receiverId: userId, receiverType: userType }
          ],
          isDeleted: false
        },
        attributes: [
          'conversationId',
          'senderId',
          'senderType',
          'receiverId',
          'receiverType',
          'messageContent',
          'sentAt',
          'isRead'
        ],
        order: [['sentAt', 'DESC']],
        group: ['conversationId']
      });

      // Get participant details for each conversation
      const conversationList = await Promise.all(
        conversations.map(async (msg) => {
          let participant;
          const isUserSender = msg.senderId === userId && msg.senderType === userType;
          
          const participantId = isUserSender ? msg.receiverId : msg.senderId;
          const participantType = isUserSender ? msg.receiverType : msg.senderType;

          if (participantType === 'DOCTOR') {
            participant = await Doctor.findByPk(participantId, {
              attributes: ['doctorId', 'name', 'specialization', 'profilePhoto']
            });
          } else if (participantType === 'USER') {
            participant = await User.findByPk(participantId, {
              attributes: ['userId', 'name', 'profilePhoto']
            });
          }

          return {
            conversationId: msg.conversationId,
            participant,
            participantType,
            lastMessage: msg.messageContent,
            lastMessageTime: msg.sentAt,
            isRead: msg.isRead
          };
        })
      );

      res.json({
        success: true,
        data: conversationList
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a message
  async deleteMessage(req, res, next) {
    try {
      const { messageId } = req.params;
      const userId = req.user.userId;
      const userType = req.user.userType || 'USER';

      const message = await Message.findByPk(messageId);

      if (!message) {
        return next(new ApiError('Message not found', 404));
      }

      // Check if user is sender
      if (message.senderId !== userId || message.senderType !== userType) {
        return next(new ApiError('Unauthorized to delete this message', 403));
      }

      await message.update({
        isDeleted: true,
        deletedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get unread message count
  async getUnreadCount(req, res, next) {
    try {
      const userId = req.user.userId;
      const userType = req.user.userType || 'USER';

      const unreadCount = await Message.count({
        where: {
          receiverId: userId,
          receiverType: userType,
          isRead: false,
          isDeleted: false
        }
      });

      res.json({
        success: true,
        data: { unreadCount }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MessageController();
