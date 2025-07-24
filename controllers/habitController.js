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

  // Get habit analytics and insights
  async getHabitAnalytics(req, res, next) {
    try {
      const { habitId } = req.params;
      const userId = req.user.userId;
      const { timeRange = 90 } = req.query; // Default to 90 days

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

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(timeRange));

      const progress = await HabitProgress.findAll({
        where: {
          userId,
          habitId,
          completionDate: {
            [Op.gte]: startDate.toISOString().split('T')[0]
          }
        },
        order: [['completionDate', 'ASC']]
      });

      // Calculate analytics
      const totalDays = parseInt(timeRange);
      const completedDays = progress.filter(p => p.completionStatus === 'COMPLETED').length;
      const partialDays = progress.filter(p => p.completionStatus === 'PARTIAL').length;
      const missedDays = progress.filter(p => p.completionStatus === 'MISSED').length;
      const completionRate = totalDays > 0 ? (completedDays / totalDays * 100).toFixed(2) : 0;

      // Weekly breakdown
      const weeklyData = [];
      for (let i = 0; i < Math.ceil(totalDays / 7); i++) {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - (i + 1) * 7);
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - i * 7);

        const weekProgress = progress.filter(p => {
          const date = new Date(p.completionDate);
          return date >= weekStart && date <= weekEnd;
        });

        weeklyData.push({
          week: i + 1,
          completed: weekProgress.filter(p => p.completionStatus === 'COMPLETED').length,
          total: 7,
          rate: weekProgress.length > 0 ? 
            (weekProgress.filter(p => p.completionStatus === 'COMPLETED').length / 7 * 100).toFixed(2) : 0
        });
      }

      // Best performing days of week
      const dayOfWeekStats = {};
      ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach((day, index) => {
        const dayProgress = progress.filter(p => new Date(p.completionDate).getDay() === index);
        const completed = dayProgress.filter(p => p.completionStatus === 'COMPLETED').length;
        dayOfWeekStats[day] = {
          total: dayProgress.length,
          completed,
          rate: dayProgress.length > 0 ? (completed / dayProgress.length * 100).toFixed(2) : 0
        };
      });

      // Mood analysis
      const moodStats = {};
      ['EXCELLENT', 'GOOD', 'NEUTRAL', 'BAD', 'TERRIBLE'].forEach(mood => {
        const moodProgress = progress.filter(p => p.mood === mood && p.completionStatus === 'COMPLETED');
        moodStats[mood] = moodProgress.length;
      });

      // Effort level analysis
      const effortStats = {};
      for (let i = 1; i <= 10; i++) {
        const effortProgress = progress.filter(p => p.effortLevel === i && p.completionStatus === 'COMPLETED');
        effortStats[i] = effortProgress.length;
      }

      // Insights and recommendations
      const insights = [];
      
      // Best day of week
      const bestDay = Object.entries(dayOfWeekStats)
        .sort(([,a], [,b]) => parseFloat(b.rate) - parseFloat(a.rate))[0];
      if (bestDay && parseFloat(bestDay[1].rate) > 0) {
        insights.push(`Your best day is ${bestDay[0]} with a ${bestDay[1].rate}% completion rate`);
      }

      // Consistency insight
      if (completionRate > 80) {
        insights.push('Great consistency! You\'re maintaining excellent habits.');
      } else if (completionRate > 60) {
        insights.push('Good progress! Try to maintain consistency for better results.');
      } else {
        insights.push('Focus on building consistency. Small daily actions lead to big changes.');
      }

      // Streak insight
      if (habit.currentStreak >= 7) {
        insights.push(`Amazing! You\'re on a ${habit.currentStreak}-day streak. Keep it up!`);
      }

      res.json({
        success: true,
        data: {
          habit,
          analytics: {
            totalDays,
            completedDays,
            partialDays,
            missedDays,
            completionRate: parseFloat(completionRate),
            currentStreak: habit.currentStreak,
            longestStreak: habit.longestStreak
          },
          weeklyBreakdown: weeklyData.reverse(),
          dayOfWeekStats,
          moodStats,
          effortStats,
          insights
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get habit suggestions based on user behavior
  async getHabitSuggestions(req, res, next) {
    try {
      const userId = req.user.userId;
      
      // Get user's existing habits
      const userHabits = await Habit.findAll({
        include: [{
          model: User,
          as: 'users',
          where: { userId },
          attributes: [],
          through: { attributes: [] }
        }]
      });

      const existingCategories = userHabits.map(h => h.habitCategory);
      
      // Predefined habit suggestions by category
      const suggestions = {
        HEALTH: [
          { name: 'Drink 8 glasses of water', description: 'Stay hydrated throughout the day', difficulty: 'EASY' },
          { name: 'Exercise for 30 minutes', description: 'Physical activity for better health', difficulty: 'MEDIUM' },
          { name: 'Get 8 hours of sleep', description: 'Maintain a healthy sleep schedule', difficulty: 'MEDIUM' },
          { name: 'Take vitamins', description: 'Daily vitamin supplement', difficulty: 'EASY' },
          { name: 'Stretch for 10 minutes', description: 'Daily stretching routine', difficulty: 'EASY' }
        ],
        PRODUCTIVITY: [
          { name: 'Plan tomorrow today', description: 'Spend 10 minutes planning the next day', difficulty: 'EASY' },
          { name: 'No social media first hour', description: 'Avoid social media for the first hour after waking', difficulty: 'MEDIUM' },
          { name: 'Complete MIT (Most Important Task)', description: 'Focus on your most important task first', difficulty: 'MEDIUM' },
          { name: 'Organize workspace', description: 'Keep your workspace clean and organized', difficulty: 'EASY' },
          { name: 'Time blocking', description: 'Schedule your day in time blocks', difficulty: 'HARD' }
        ],
        MINDFULNESS: [
          { name: 'Meditate for 10 minutes', description: 'Daily meditation practice', difficulty: 'MEDIUM' },
          { name: 'Write in gratitude journal', description: 'Write 3 things you\'re grateful for', difficulty: 'EASY' },
          { name: 'Practice deep breathing', description: '5 minutes of deep breathing exercises', difficulty: 'EASY' },
          { name: 'Mindful eating', description: 'Eat at least one meal mindfully', difficulty: 'MEDIUM' },
          { name: 'Digital detox hour', description: 'One hour without any digital devices', difficulty: 'HARD' }
        ],
        LEARNING: [
          { name: 'Read for 30 minutes', description: 'Daily reading habit', difficulty: 'MEDIUM' },
          { name: 'Learn a new word', description: 'Expand your vocabulary daily', difficulty: 'EASY' },
          { name: 'Practice a skill', description: 'Dedicate time to skill development', difficulty: 'MEDIUM' },
          { name: 'Listen to educational podcast', description: 'Learn something new through podcasts', difficulty: 'EASY' },
          { name: 'Write in journal', description: 'Reflect and write daily thoughts', difficulty: 'EASY' }
        ],
        SOCIAL: [
          { name: 'Call family/friends', description: 'Stay connected with loved ones', difficulty: 'EASY' },
          { name: 'Compliment someone', description: 'Give a genuine compliment daily', difficulty: 'EASY' },
          { name: 'Practice active listening', description: 'Focus on truly listening in conversations', difficulty: 'MEDIUM' },
          { name: 'Random act of kindness', description: 'Do something nice for someone', difficulty: 'MEDIUM' }
        ]
      };

      // Prioritize categories user doesn't have habits in
      const recommendedSuggestions = [];
      
      Object.entries(suggestions).forEach(([category, habits]) => {
        const priority = existingCategories.includes(category) ? 'LOW' : 'HIGH';
        habits.forEach(habit => {
          recommendedSuggestions.push({
            ...habit,
            category,
            priority
          });
        });
      });

      // Sort by priority and difficulty
      recommendedSuggestions.sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority === 'HIGH' ? -1 : 1;
        }
        const difficultyOrder = { 'EASY': 1, 'MEDIUM': 2, 'HARD': 3 };
        return difficultyOrder[a.difficulty] - difficultyOrder[b.difficulty];
      });

      res.json({
        success: true,
        data: {
          suggestions: recommendedSuggestions.slice(0, 10), // Top 10 suggestions
          userHabitCount: userHabits.length,
          categoriesCovered: [...new Set(existingCategories)]
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
