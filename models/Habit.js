const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Habit = sequelize.define('Habit', {
  habitId: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  habitName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  habitDescription: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  habitCategory: {
    type: DataTypes.ENUM(
      'HEALTH_FITNESS',
      'PRODUCTIVITY', 
      'MINDFULNESS',
      'LEARNING',
      'SOCIAL',
      'PERSONAL_CARE',
      'CREATIVITY',
      'OTHER'
    ),
    allowNull: false,
    defaultValue: 'OTHER'
  },
  targetDays: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 21
  },
  currentStreak: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  longestStreak: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  reminderTime: {
    type: DataTypes.TIME,
    allowNull: true
  },
  reminderEnabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  difficulty: {
    type: DataTypes.ENUM('EASY', 'MEDIUM', 'HARD'),
    allowNull: false,
    defaultValue: 'MEDIUM'
  },
  createdDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'habits',
  timestamps: true
});

module.exports = Habit;
