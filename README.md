# HabitUP Server

Express.js backend server for the HabitUP application.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Environment Configuration:**
   - Copy `.env.example` to `.env`
   - Update the environment variables with your configuration

3. **Database Setup:**
   - Ensure MySQL is running
   - Create a database named `habitup_db`
   - Update database credentials in `.env`

4. **Start the server:**
   
   Development mode:
   ```bash
   npm run dev
   ```
   
   Production mode:
   ```bash
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/verify` - Verify JWT token

### Users
- `GET /api/user` - Get all users
- `POST /api/user` - Create new user
- `PUT /api/user/:userId` - Update user
- `DELETE /api/user/:userId` - Delete user

### Health Check
- `GET /health` - Server health check

## Project Structure

```
server/
├── config/          # Configuration files
├── controllers/     # Route controllers
├── middleware/      # Custom middleware
├── models/          # Database models
├── routes/          # API routes
├── uploads/         # File uploads
├── utils/           # Utility functions
├── index.js         # Server entry point
└── package.json     # Dependencies and scripts
```

## Technologies Used

- **Express.js** - Web framework
- **Sequelize** - ORM for MySQL
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Helmet** - Security middleware
- **CORS** - Cross-origin resource sharing
- **Morgan** - HTTP request logger

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Security headers with Helmet
- Input validation

## Development Notes

This server is a migration from the original Spring Boot application. Many endpoints are currently placeholder implementations and need to be completed with full business logic.

## ✅ **Implemented Features:**

### Core Models
- ✅ **User Model** - Complete with authentication, profiles, permissions
- ✅ **Habit Model** - Habit creation, tracking, categories, difficulty levels
- ✅ **HabitProgress Model** - Daily habit completion tracking with mood/effort
- ✅ **Permission Model** - Role-based access control system
- ✅ **Admin Model** - Admin user management

### Authentication & Authorization
- ✅ **JWT Authentication** - Secure token-based authentication
- ✅ **User Registration/Login** - Complete auth flow with validation
- ✅ **Permission-based Authorization** - Granular permission system
- ✅ **Password Hashing** - Secure bcrypt password storage

### API Endpoints

#### Authentication (`/api/auth`)
- ✅ `POST /register` - User registration
- ✅ `POST /login` - User login
- ✅ `POST /logout` - User logout
- ✅ `GET /verify` - Token verification

#### Users (`/api/user`)
- ✅ `GET /profile` - Get current user profile
- ✅ `PUT /profile` - Update user profile
- ✅ `PUT /profile/photo` - Upload profile photo
- ✅ `GET /profile-photo/:email` - Get user profile photo
- ✅ `GET /dashboard` - User dashboard with statistics
- ✅ `GET /statistics` - Detailed user statistics
- ✅ `PUT /password` - Change password
- ✅ `DELETE /account` - Delete user account

#### Habits (`/api/habit`)
- ✅ `GET /` - Get user's habits
- ✅ `POST /` - Create new habit
- ✅ `GET /:habitId` - Get specific habit
- ✅ `PUT /:habitId` - Update habit
- ✅ `DELETE /:habitId` - Delete habit
- ✅ `POST /:habitId/complete` - Mark habit as completed
- ✅ `GET /:habitId/progress` - Get habit progress/statistics

#### Admin (`/api/admin`)
- ✅ `GET /dashboard` - Admin dashboard with system statistics
- ✅ `GET /users` - Get all users with pagination/filtering
- ✅ `GET /users/:userId` - Get specific user details
- ✅ `PUT /users/:userId/status` - Update user account status
- ✅ `PUT /users/:userId/subscription` - Update user subscription
- ✅ `DELETE /users/:userId` - Delete user account
- ✅ `GET /stats` - System-wide statistics

