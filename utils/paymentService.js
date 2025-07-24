const Razorpay = require('razorpay');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Razorpay instance with graceful error handling
let razorpay = null;
if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
} else {
  console.warn('⚠️  Razorpay credentials not found. Payment service will use mock mode.');
}

// Create new order
const createOrder = async (amount, currency = 'INR') => {
  if (!razorpay) {
    // Return mock order for development/testing
    console.log(`🧪 Mock order created for amount: ${amount} ${currency}`);
    return {
      id: `order_${uuidv4()}`,
      entity: 'order',
      amount: amount * 100,
      amount_paid: 0,
      amount_due: amount * 100,
      currency,
      receipt: `receipt_${uuidv4()}`,
      status: 'created',
      created_at: Math.floor(Date.now() / 1000)
    };
  }

  try {
    const order = await razorpay.orders.create({
      amount: amount * 100, // Amount in paise/cents
      currency,
      receipt: `receipt_${uuidv4()}`,
    });

    return order;
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    throw error;
  }
};

// Verify payment
const verifyPayment = async (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  if (!process.env.RAZORPAY_KEY_SECRET) {
    // Mock verification for development/testing
    console.log(`🧪 Mock payment verification for order: ${razorpayOrderId}`);
    return true; // Always return true in mock mode
  }

  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  return generatedSignature === razorpaySignature; // Returns true if signatures match
};

module.exports = { createOrder, verifyPayment };
