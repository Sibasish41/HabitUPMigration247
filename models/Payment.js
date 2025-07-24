const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  paymentId: {
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
  entityId: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'ID of the entity being paid for (meeting, subscription, etc.)'
  },
  entityType: {
    type: DataTypes.ENUM('MEETING', 'SUBSCRIPTION', 'DONATION', 'OTHER'),
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR'
  },
  paymentMethod: {
    type: DataTypes.ENUM('RAZORPAY', 'STRIPE', 'PAYPAL', 'BANK_TRANSFER', 'WALLET'),
    allowNull: false,
    defaultValue: 'RAZORPAY'
  },
  paymentStatus: {
    type: DataTypes.ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED', 'REFUNDED'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  razorpayOrderId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  razorpayPaymentId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  razorpaySignature: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transactionId: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Gateway transaction ID'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional payment data'
  },
  failureReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refundAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  refundReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  refundedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  paidAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  expiresAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'payments',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['paymentStatus']
    },
    {
      fields: ['entityId', 'entityType']
    },
    {
      fields: ['razorpayOrderId']
    },
    {
      fields: ['razorpayPaymentId']
    }
  ]
});

module.exports = Payment;
