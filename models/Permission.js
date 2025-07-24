const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Permission = sequelize.define('Permission', {
  permissionId: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    autoIncrement: true
  },
  permissionType: {
    type: DataTypes.ENUM(
      'MANAGE_USERS',
      'VIEW_USERS',
      'VIEW_PROFILE',
      'RESET_USER_PASSWORDS',
      'MANAGE_SUBSCRIPTIONS',
      'ACTIVATE_USERS',
      '30DAY_USER',
      'ADMIN_ACCESS',
      'DOCTOR_ACCESS',
      'MANAGE_HABITS',
      'VIEW_HABITS',
      'MANAGE_MEETINGS',
      'VIEW_MEETINGS',
      'MANAGE_PAYMENTS',
      'VIEW_PAYMENTS',
      'SEND_MESSAGES',
      'VIEW_MESSAGES',
      'MANAGE_FEEDBACK',
      'VIEW_FEEDBACK'
    ),
    allowNull: false,
    unique: true
  },
  description: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'permissions',
  timestamps: true
});

module.exports = Permission;