### Advanced Features
- ✅ **Habit Streaks** - Automatic calculation of current and longest streaks
- ✅ **Progress Tracking** - Daily habit completion with mood and effort levels
- ✅ **Statistics Dashboard** - Comprehensive user and admin analytics
- ✅ **File Upload** - Profile photo upload with image processing
- ✅ **Data Validation** - Comprehensive input validation with express-validator
- ✅ **Error Handling** - Global error handling with custom error types
- ✅ **Security** - Rate limiting, CORS, Helmet security headers
- ✅ **Database Relationships** - Proper associations between models
- ✅ **Permission Seeding** - Automatic default permissions initialization

### 🔥 **Recently Added Features:**

#### Email Service & Notifications
- ✅ **Nodemailer Integration** - Complete email service setup
- ✅ **Email Templates** - Welcome, password reset, habit reminders, streak milestones
- ✅ **Scheduled Email Tasks** - Daily reminders, weekly summaries, milestone celebrations

#### Doctor & Healthcare System
- ✅ **Doctor Model** - Complete doctor profiles with specializations, ratings, availability
- ✅ **Meeting/Consultation System** - Video calls, appointments, ratings, payments
- ✅ **Doctor Search & Booking** - Filter by specialization, rating, availability

#### Messaging System
- ✅ **Real-time Messaging** - User-Doctor-Admin messaging with conversation management
- ✅ **Message Types** - Text, images, documents, audio support
- ✅ **Conversation Management** - Threaded conversations, read receipts, message priority

#### Feedback & Review System
- ✅ **Multi-type Feedback** - Bug reports, feature requests, doctor reviews, app reviews
- ✅ **Admin Response System** - Status tracking, priority management, admin responses
- ✅ **Public Reviews** - Display public feedback and ratings

#### Advanced Features
- ✅ **Payment Integration** - Razorpay setup for consultations and subscriptions
- ✅ **Scheduled Tasks** - Automated reminders, cleanup tasks, weekly summaries
- ✅ **File Upload System** - Profile photos, document attachments

### 📊 **Complete API Endpoints:**

#### Doctors (`/api/doctor`)
- ✅ `GET /` - Get all doctors with filters (specialization, rating, pagination)
- ✅ `GET /:doctorId` - Get specific doctor details
- ✅ `GET /:doctorId/availability` - Get doctor availability for booking
- ✅ `POST /:doctorId/book` - Book appointment with doctor
- ✅ `POST /:doctorId/rate` - Rate doctor after consultation

#### Messages (`/api/message`)
- ✅ `POST /` - Send message to user/doctor/admin
- ✅ `GET /conversations` - Get all user conversations
- ✅ `GET /conversation/:participantType/:participantId` - Get specific conversation
- ✅ `DELETE /:messageId` - Delete message
- ✅ `GET /unread-count` - Get unread message count

#### Feedback (`/api/feedback`)
- ✅ `POST /` - Submit feedback/review
- ✅ `GET /my-feedback` - Get user's feedback history
- ✅ `GET /all` - Get all feedback (Admin)
- ✅ `GET /:feedbackId` - Get specific feedback details
- ✅ `PUT /:feedbackId` - Update feedback status (Admin)
- ✅ `GET /public/reviews` - Get public reviews
- ✅ `GET /admin/stats` - Get feedback statistics (Admin)

### 🛠️ **Technical Improvements:**
- ✅ **Enhanced Error Handling** - Custom error classes, detailed error responses
- ✅ **Advanced Validation** - Comprehensive input validation with express-validator
- ✅ **Database Relationships** - Complex associations between all models
- ✅ **Security Enhancements** - Rate limiting, input sanitization, permission-based access
- ✅ **Automated Tasks** - Cron jobs for maintenance and notifications

### TODO (Remaining)
- [ ] Socket.io for real-time messaging
- [ ] Push notifications (FCM/APNS)
- [ ] Advanced analytics dashboard
- [ ] API documentation (Swagger)
- [ ] Unit and integration tests
- [ ] Docker containerization
- [ ] Redis caching layer
- [ ] File storage optimization (AWS S3/CloudFront)
- [ ] Advanced search with Elasticsearch
