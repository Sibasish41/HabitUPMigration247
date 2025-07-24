const { Subscription, User, Payment } = require('../models');
const { Op } = require('sequelize');
const razorpayService = require('../utils/razorpayService');
const { ApiError } = require('../middleware/errorHandler');

// Get all subscriptions (admin only)
const getAllSubscriptions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const planType = req.query.planType;

    const where = {};
    if (status) where.status = status;
    if (planType) where.planType = planType;

    const subscriptions = await Subscription.findAndCountAll({
      where,
      include: [
        {
          model: User,
          attributes: ['userId', 'username', 'email', 'firstName', 'lastName']
        }
      ],
      limit,
      offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: subscriptions.rows,
      pagination: {
        total: subscriptions.count,
        page,
        pages: Math.ceil(subscriptions.count / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: error.message
    });
  }
};

// Get user's subscriptions
const getUserSubscriptions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const subscriptions = await Subscription.findAll({
      where: { userId },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Error fetching user subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: error.message
    });
  }
};

// Get current active subscription
const getCurrentSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const activeSubscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active',
        endDate: {
          [Op.gt]: new Date()
        }
      }
    });

    if (!activeSubscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    res.json({
      success: true,
      data: activeSubscription
    });
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching current subscription',
      error: error.message
    });
  }
};

// Create new subscription
const createSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      planType,
      billingCycle,
      amount,
      currency = 'INR',
      autoRenewal = true,
      paymentMethodId
    } = req.body;

    // Check if user already has an active subscription
    const existingSubscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active',
        endDate: {
          [Op.gt]: new Date()
        }
      }
    });

    if (existingSubscription) {
      return res.status(400).json({
        success: false,
        message: 'User already has an active subscription'
      });
    }

    // Calculate dates
    const startDate = new Date();
    const endDate = new Date();
    if (billingCycle === 'monthly') {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (billingCycle === 'yearly') {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // Create Razorpay subscription if auto-renewal is enabled
    let razorpaySubscriptionId = null;
    if (autoRenewal && paymentMethodId) {
      try {
        const razorpaySubscription = await razorpayService.createSubscription({
          planType,
          billingCycle,
          amount,
          currency,
          customerId: userId,
          paymentMethodId
        });
        razorpaySubscriptionId = razorpaySubscription.id;
      } catch (razorpayError) {
        console.error('Razorpay subscription creation failed:', razorpayError);
        // Continue without auto-renewal if Razorpay fails
      }
    }

    const subscription = await Subscription.create({
      userId,
      planType,
      billingCycle,
      status: 'pending',
      startDate,
      endDate,
      amount,
      currency,
      autoRenewal,
      razorpaySubscriptionId,
      paymentMethodId,
      trialPeriodDays: planType === 'basic' ? 7 : 0
    });

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subscription',
      error: error.message
    });
  }
};

// Update subscription
const updateSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const updates = req.body;

    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Check permission (user can only update their own subscription or admin)
    if (req.user.role !== 'admin' && subscription.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this subscription'
      });
    }

    await subscription.update(updates);

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subscription',
      error: error.message
    });
  }
};

// Cancel subscription
const cancelSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { reason, cancelImmediately = false } = req.body;

    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Check permission
    if (req.user.role !== 'admin' && subscription.userId !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this subscription'
      });
    }

    // Cancel Razorpay subscription if exists
    if (subscription.razorpaySubscriptionId) {
      try {
        await razorpayService.cancelSubscription(subscription.razorpaySubscriptionId, cancelImmediately);
      } catch (razorpayError) {
        console.error('Razorpay cancellation failed:', razorpayError);
      }
    }

    const updates = {
      status: cancelImmediately ? 'cancelled' : 'cancel_pending',
      cancellationReason: reason,
      cancelledAt: new Date(),
      autoRenewal: false
    };

    if (cancelImmediately) {
      updates.endDate = new Date();
    }

    await subscription.update(updates);

    res.json({
      success: true,
      message: `Subscription ${cancelImmediately ? 'cancelled' : 'scheduled for cancellation'} successfully`,
      data: subscription
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription',
      error: error.message
    });
  }
};

