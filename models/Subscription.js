const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Subscription = sequelize.define('Subscription', {
  subscriptionId: {
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
  planType: {
    type: DataTypes.ENUM('FREE', 'BASIC', 'PREMIUM', 'ENTERPRISE'),
    allowNull: false,
    defaultValue: 'FREE'
  },
  billingCycle: {
    type: DataTypes.ENUM('MONTHLY', 'QUARTERLY', 'YEARLY', 'LIFETIME'),
    allowNull: false,
    defaultValue: 'MONTHLY'
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE', 'CANCELLED', 'EXPIRED', 'PENDING'),
    allowNull: false,
    defaultValue: 'PENDING'
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  nextBillingDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0.00
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'INR'
  },
  razorpaySubscriptionId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  razorpayPlanId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  autoRenewal: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  features: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'JSON object containing subscription features'
  },
  discountCode: {
    type: DataTypes.STRING,
    allowNull: true
  },
  discountAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  originalAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  cancellationReason: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  cancelledAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  renewalCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  trialEndsAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isTrialUsed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true
  }
}, {
  tableName: 'subscriptions',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['planType']
    },
    {
      fields: ['nextBillingDate']
    },
    {
      fields: ['razorpaySubscriptionId']
    }
  ]
});

// Static method to get subscription features
Subscription.getFeatures = (planType) => {
  const features = {
    FREE: {
      maxHabits: 3,
      basicTracking: true,
      emailReminders: false,
      doctorConsultations: 0,
      advancedAnalytics: false,
      customReminders: false,
      exportData: false,
      prioritySupport: false
    },
    BASIC: {
      maxHabits: 10,
      basicTracking: true,
      emailReminders: true,
      doctorConsultations: 1,
      advancedAnalytics: false,
      customReminders: true,
      exportData: false,
      prioritySupport: false
    },
    PREMIUM: {
      maxHabits: 50,
      basicTracking: true,
      emailReminders: true,
      doctorConsultations: 5,
      advancedAnalytics: true,
      customReminders: true,
      exportData: true,
      prioritySupport: true
    },
    ENTERPRISE: {
      maxHabits: -1, // Unlimited
      basicTracking: true,
      emailReminders: true,
      doctorConsultations: -1, // Unlimited
      advancedAnalytics: true,
      customReminders: true,
      exportData: true,
      prioritySupport: true
    }
  };
  
  return features[planType] || features.FREE;
};

// Instance method to check if subscription is active
Subscription.prototype.isActive = function() {
  return this.status === 'ACTIVE' && 
         (!this.endDate || new Date() < new Date(this.endDate));
};

// Instance method to check feature access
Subscription.prototype.hasFeature = function(feature) {
  const features = Subscription.getFeatures(this.planType);
  return features[feature] === true || features[feature] > 0;
};

module.exports = Subscription;
