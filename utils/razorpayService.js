// Alias for paymentService to maintain compatibility
const paymentService = require('./paymentService');

// Additional Razorpay-specific subscription methods
const createSubscription = async (subscriptionData) => {
  // For now, return a mock subscription until full Razorpay integration
  return {
    id: `sub_${Date.now()}`,
    plan_id: subscriptionData.planType,
    customer_id: subscriptionData.customerId,
    status: 'active',
    created_at: Math.floor(Date.now() / 1000)
  };
};

const cancelSubscription = async (subscriptionId) => {
  // Mock cancellation - implement actual Razorpay API call
  return {
    id: subscriptionId,
    status: 'cancelled',
    cancelled_at: Math.floor(Date.now() / 1000)
  };
};

const getSubscription = async (subscriptionId) => {
  // Mock get subscription - implement actual Razorpay API call
  return {
    id: subscriptionId,
    status: 'active'
  };
};

module.exports = {
  ...paymentService,
  createSubscription,
  cancelSubscription,
  getSubscription
};