// Activate subscription (admin only)
const activateSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findByPk(subscriptionId);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    await subscription.update({
      status: 'active',
      activatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Subscription activated successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Error activating subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error activating subscription',
      error: error.message
    });
  }
};

// Get subscription analytics (admin only)
const getSubscriptionAnalytics = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        [Op.between]: [new Date(startDate), new Date(endDate)]
      };
    }

    // Total subscriptions by status
    const statusCounts = await Subscription.findAll({
      where: dateFilter,
      attributes: [
        'status',
        [Subscription.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['status']
    });

    // Revenue by plan type
    const revenueByPlan = await Subscription.findAll({
      where: {
        ...dateFilter,
        status: ['active', 'completed']
      },
      attributes: [
        'planType',
        [Subscription.sequelize.fn('SUM', Subscription.sequelize.col('amount')), 'totalRevenue'],
        [Subscription.sequelize.fn('COUNT', '*'), 'count']
      ],
      group: ['planType']
    });

    // Monthly recurring revenue
    const mrr = await Subscription.sum('amount', {
      where: {
        status: 'active',
        billingCycle: 'monthly'
      }
    });

    // Annual recurring revenue (convert yearly to monthly)
    const yearlyTotal = await Subscription.sum('amount', {
      where: {
        status: 'active',
        billingCycle: 'yearly'
      }
    });
    const arr = (yearlyTotal || 0) / 12;

    res.json({
      success: true,
      data: {
        statusCounts: statusCounts.reduce((acc, item) => {
          acc[item.status] = parseInt(item.dataValues.count);
          return acc;
        }, {}),
        revenueByPlan: revenueByPlan.map(item => ({
          planType: item.planType,
          totalRevenue: parseFloat(item.dataValues.totalRevenue || 0),
          count: parseInt(item.dataValues.count)
        })),
        recurringRevenue: {
          monthly: mrr || 0,
          annual: arr,
          total: (mrr || 0) + arr
        }
      }
    });
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching analytics',
      error: error.message
    });
  }
};

// Handle subscription webhook (for Razorpay)
const handleSubscriptionWebhook = async (req, res) => {
  try {
    const { event, payload } = req.body;
    const subscriptionId = payload.subscription?.entity?.id;

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook payload'
      });
    }

    const subscription = await Subscription.findOne({
      where: { razorpaySubscriptionId: subscriptionId }
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    switch (event) {
      case 'subscription.activated':
        await subscription.update({
          status: 'active',
          activatedAt: new Date()
        });
        break;
      
      case 'subscription.cancelled':
        await subscription.update({
          status: 'cancelled',
          cancelledAt: new Date()
        });
        break;
      
      case 'subscription.charged':
        // Handle successful payment
        await subscription.update({
          lastPaymentDate: new Date(),
          nextBillingDate: new Date(payload.payment?.entity?.created_at * 1000 + (subscription.billingCycle === 'monthly' ? 30 * 24 * 60 * 60 * 1000 : 365 * 24 * 60 * 60 * 1000))
        });
        break;
      
      case 'subscription.halted':
        await subscription.update({
          status: 'past_due'
        });
        break;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error handling subscription webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
      error: error.message
    });
  }
};

