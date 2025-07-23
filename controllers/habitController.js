const { Habit, User, HabitProgress } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

class HabitController {
  // Get all habits for a user
  async getUserHabits(req, res, next) {
    try {
      const userId = req.user.userId;
      
      const habits = await Habit.findAll({
        include: [{
          model: User,
          as: 'users',
          where: { userId },
          attributes: [],
          through: { attributes: [] }
        }],
        order: [['createdDate', 'DESC']]
      });

      res.json({
        success: true,
        data: habits,
        count: habits.length
      });
    } catch (error) {
      next(error);
    }
  }

  // Get a specific habit by ID
  async getHabitById(req, res, next) {
    try {
      const { habitId } = req.params;
      const userId = req.user.userId;

      const habit = await Habit.findOne({
        where: { habitId },
        include: [{
          model: User,
          as: 'users',
          where: { userId },
          attributes: [],
          through: { attributes: [] }
        }]
      });

      if (!habit) {
        return next(new ApiError('Habit not found', 404));
      }

      res.json({
        success: true,
        data: habit
      });
    } catch (error) {
      next(error);
    }
  }

  // Create a new habit
  async createHabit(req, res, next) {
    try {
      const userId = req.user.userId;
      const {
        habitName,
        habitDescription,
        habitCategory,
        targetDays,
        reminderTime,
        reminderEnabled,
        difficulty
      } = req.body;

      // Validate required fields
      if (!habitName) {
        return next(new ApiError('Habit name is required', 400));
      }

      // Create habit
      const habit = await Habit.create({
        habitName,
        habitDescription,
        habitCategory: habitCategory || 'OTHER',
        targetDays: targetDays || 21,
        reminderTime,
        reminderEnabled: reminderEnabled || false,
        difficulty: difficulty || 'MEDIUM'
      });

      // Associate habit with user
      await habit.addUser(req.user);

      res.status(201).json({
        success: true,
        message: 'Habit created successfully',
        data: habit
      });
    } catch (error) {
      next(error);
    }
  }

  // Update a habit
  async updateHabit(req, res, next) {
    try {
      const { habitId } = req.params;
      const userId = req.user.userId;

      // Check if habit exists and belongs to user
      const habit = await Habit.findOne({
        where: { habitId },
        include: [{
          model: User,
          as: 'users',
          where: { userId },
          attributes: [],
          through: { attributes: [] }
        }]
      });

      if (!habit) {
        return next(new ApiError('Habit not found', 404));
      }

      // Update habit
      await habit.update(req.body);

      res.json({
        success: true,
        message: 'Habit updated successfully',
        data: habit
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete a habit
  async deleteHabit(req, res, next) {
    try {
      const { habitId } = req.params;
      const userId = req.user.userId;

      // Check if habit exists and belongs to user
      const habit = await Habit.findOne({
        where: { habitId },
        include: [{
          model: User,
          as: 'users',
          where: { userId },
          attributes: [],
          through: { attributes: [] }
        }]
      });

      if (!habit) {
        return next(new ApiError('Habit not found', 404));
      }

      // Delete habit and all associated progress
      await HabitProgress.destroy({
        where: { habitId, userId }
      });
      
      await habit.destroy();

      res.json({
        success: true,
        message: 'Habit deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  // Mark habit as completed for today
  async markHabitComplete(req, res, next) {
    try {
      const { habitId } = req.params;
      const userId = req.user.userId;
      const { notes, mood, effortLevel } = req.body;
      const today = new Date().toISOString().split('T')[0];

      // Check if habit exists and belongs to user
      const habit = await Habit.findOne({
        where: { habitId },
        include: [{
          model: User,
          as: 'users',
          where: { userId },
          attributes: [],
          through: { attributes: [] }
        }]
      });

      if (!habit) {
        return next(new ApiError('Habit not found', 404));
      }

      // Check if already completed today
      const existingProgress = await HabitProgress.findOne({
        where: {
          userId,
          habitId,
          completionDate: today
        }
      });

      if (existingProgress) {
        // Update existing progress
        await existingProgress.update({
          completionStatus: 'COMPLETED',
          notes,
          mood,
          effortLevel,
          completionTime: new Date().toTimeString().split(' ')[0]
        });
      } else {
        // Create new progress entry
        await HabitProgress.create({
          userId,
          habitId,
          completionDate: today,
          completionStatus: 'COMPLETED',
          notes,
          mood,
          effortLevel,
          completionTime: new Date().toTimeString().split(' ')[0]
        });
      }

      // Update habit streak
      await this.updateHabitStreak(habitId, userId);

      res.json({
        success: true,
        message: 'Habit marked as completed'
      });
    } catch (error) {
      next(error);
    }
  }

  // Get habit progress/statistics
  async getHabitProgress(req, res, next) {
    try {
      const { habitId } = req.params;
      const userId = req.user.userId;
      const { days = 30 } = req.query;

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      const progress = await HabitProgress.findAll({
        where: {
          userId,
          habitId,
          completionDate: {
            [Op.gte]: startDate.toISOString().split('T')[0]
          }
        },
        order: [['completionDate', 'DESC']]
      });

      const habit = await Habit.findByPk(habitId);
      
      const stats = {
        totalDays: parseInt(days),
        completedDays: progress.filter(p => p.completionStatus === 'COMPLETED').length,
        partialDays: progress.filter(p => p.completionStatus === 'PARTIAL').length,
        missedDays: progress.filter(p => p.completionStatus === 'MISSED').length,
        currentStreak: habit?.currentStreak || 0,
        longestStreak: habit?.longestStreak || 0,
        completionRate: progress.length > 0 ? 
          (progress.filter(p => p.completionStatus === 'COMPLETED').length / parseInt(days) * 100).toFixed(2) : 0
      };

      res.json({
        success: true,
        data: {
          habit,
          progress,
          statistics: stats
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper method to update habit streak
  async updateHabitStreak(habitId, userId) {
    try {
      const habit = await Habit.findByPk(habitId);
      if (!habit) return;

      // Get recent progress to calculate streak
      const recentProgress = await HabitProgress.findAll({
        where: { userId, habitId },
        order: [['completionDate', 'DESC']],
        limit: 365 // Check last year
      });

      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      // Calculate current streak (from today backwards)
      const today = new Date().toISOString().split('T')[0];
      let checkDate = new Date();

      for (let i = 0; i < recentProgress.length; i++) {
        const progressDate = recentProgress[i].completionDate;
        const expectedDate = checkDate.toISOString().split('T')[0];

        if (progressDate === expectedDate && recentProgress[i].completionStatus === 'COMPLETED') {
          if (progressDate === today || i === 0) {
            currentStreak++;
          }
          tempStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          if (tempStreak > longestStreak) {
            longestStreak = tempStreak;
          }
          tempStreak = 0;
          if (progressDate !== expectedDate) {
            break; // Gap in streak
          }
        }
      }

      if (tempStreak > longestStreak) {
        longestStreak = tempStreak;
      }

      // Update habit with new streak values
      await habit.update({
        currentStreak,
        longestStreak: Math.max(longestStreak, habit.longestStreak)
      });

    } catch (error) {
      console.error('Error updating habit streak:', error);
    }
  }
}

module.exports = new HabitController();
