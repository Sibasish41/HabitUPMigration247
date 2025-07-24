const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validatePayment, validateRefund } = require('../middleware/validation');
const { rateLimiter } = require('../middleware/rateLimiter');

// Apply authentication to all payment routes
router.use(authenticateToken);

// User payment routes
router.post('/create-order', 
    rateLimiter({ windowMs: 15 * 60 * 1000, max: 10 }), // 10 requests per 15 minutes
    validatePayment,
    paymentController.createPaymentOrder
);

router.post('/verify-payment', 
    rateLimiter({ windowMs: 15 * 60 * 1000, max: 20 }), // 20 verifications per 15 minutes
    paymentController.verifyPayment
);

router.get('/history', 
    rateLimiter({ windowMs: 15 * 60 * 1000, max: 50 }), // 50 requests per 15 minutes
    paymentController.getPaymentHistory
);

router.get('/subscription-status', 
    paymentController.getSubscriptionStatus
);

router.post('/cancel-subscription', 
    rateLimiter({ windowMs: 60 * 60 * 1000, max: 3 }), // 3 cancellations per hour
    paymentController.cancelSubscription
);

// Get payment details by ID
router.get('/:paymentId', 
    paymentController.getPaymentDetails
);

// Admin routes
router.get('/admin/all-payments', 
    authorizeRoles(['admin', 'super_admin']),
    paymentController.getAllPayments
);

router.get('/admin/stats', 
    authorizeRoles(['admin', 'super_admin']),
    paymentController.getPaymentStats
);

router.post('/admin/refund/:paymentId', 
    authorizeRoles(['admin', 'super_admin']),
    validateRefund,
    rateLimiter({ windowMs: 60 * 60 * 1000, max: 20 }), // 20 refunds per hour
    paymentController.processRefund
);

router.get('/admin/user/:userId/payments', 
    authorizeRoles(['admin', 'super_admin']),
    paymentController.getUserPayments
);

router.patch('/admin/:paymentId/status', 
    authorizeRoles(['admin', 'super_admin']),
    paymentController.updatePaymentStatus
);

// Webhook route (no authentication required)
router.post('/webhook', 
    express.raw({ type: 'application/json' }), // Raw body for webhook verification
    rateLimiter({ windowMs: 60 * 1000, max: 100 }), // 100 webhook calls per minute
    paymentController.handleWebhook
);

// Export routes
module.exports = router;