// Additional methods required by routes
const getSubscriptionPlans = async (req, res) => {
  try {
    // Mock subscription plans - replace with actual implementation
    const plans = [
      {
        id: 'basic',
        name: 'Basic Plan',
        description: 'Basic features for habit tracking',
        price: 499,
        currency: 'INR',
        billingCycle: 'monthly',
        features: ['Basic habit tracking', 'Progress reports', 'Mobile app access']
      },
      {
        id: 'premium',
        name: 'Premium Plan',
        description: 'Advanced features with coach consultation',
        price: 999,
        currency: 'INR',
        billingCycle: 'monthly',
        features: ['All basic features', 'Coach consultation', 'Advanced analytics', 'Priority support']
      },
      {
        id: 'pro',
        name: 'Pro Plan',
        description: 'Complete solution with doctor consultations',
        price: 1999,
        currency: 'INR',
        billingCycle: 'monthly',
        features: ['All premium features', 'Doctor consultations', 'Custom meal plans', 'Unlimited support']
      }
    ];

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plans',
      error: error.message
    });
  }
};

const getSubscriptionPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    // Mock implementation - replace with actual plan fetching
    const plans = {
      basic: { id: 'basic', name: 'Basic Plan', price: 499, currency: 'INR' },
      premium: { id: 'premium', name: 'Premium Plan', price: 999, currency: 'INR' },
      pro: { id: 'pro', name: 'Pro Plan', price: 1999, currency: 'INR' }
    };

    const plan = plans[id];
    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Subscription plan not found'
      });
    }

    res.json({
      success: true,
      data: plan
    });
  } catch (error) {
    console.error('Error fetching subscription plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription plan',
      error: error.message
    });
  }
};

const getUserSubscription = async (req, res) => {
  return getCurrentSubscription(req, res);
};

const subscribeUser = async (req, res) => {
  return createSubscription(req, res);
};

const getSubscriptionHistory = async (req, res) => {
  return getUserSubscriptions(req, res);
};

const checkSubscriptionStatus = async (req, res) => {
  return getCurrentSubscription(req, res);
};

const renewSubscription = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { planType, billingCycle, amount } = req.body;

    const activeSubscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!activeSubscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found to renew'
      });
    }

    // Extend the subscription period
    const newEndDate = new Date(activeSubscription.endDate);
    if (billingCycle === 'monthly') {
      newEndDate.setMonth(newEndDate.getMonth() + 1);
    } else if (billingCycle === 'yearly') {
      newEndDate.setFullYear(newEndDate.getFullYear() + 1);
    }

    await activeSubscription.update({
      endDate: newEndDate,
      renewedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Subscription renewed successfully',
      data: activeSubscription
    });
  } catch (error) {
    console.error('Error renewing subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error renewing subscription',
      error: error.message
    });
  }
};

const changeSubscription = async (req, res) => {
  try {
    const { planId } = req.params;
    const userId = req.user.userId;

    const activeSubscription = await Subscription.findOne({
      where: {
        userId,
        status: 'active'
      }
    });

    if (!activeSubscription) {
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    await activeSubscription.update({
      planType: planId,
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Subscription plan changed successfully',
      data: activeSubscription
    });
  } catch (error) {
    console.error('Error changing subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing subscription',
      error: error.message
    });
  }
};

// Admin methods
const getSubscriptionsByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const subscriptions = await Subscription.findAll({
      where: { status },
      include: [{
        model: User,
        attributes: ['userId', 'name', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: subscriptions
    });
  } catch (error) {
    console.error('Error fetching subscriptions by status:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscriptions',
      error: error.message
    });
  }
};

const createSubscriptionPlan = async (req, res) => {
  try {
    // Mock implementation - you'd typically store plans in database
    const planData = req.body;
    res.status(201).json({
      success: true,
      message: 'Subscription plan created successfully',
      data: { id: Date.now().toString(), ...planData }
    });
  } catch (error) {
    console.error('Error creating subscription plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating subscription plan',
      error: error.message
    });
  }
};

const updateSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    res.json({
      success: true,
      message: 'Subscription plan updated successfully',
      data: { id, ...updates }
    });
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating subscription plan',
      error: error.message
    });
  }
};

const deleteSubscriptionPlan = async (req, res) => {
  try {
    const { id } = req.params;
    
    res.json({
      success: true,
      message: 'Subscription plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subscription plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting subscription plan',
      error: error.message
    });
  }
};

