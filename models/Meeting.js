const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Meeting = sequelize.define('Meeting', {
  meetingId: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'user',
      key: 'UserId'
    }
  },
  doctorId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'doctors',
      key: 'doctorId'
    }
  },
  meetingType: {
    type: DataTypes.ENUM('VIDEO_CALL', 'PHONE_CALL', 'IN_PERSON', 'CHAT'),
    allowNull: false,
    defaultValue: 'VIDEO_CALL'
  },
  scheduledDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 30,
    comment: 'Duration in minutes'
  },
  status: {
    type: DataTypes.ENUM('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'),
    allowNull: false,
    defaultValue: 'SCHEDULED'
  },
  meetingUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Video call URL if applicable'
  },
  agenda: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Meeting notes from doctor'
  },
  userNotes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notes from user side'
  },
  prescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  followUpRequired: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  followUpDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  paymentStatus: {
    type: DataTypes.ENUM('PENDING', 'PAID', 'REFUNDED', 'FAILED'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  paymentId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Payment gateway transaction ID'
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancelledBy: {
    type: DataTypes.ENUM('USER', 'DOCTOR', 'ADMIN'),
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  actualStartTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  actualEndTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reminder1Sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  reminder2Sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  createdDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'meetings',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['doctorId']
    },
    {
      fields: ['scheduledDate']
    },
    {
      fields: ['status']
    },
    {
      fields: ['paymentStatus']
    }
  ]
});

module.exports = Meeting;
