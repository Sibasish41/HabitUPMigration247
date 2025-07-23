const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Document = sequelize.define('Document', {
  documentId: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  userId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'user',
      key: 'UserId'
    }
  },
  doctorId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'doctors',
      key: 'doctorId'
    }
  },
  fileName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  originalName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  filePath: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fileSize: {
    type: DataTypes.BIGINT,
    allowNull: false
  },
  mimeType: {
    type: DataTypes.STRING,
    allowNull: false
  },
  documentType: {
    type: DataTypes.ENUM('PROFILE_PHOTO', 'MEDICAL_RECORD', 'PRESCRIPTION', 'VERIFICATION', 'REPORT', 'OTHER'),
    allowNull: false,
    defaultValue: 'OTHER'
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED', 'UNDER_REVIEW'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional file metadata like dimensions, duration, etc.'
  },
  downloadCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewedBy: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Admin ID who reviewed the document'
  },
  reviewedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  reviewComments: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'documents',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['doctorId']
    },
    {
      fields: ['documentType']
    },
    {
      fields: ['status']
    },
    {
      fields: ['isPublic']
    }
  ]
});

// Instance method to check if document is expired
Document.prototype.isExpired = function() {
  return this.expiresAt && new Date() > new Date(this.expiresAt);
};

// Instance method to get file extension
Document.prototype.getFileExtension = function() {
  return this.originalName.split('.').pop().toLowerCase();
};

// Static method to get allowed file types
Document.getAllowedTypes = (documentType) => {
  const allowedTypes = {
    PROFILE_PHOTO: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    MEDICAL_RECORD: ['application/pdf', 'image/jpeg', 'image/png'],
    PRESCRIPTION: ['application/pdf', 'image/jpeg', 'image/png'],
    VERIFICATION: ['application/pdf', 'image/jpeg', 'image/png'],
    REPORT: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    OTHER: ['application/pdf', 'image/jpeg', 'image/png', 'text/plain']
  };
  
  return allowedTypes[documentType] || allowedTypes.OTHER;
};

module.exports = Document;
