const { sequelize } = require('../config/database');
const User = require('./User');
const Permission = require('./Permission');
const Habit = require('./Habit');
const HabitProgress = require('./HabitProgress');
const Doctor = require('./Doctor');
const Message = require('./Message');
const Feedback = require('./Feedback');
const Meeting = require('./Meeting');
const Payment = require('./Payment');
const Subscription = require('./Subscription');
const PasswordResetToken = require('./PasswordResetToken');
const DailyThought = require('./DailyThought');
const Document = require('./Document');
const Program = require('./Program');
const SystemSetting = require('./SystemSetting');

// Define associations
User.belongsToMany(Permission, {
  through: 'user_permissions',
  foreignKey: 'userId',
  otherKey: 'permissionId',
  as: 'permissions'
});

Permission.belongsToMany(User, {
  through: 'user_permissions',
  foreignKey: 'permissionId',
  otherKey: 'userId',
  as: 'users'
});
// User and Habit relationship
User.belongsToMany(Habit, {
  through: 'user_habits',
  foreignKey: 'userId',
  otherKey: 'habitId',
  as: 'habits'
});

Habit.belongsToMany(User, {
  through: 'user_habits',
  foreignKey: 'habitId',
  otherKey: 'userId',
  as: 'users'
});

// HabitProgress relationships
User.hasMany(HabitProgress, {
  foreignKey: 'userId',
  as: 'habitProgress'
});

Habit.hasMany(HabitProgress, {
  foreignKey: 'habitId',
  as: 'progress'
});

HabitProgress.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

HabitProgress.belongsTo(Habit, {
  foreignKey: 'habitId',
  as: 'habit'
});

// User and Doctor relationships for meetings
User.hasMany(Meeting, {
  foreignKey: 'userId',
  as: 'meetings'
});

Doctor.hasMany(Meeting, {
  foreignKey: 'doctorId',
  as: 'appointments'
});

Meeting.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Meeting.belongsTo(Doctor, {
  foreignKey: 'doctorId',
  as: 'doctor'
});

// Feedback relationships
User.hasMany(Feedback, {
  foreignKey: 'userId',
  as: 'feedback'
});

Feedback.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Payment relationships
User.hasMany(Payment, {
  foreignKey: 'userId',
  as: 'payments'
});

Payment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Subscription relationships
User.hasMany(Subscription, {
  foreignKey: 'userId',
  as: 'subscriptions'
});

Subscription.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Password reset token relationships
User.hasMany(PasswordResetToken, {
  foreignKey: 'userId',
  as: 'passwordResetTokens'
});

PasswordResetToken.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Document relationships
User.hasMany(Document, {
  foreignKey: 'userId',
  as: 'documents'
});

Doctor.hasMany(Document, {
  foreignKey: 'doctorId',
  as: 'documents'
});

Document.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Document.belongsTo(Doctor, {
  foreignKey: 'doctorId',
  as: 'doctor'
});

// Program relationships
Doctor.hasMany(Program, {
  foreignKey: 'instructorId',
  as: 'programs'
});

Program.belongsTo(Doctor, {
  foreignKey: 'instructorId',
  as: 'instructor'
});

// User-Program enrollment (many-to-many)
User.belongsToMany(Program, {
  through: 'user_programs',
  foreignKey: 'userId',
  otherKey: 'programId',
  as: 'enrolledPrograms'
});

Program.belongsToMany(User, {
  through: 'user_programs',
  foreignKey: 'programId',
  otherKey: 'userId',
  as: 'participants'
});

// System setting relationships
SystemSetting.belongsTo(User, {
  foreignKey: 'lastModifiedBy',
  as: 'modifier'
});

// Sync models with database
const syncDatabase = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized');
  } catch (error) {
    console.error('❌ Error synchronizing database models:', error);
  }
};

module.exports = {
  sequelize,
  User,
  Permission,
  Habit,
  HabitProgress,
  Doctor,
  Message,
  Feedback,
  Meeting,
  Payment,
  Subscription,
  PasswordResetToken,
  DailyThought,
  Document,
  Program,
  SystemSetting,
  syncDatabase
};
