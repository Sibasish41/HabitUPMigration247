const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const { User, Doctor } = require('../models');

class SocketHandler {
  constructor() {
    this.io = null;
    this.connectedUsers = new Map(); // userId -> socketId
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3001",
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
        
        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(decoded.userId);
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.userId = user.userId;
        socket.userType = user.userType;
        socket.user = user;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`🔌 User ${socket.userId} connected`);
      
      // Store user connection
      this.connectedUsers.set(socket.userId, socket.id);
      
      // Join user to their personal room
      socket.join(`user_${socket.userId}`);
      
      // Handle joining conversation rooms
      socket.on('join_conversation', (conversationId) => {
        socket.join(`conversation_${conversationId}`);
        console.log(`User ${socket.userId} joined conversation ${conversationId}`);
      });

      // Handle leaving conversation rooms
      socket.on('leave_conversation', (conversationId) => {
        socket.leave(`conversation_${conversationId}`);
        console.log(`User ${socket.userId} left conversation ${conversationId}`);
      });

      // Handle real-time messaging
      socket.on('send_message', async (data) => {
        try {
          const { conversationId, message, receiverId, receiverType } = data;
          
          // Emit to conversation room
          socket.to(`conversation_${conversationId}`).emit('new_message', {
            conversationId,
            senderId: socket.userId,
            senderType: socket.userType,
            message,
            timestamp: new Date(),
            messageId: data.messageId
          });

          // Send notification to receiver if they're online
          const receiverSocketId = this.connectedUsers.get(receiverId);
          if (receiverSocketId) {
            this.io.to(receiverSocketId).emit('message_notification', {
              senderId: socket.userId,
              senderName: socket.user.name,
              conversationId,
              preview: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
              timestamp: new Date()
            });
          }
        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Handle habit completion notifications
      socket.on('habit_completed', (data) => {
        const { habitName, streakCount } = data;
        
        // Emit to user's personal room (for multiple devices)
        this.io.to(`user_${socket.userId}`).emit('habit_completion_celebration', {
          habitName,
          streakCount,
          message: `Great job! You completed "${habitName}"`,
          timestamp: new Date()
        });
      });

      // Handle meeting notifications
      socket.on('meeting_reminder', (data) => {
        const { meetingId, participantIds, message, scheduledTime } = data;
        
        participantIds.forEach(participantId => {
          const participantSocketId = this.connectedUsers.get(participantId);
          if (participantSocketId) {
            this.io.to(participantSocketId).emit('meeting_reminder', {
              meetingId,
              message,
              scheduledTime,
              timestamp: new Date()
            });
          }
        });
      });

      // Handle typing indicators
      socket.on('typing_start', (data) => {
        const { conversationId } = data;
        socket.to(`conversation_${conversationId}`).emit('user_typing', {
          userId: socket.userId,
          userName: socket.user.name,
          conversationId
        });
      });

      socket.on('typing_stop', (data) => {
        const { conversationId } = data;
        socket.to(`conversation_${conversationId}`).emit('user_stopped_typing', {
          userId: socket.userId,
          conversationId
        });
      });

      // Handle online status
      socket.on('update_status', (status) => {
        socket.broadcast.emit('user_status_updated', {
          userId: socket.userId,
          status: status
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`🔌 User ${socket.userId} disconnected`);
        this.connectedUsers.delete(socket.userId);
        
        // Notify others that user went offline
        socket.broadcast.emit('user_offline', {
          userId: socket.userId,
          timestamp: new Date()
        });
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for user ${socket.userId}:`, error);
      });
    });

    console.log('🚀 Socket.IO initialized successfully');
  }

  // Utility methods for sending notifications from controllers
  sendNotificationToUser(userId, notification) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('notification', notification);
      return true;
    }
    return false;
  }

  sendHabitReminder(userId, habits) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('habit_reminder', {
        habits,
        message: `Don't forget your daily habits!`,
        timestamp: new Date()
      });
      return true;
    }
    return false;
  }

  sendStreakCelebration(userId, habitName, streakCount) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit('streak_celebration', {
        habitName,
        streakCount,
        message: `🔥 Amazing! ${streakCount} day streak for "${habitName}"!`,
        timestamp: new Date()
      });
      return true;
    }
    return false;
  }

  sendMeetingNotification(userIds, meetingData) {
    userIds.forEach(userId => {
      const socketId = this.connectedUsers.get(userId);
      if (socketId) {
        this.io.to(socketId).emit('meeting_notification', {
          ...meetingData,
          timestamp: new Date()
        });
      }
    });
  }

  broadcastSystemAnnouncement(announcement) {
    this.io.emit('system_announcement', {
      ...announcement,
      timestamp: new Date()
    });
  }

  getConnectedUsers() {
    return Array.from(this.connectedUsers.keys());
  }

  isUserOnline(userId) {
    return this.connectedUsers.has(userId);
  }

  getOnlineUserCount() {
    return this.connectedUsers.size;
  }
}

// Export singleton instance
const socketHandler = new SocketHandler();
module.exports = socketHandler;
