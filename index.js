const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketHandler = require('./utils/socketHandler');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const habitRoutes = require('./routes/habit');
const adminRoutes = require('./routes/admin');
const doctorRoutes = require('./routes/doctor');
const subscriptionRoutes = require('./routes/subscription');
const paymentRoutes = require('./routes/payment');
const meetingRoutes = require('./routes/meeting');
const messageRoutes = require('./routes/message');
const feedbackRoutes = require('./routes/feedback');
const dailyThoughtRoutes = require('./routes/dailyThought');
const systemSettingsRoutes = require('./routes/systemSettings');

// Import middleware
const errorHandler = require('./middleware/errorHandler');
const { authenticateToken } = require('./middleware/auth');

// Import database
const { testConnection, syncDatabase } = require('./models');
const { seedPermissions } = require('./utils/seedPermissions');
const ScheduledTasks = require('./utils/scheduledTasks');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3001',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(limiter);

// Serve static files
app.use('/uploads', express.static('uploads'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'HabitUP Server is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', authenticateToken, userRoutes);
app.use('/api/habit', authenticateToken, habitRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/doctor', authenticateToken, doctorRoutes);
app.use('/api/subscription', authenticateToken, subscriptionRoutes);
app.use('/api/payment', authenticateToken, paymentRoutes);
app.use('/api/meeting', authenticateToken, meetingRoutes);
app.use('/api/message', authenticateToken, messageRoutes);
app.use('/api/feedback', authenticateToken, feedbackRoutes);
app.use('/api/daily-thought', authenticateToken, dailyThoughtRoutes);
app.use('/api/system-settings', systemSettingsRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Initialize database and start server
const startServer = async () => {
  try {
    // Test database connection
    await testConnection();
    
    // Sync database models
    await syncDatabase();
    
    // Seed default permissions
    await seedPermissions();
    
    // Initialize scheduled tasks
    ScheduledTasks.init();
    
    // Initialize Socket.IO
    socketHandler.initialize(server);
    
    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 HabitUP Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`🔌 Socket.IO ready for real-time connections`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
