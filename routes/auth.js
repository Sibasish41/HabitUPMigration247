const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { User } = require('../models');
const { ApiError } = require('../middleware/errorHandler');

const router = express.Router();

// Register user
router.post('/register', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('name').isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phoneNo').isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits'),
  body('dob').notEmpty().withMessage('Date of birth is required'),
  body('gender').isIn(['MALE', 'FEMALE', 'OTHER']).withMessage('Invalid gender')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { email, name, password, phoneNo, dob, gender } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return next(new ApiError('User already exists with this email', 400));
    }

    // Check if phone number already exists
    const existingPhone = await User.findOne({
      where: { phoneNo }
    });

    if (existingPhone) {
      return next(new ApiError('User already exists with this phone number', 400));
    }

    // Create user
    const user = await User.create({
      email,
      name,
      password,
      phoneNo,
      dob,
      gender,
      joinDate: new Date().toISOString().split('T')[0],
      accountStatus: 'PENDING',
      subscriptionType: 'FREE',
      userType: 'USER'
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      user,
      token
    });

  } catch (error) {
    next(error);
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: 'Validation Error',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return next(new ApiError('Invalid email or password', 401));
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return next(new ApiError('Invalid email or password', 401));
    }

    // Check if account is active
    if (user.accountStatus !== 'ACTIVE') {
      return next(new ApiError('Account is not active. Please contact support.', 401));
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      message: 'Login successful',
      user,
      token
    });

  } catch (error) {
    next(error);
  }
});

// Logout (mainly for client-side token removal)
router.post('/logout', (req, res) => {
  res.json({
    message: 'Logout successful'
  });
});

// Verify token
router.get('/verify', async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(new ApiError('Access token is required', 401));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.userId);

    if (!user) {
      return next(new ApiError('User not found', 401));
    }

    res.json({
      valid: true,
      user
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.json({ valid: false });
    }
    next(error);
  }
});

module.exports = router;
