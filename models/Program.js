const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Program = sequelize.define('Program', {
  programId: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  category: {
    type: DataTypes.ENUM('HEALTH_FITNESS', 'PRODUCTIVITY', 'MINDFULNESS', 'LEARNING', 'SOCIAL', 'PERSONAL_CARE', 'CREATIVITY'),
    allowNull: false
  },
  difficulty: {
    type: DataTypes.ENUM('BEGINNER', 'INTERMEDIATE', 'ADVANCED'),
    allowNull: false,
    defaultValue: 'BEGINNER'
  },
  duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Duration in days'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  isPremium: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  maxParticipants: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Maximum number of participants, null for unlimited'
  },
  currentParticipants: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Program start date, null for self-paced'
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  objectives: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of program objectives'
  },
  milestones: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of program milestones'
  },
  resources: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array of resources (links, documents, etc.)'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true
  },
  instructorId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    references: {
      model: 'doctors',
      key: 'doctorId'
    }
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    defaultValue: 0.00,
    validate: {
      min: 0,
      max: 5
    }
  },
  totalRatings: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  completionRate: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0.00,
    comment: 'Percentage of participants who completed the program'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR'
  }
}, {
  tableName: 'programs',
  timestamps: true,
  indexes: [
    {
      fields: ['category']
    },
    {
      fields: ['difficulty']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['isPremium']
    },
    {
      fields: ['instructorId']
    },
    {
      fields: ['startDate']
    }
  ]
});

// Instance method to check if program is available for enrollment
Program.prototype.isAvailableForEnrollment = function() {
  if (!this.isActive) return false;
  if (this.maxParticipants && this.currentParticipants >= this.maxParticipants) return false;
  if (this.startDate && new Date() > new Date(this.startDate)) return false;
  return true;
};

// Instance method to update rating
Program.prototype.updateRating = async function(newRating) {
  const currentTotal = this.rating * this.totalRatings;
  const newTotal = currentTotal + newRating;
  const newCount = this.totalRatings + 1;
  
  await this.update({
    rating: (newTotal / newCount).toFixed(2),
    totalRatings: newCount
  });
};

module.exports = Program;
