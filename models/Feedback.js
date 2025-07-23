const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Feedback = sequelize.define('Feedback', {
  feedbackId: {
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
  feedbackType: {
    type: DataTypes.ENUM('GENERAL', 'BUG_REPORT', 'FEATURE_REQUEST', 'DOCTOR_REVIEW', 'APP_REVIEW'),
    allowNull: false,
    defaultValue: 'GENERAL'
  },
  targetId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'ID of the target entity (doctor, habit, etc.) if applicable'
  },
  targetType: {
    type: DataTypes.ENUM('DOCTOR', 'HABIT', 'APP', 'SUPPORT'),
    allowNull: true
  },
  subject: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'REVIEWED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  priority: {
    type: DataTypes.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
    allowNull: false,
    defaultValue: 'MEDIUM'
  },
  adminResponse: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  adminId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Admin who responded to the feedback'
  },
  responseDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of attachment URLs'
  },
  isAnonymous: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the review can be displayed publicly'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of tags for categorization'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional metadata like device info, app version, etc.'
  },
  submittedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'feedback',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['feedbackType']
    },
    {
      fields: ['status']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['targetId', 'targetType']
    }
  ]
});

module.exports = Feedback;
