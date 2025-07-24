const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const PasswordResetToken = sequelize.define('PasswordResetToken', {
  id: {
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
  token: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: false
  },
  isUsed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  usedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'password_reset_tokens',
  timestamps: true,
  indexes: [
    {
      fields: ['token']
    },
    {
      fields: ['userId']
    },
    {
      fields: ['expiresAt']
    }
  ]
});

// Static method to generate token
PasswordResetToken.generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Instance method to check if token is valid
PasswordResetToken.prototype.isValid = function() {
  return !this.isUsed && new Date() < new Date(this.expiresAt);
};

module.exports = PasswordResetToken;