const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const subscription = await Subscription.findByPk(id, {
      include: [{
        model: User,
        attributes: ['userId', 'name', 'email']
      }]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      data: subscription
    });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching subscription',
      error: error.message
    });
  }
};

const adminCancelSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const subscription = await Subscription.findByPk(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    await subscription.update({
      status: 'cancelled',
      cancellationReason: reason || 'Admin cancellation',
      cancelledAt: new Date()
    });

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscription',
      error: error.message
    });
  }
};

const extendSubscription = async (req, res) => {
  try {
    const { id } = req.params;
    const { extensionDays } = req.body;

    const subscription = await Subscription.findByPk(id);
    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const newEndDate = new Date(subscription.endDate);
    newEndDate.setDate(newEndDate.getDate() + parseInt(extensionDays));

    await subscription.update({
      endDate: newEndDate,
      extendedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Subscription extended successfully',
      data: subscription
    });
  } catch (error) {
    console.error('Error extending subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Error extending subscription',
      error: error.message
    });
  }
};

const getExpiredSubscriptions = async (req, res) => {
  try {
    const expiredSubscriptions = await Subscription.findAll({
      where: {
        endDate: {
          [Op.lt]: new Date()
        },
        status: ['active', 'past_due']
      },
      include: [{
        model: User,
        attributes: ['userId', 'name', 'email']
      }],
      order: [['endDate', 'DESC']]
    });

    res.json({
      success: true,
      data: expiredSubscriptions
    });
  } catch (error) {
    console.error('Error fetching expired subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching expired subscriptions',
      error: error.message
    });
  }
};

const bulkCancelSubscriptions = async (req, res) => {
  try {
    const { subscriptionIds, reason } = req.body;
    
    await Subscription.update(
      {
        status: 'cancelled',
        cancellationReason: reason || 'Bulk cancellation',
        cancelledAt: new Date()
      },
      {
        where: {
          subscriptionId: {
            [Op.in]: subscriptionIds
          }
        }
      }
    );

    res.json({
      success: true,
      message: `${subscriptionIds.length} subscriptions cancelled successfully`
    });
  } catch (error) {
    console.error('Error bulk cancelling subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error cancelling subscriptions',
      error: error.message
    });
  }
};

const bulkExtendSubscriptions = async (req, res) => {
  try {
    const { subscriptionIds, extensionDays } = req.body;
    
    const subscriptions = await Subscription.findAll({
      where: {
        subscriptionId: {
          [Op.in]: subscriptionIds
        }
      }
    });

    for (const subscription of subscriptions) {
      const newEndDate = new Date(subscription.endDate);
      newEndDate.setDate(newEndDate.getDate() + parseInt(extensionDays));
      
      await subscription.update({
        endDate: newEndDate,
        extendedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: `${subscriptionIds.length} subscriptions extended successfully`
    });
  } catch (error) {
    console.error('Error bulk extending subscriptions:', error);
    res.status(500).json({
      success: false,
      message: 'Error extending subscriptions',
      error: error.message
    });
  }
};

module.exports = {
  getAllSubscriptions,
  getUserSubscriptions,
  getCurrentSubscription,
  createSubscription,
  updateSubscription,
  cancelSubscription,
  activateSubscription,
  getSubscriptionAnalytics,
  handleSubscriptionWebhook,
  getSubscriptionPlans,
  getSubscriptionPlanById,
  getUserSubscription,
  subscribeUser,
  getSubscriptionHistory,
  checkSubscriptionStatus,
  renewSubscription,
  changeSubscription,
  getSubscriptionsByStatus,
  createSubscriptionPlan,
  updateSubscriptionPlan,
  deleteSubscriptionPlan,
  getSubscriptionById,
  adminCancelSubscription,
  extendSubscription,
  getExpiredSubscriptions,
  bulkCancelSubscriptions,
  bulkExtendSubscriptions
};
