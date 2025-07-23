const { User, Admin, Habit, HabitProgress, Permission, sequelize } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

class AdminController {
  // Get dashboard statistics
  async getDashboard(req, res, next) {
    try {
      const [
        totalUsers,
        activeUsers,
        totalHabits,
        completedHabitsToday,
        newUsersThisMonth
      ] = await Promise.all([
        User.count(),
        User.count({ where: { accountStatus: 'ACTIVE' } }),
        Habit.count(),
        HabitProgress.count({
          where: {
            completionDate: new Date().toISOString().split('T')[0],
            completionStatus: 'COMPLETED'
          }
        }),
        User.count({
          where: {
            createdAt: {
              [Op.gte]: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            }
          }
        })
      ]);

      // Get user registration trend (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const userTrend = await User.findAll({
        where: {
          createdAt: {
            [Op.gte]: sevenDaysAgo
          }
        },
        attributes: [
          [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
          [sequelize.fn('COUNT', sequelize.col('userId')), 'count']
        ],
        group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
        order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
      });

      res.json({
        success: true,
        data: {
          statistics: {
            totalUsers,
            activeUsers,
            totalHabits,
            completedHabitsToday,
            newUsersThisMonth,
            inactiveUsers: totalUsers - activeUsers
          },
          trends: {
            userRegistrations: userTrend
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all users with pagination and filters
  async getAllUsers(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        userType = '',
        sortBy = 'createdAt',
        sortOrder = 'DESC'
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = {};

      // Add search filter
      if (search) {
        whereClause[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } }
        ];
      }

      // Add status filter
      if (status) {
        whereClause.accountStatus = status;
      }

      // Add user type filter
      if (userType) {
        whereClause.userType = userType;
      }

      const { count, rows: users } = await User.findAndCountAll({
        where: whereClause,
        include: [{
          model: Habit,
          as: 'habits',
          attributes: ['habitId', 'habitName'],
          through: { attributes: [] }
        }],
        order: [[sortBy, sortOrder.toUpperCase()]],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          users,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalUsers: count,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get specific user details
  async getUserDetails(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId, {
        include: [
          {
            model: Habit,
            as: 'habits',
            through: { attributes: [] },
            include: [{
              model: HabitProgress,
              as: 'progress',
              where: { userId },
              required: false,
              limit: 30,
              order: [['completionDate', 'DESC']]
            }]
          },
          {
            model: Permission,
            as: 'permissions',
            through: { attributes: [] }
          }
        ]
      });

      if (!user) {
        return next(new ApiError('User not found', 404));
      }

      // Calculate user statistics
      const totalHabits = user.habits.length;
      const activeHabits = user.habits.filter(h => h.isActive).length;
      
      // Get completion rate for last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const completionStats = await HabitProgress.findAll({
        where: {
          userId,
          completionDate: {
            [Op.gte]: thirtyDaysAgo.toISOString().split('T')[0]
          }
        }
      });

      const completedCount = completionStats.filter(s => s.completionStatus === 'COMPLETED').length;
      const completionRate = completionStats.length > 0 ? 
        (completedCount / completionStats.length * 100).toFixed(2) : 0;

      res.json({
        success: true,
        data: {
          user,
          statistics: {
            totalHabits,
            activeHabits,
            completionRate,
            totalCompletions: completedCount,
            joinedDaysAgo: Math.floor((new Date() - new Date(user.joinDate)) / (1000 * 60 * 60 * 24))
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user account status
  async updateUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { accountStatus } = req.body;

      if (!['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'].includes(accountStatus)) {
        return next(new ApiError('Invalid account status', 400));
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return next(new ApiError('User not found', 404));
      }

      await user.update({ accountStatus });

      res.json({
        success: true,
        message: `User account status updated to ${accountStatus}`,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user subscription
  async updateUserSubscription(req, res, next) {
    try {
      const { userId } = req.params;
      const { subscriptionType } = req.body;

      if (!['FREE', 'PREMIUM', 'TRIAL'].includes(subscriptionType)) {
        return next(new ApiError('Invalid subscription type', 400));
      }

      const user = await User.findByPk(userId);
      if (!user) {
        return next(new ApiError('User not found', 404));
      }

      await user.update({ subscriptionType });

      res.json({
        success: true,
        message: `User subscription updated to ${subscriptionType}`,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete user account
  async deleteUser(req, res, next) {
    try {
      const { userId } = req.params;

      const user = await User.findByPk(userId);
      if (!user) {
        return next(new ApiError('User not found', 404));
      }

      // Delete associated data
      await HabitProgress.destroy({ where: { userId } });
      
      // Remove user from habits
      const userHabits = await user.getHabits();
      await user.removeHabits(userHabits);

      // Delete user
      await user.destroy();

      res.json({
        success: true,
        message: 'User account deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get system statistics
  async getSystemStats(req, res, next) {
    try {
      const { period = '30' } = req.query; // days
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(period));

      const [
        userGrowth,
        habitCompletions,
        topCategories,
        activeUsers
      ] = await Promise.all([
        // User growth over period
        User.findAll({
          where: {
            createdAt: {
              [Op.gte]: startDate
            }
          },
          attributes: [
            [sequelize.fn('DATE', sequelize.col('createdAt')), 'date'],
            [sequelize.fn('COUNT', sequelize.col('userId')), 'count']
          ],
          group: [sequelize.fn('DATE', sequelize.col('createdAt'))],
          order: [[sequelize.fn('DATE', sequelize.col('createdAt')), 'ASC']]
        }),

        // Habit completions over period
        HabitProgress.findAll({
          where: {
            completionDate: {
              [Op.gte]: startDate.toISOString().split('T')[0]
            },
            completionStatus: 'COMPLETED'
          },
          attributes: [
            'completionDate',
            [sequelize.fn('COUNT', sequelize.col('progressId')), 'count']
          ],
          group: ['completionDate'],
          order: [['completionDate', 'ASC']]
        }),

        // Top habit categories
        Habit.findAll({
          attributes: [
            'habitCategory',
            [sequelize.fn('COUNT', sequelize.col('habitId')), 'count']
          ],
          group: ['habitCategory'],
          order: [[sequelize.fn('COUNT', sequelize.col('habitId')), 'DESC']],
          limit: 5
        }),

        // Active users (users who completed at least one habit in the period)
        User.count({
          include: [{
            model: HabitProgress,
            as: 'habitProgress',
            where: {
              completionDate: {
                [Op.gte]: startDate.toISOString().split('T')[0]
              },
              completionStatus: 'COMPLETED'
            },
            required: true
          }],
          distinct: true
        })
      ]);

      res.json({
        success: true,
        data: {
          period: parseInt(period),
          userGrowth,
          habitCompletions,
          topCategories,
          activeUsers,
          generatedAt: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();
