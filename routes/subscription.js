const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionController');
const { authenticateToken } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { validateSubscription, validateSubscriptionUpdate } = require('../middleware/validation');

// Public routes
router.get('/plans', subscriptionController.getSubscriptionPlans);
router.get('/plans/:id', subscriptionController.getSubscriptionPlanById);

// User routes (require authentication)
router.use(authenticateToken);

// Get user's current subscription
router.get('/current', subscriptionController.getUserSubscription);

// Subscribe to a plan
router.post('/subscribe/:planId', subscriptionController.subscribeUser);

// Update subscription
router.put('/update/:planId', subscriptionController.updateSubscription);

// Cancel subscription
router.delete('/cancel', subscriptionController.cancelSubscription);

// Get subscription history
router.get('/history', subscriptionController.getSubscriptionHistory);

// Check subscription status
router.get('/status', subscriptionController.checkSubscriptionStatus);

// Renew subscription
router.post('/renew', subscriptionController.renewSubscription);

// Downgrade/Upgrade subscription
router.put('/change/:planId', subscriptionController.changeSubscription);

// Admin routes (require admin authentication)
router.use(adminMiddleware);

// Get all subscriptions (admin)
router.get('/admin/all', subscriptionController.getAllSubscriptions);

// Get subscriptions by status (admin)
router.get('/admin/status/:status', subscriptionController.getSubscriptionsByStatus);

// Get subscription analytics (admin)
router.get('/admin/analytics', subscriptionController.getSubscriptionAnalytics);

// Create subscription plan (admin)
router.post('/admin/plans', validateSubscription, subscriptionController.createSubscriptionPlan);

// Update subscription plan (admin)
router.put('/admin/plans/:id', validateSubscriptionUpdate, subscriptionController.updateSubscriptionPlan);

// Delete subscription plan (admin)
router.delete('/admin/plans/:id', subscriptionController.deleteSubscriptionPlan);

// Get subscription details by ID (admin)
router.get('/admin/:id', subscriptionController.getSubscriptionById);

// Force cancel subscription (admin)
router.delete('/admin/:id/cancel', subscriptionController.adminCancelSubscription);

// Extend subscription (admin)
router.put('/admin/:id/extend', subscriptionController.extendSubscription);

// Get expired subscriptions (admin)
router.get('/admin/expired', subscriptionController.getExpiredSubscriptions);

// Bulk operations (admin)
router.post('/admin/bulk/cancel', subscriptionController.bulkCancelSubscriptions);
router.post('/admin/bulk/extend', subscriptionController.bulkExtendSubscriptions);

module.exports = router;
