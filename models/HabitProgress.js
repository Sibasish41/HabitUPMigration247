const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const HabitProgress = sequelize.define('HabitProgress', {
  progressId: {
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
  habitId: {
    type: DataTypes.BIGINT,
    allowNull: false,
    references: {
      model: 'habits',
      key: 'habitId'
    }
  },
  completionDate: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  completionStatus: {
    type: DataTypes.ENUM('COMPLETED', 'PARTIAL', 'MISSED', 'SKIPPED'),
    allowNull: false,
    defaultValue: 'MISSED'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  completionTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  mood: {
    type: DataTypes.ENUM('EXCELLENT', 'GOOD', 'NEUTRAL', 'BAD', 'TERRIBLE'),
    allowNull: true
  },
  effortLevel: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 10
    }
  }
}, {
  tableName: 'habit_progress',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['userId', 'habitId', 'completionDate']
    }
  ]
});

module.exports = HabitProgress;
