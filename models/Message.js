const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Message = sequelize.define('Message', {
  messageId: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  senderId: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  senderType: {
    type: DataTypes.ENUM('USER', 'DOCTOR', 'ADMIN'),
    allowNull: false
  },
  receiverId: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  receiverType: {
    type: DataTypes.ENUM('USER', 'DOCTOR', 'ADMIN'),
    allowNull: false
  },
  messageContent: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  messageType: {
    type: DataTypes.ENUM('TEXT', 'IMAGE', 'DOCUMENT', 'AUDIO'),
    allowNull: false,
    defaultValue: 'TEXT'
  },
  attachmentUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  isRead: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  conversationId: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Generated conversation ID for grouping messages'
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT'),
    allowNull: false,
    defaultValue: 'NORMAL'
  },
  sentAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'messages',
  timestamps: true,
  indexes: [
    {
      fields: ['conversationId']
    },
    {
      fields: ['senderId', 'senderType']
    },
    {
      fields: ['receiverId', 'receiverType']
    },
    {
      fields: ['isRead']
    }
  ]
});

// Static method to generate conversation ID
Message.generateConversationId = (user1Id, user1Type, user2Id, user2Type) => {
  const participants = [
    { id: user1Id, type: user1Type },
    { id: user2Id, type: user2Type }
  ].sort((a, b) => {
    if (a.type !== b.type) {
      return a.type.localeCompare(b.type);
    }
    return a.id - b.id;
  });
  
  return `${participants[0].type}_${participants[0].id}_${participants[1].type}_${participants[1].id}`;
};

module.exports = Message;
