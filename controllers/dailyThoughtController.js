const { DailyThought, User } = require('../models');
const { Op } = require('sequelize');

const dailyThoughtController = {
  // Create a new daily thought (Admin only)
  createDailyThought: async (req, res) => {
    try {
      const { title, content, author, category, scheduledDate, isActive = true } = req.body;

      if (!title || !content) {
        return res.status(400).json({
          success: false,
          message: 'Title and content are required'
        });
      }

      const dailyThought = await DailyThought.create({
        title,
        content,
        author,
        category,
        scheduledDate: scheduledDate || new Date(),
        isActive,
        createdBy: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Daily thought created successfully',
        data: dailyThought
      });
    } catch (error) {
      console.error('Error creating daily thought:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create daily thought',
        error: error.message
      });
    }
  },

  // Get today's daily thought
  getTodayThought: async (req, res) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dailyThought = await DailyThought.findOne({
        where: {
          scheduledDate: {
            [Op.gte]: today,
            [Op.lt]: tomorrow
          },
          isActive: true
        },
        order: [['scheduledDate', 'DESC']]
      });

      if (!dailyThought) {
        return res.status(404).json({
          success: false,
          message: 'No daily thought found for today'
        });
      }

      res.json({
        success: true,
        data: dailyThought
      });
    } catch (error) {
      console.error('Error fetching today\'s thought:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch today\'s thought',
        error: error.message
      });
    }
  },

  // Get all daily thoughts with pagination and filtering
  getAllDailyThoughts: async (req, res) => {
    try {
      const { 
        page = 1, 
        limit = 10, 
        category, 
        author, 
        isActive,
        startDate,
        endDate,
        search 
      } = req.query;

      const offset = (page - 1) * limit;
      const whereClause = {};

      if (category) whereClause.category = category;
      if (author) whereClause.author = { [Op.iLike]: `%${author}%` };
      if (isActive !== undefined) whereClause.isActive = isActive === 'true';
      
      if (startDate && endDate) {
        whereClause.scheduledDate = {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        };
      }

      if (search) {
        whereClause[Op.or] = [
          { title: { [Op.iLike]: `%${search}%` } },
          { content: { [Op.iLike]: `%${search}%` } },
          { author: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows: dailyThoughts } = await DailyThought.findAndCountAll({
        where: whereClause,
        order: [['scheduledDate', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          thoughts: dailyThoughts,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching daily thoughts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch daily thoughts',
        error: error.message
      });
    }
  },

  // Get daily thought by ID
  getDailyThoughtById: async (req, res) => {
    try {
      const { id } = req.params;

      const dailyThought = await DailyThought.findByPk(id);

      if (!dailyThought) {
        return res.status(404).json({
          success: false,
          message: 'Daily thought not found'
        });
      }

      res.json({
        success: true,
        data: dailyThought
      });
    } catch (error) {
      console.error('Error fetching daily thought:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch daily thought',
        error: error.message
      });
    }
  },

  // Update daily thought (Admin only)
  updateDailyThought: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, content, author, category, scheduledDate, isActive } = req.body;

      const dailyThought = await DailyThought.findByPk(id);

      if (!dailyThought) {
        return res.status(404).json({
          success: false,
          message: 'Daily thought not found'
        });
      }

      const updatedThought = await dailyThought.update({
        title: title || dailyThought.title,
        content: content || dailyThought.content,
        author: author || dailyThought.author,
        category: category || dailyThought.category,
        scheduledDate: scheduledDate || dailyThought.scheduledDate,
        isActive: isActive !== undefined ? isActive : dailyThought.isActive,
        updatedAt: new Date()
      });

      res.json({
        success: true,
        message: 'Daily thought updated successfully',
        data: updatedThought
      });
    } catch (error) {
      console.error('Error updating daily thought:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update daily thought',
        error: error.message
      });
    }
  },

  // Delete daily thought (Admin only)
  deleteDailyThought: async (req, res) => {
    try {
      const { id } = req.params;

      const dailyThought = await DailyThought.findByPk(id);

      if (!dailyThought) {
        return res.status(404).json({
          success: false,
          message: 'Daily thought not found'
        });
      }

      await dailyThought.destroy();

      res.json({
        success: true,
        message: 'Daily thought deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting daily thought:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete daily thought',
        error: error.message
      });
    }
  },

  // Get random inspirational thought
  getRandomThought: async (req, res) => {
    try {
      const dailyThought = await DailyThought.findOne({
        where: { isActive: true },
        order: [['createdAt', 'DESC']] // You could also use Sequelize.fn('RANDOM') for true randomness
      });

      if (!dailyThought) {
        return res.status(404).json({
          success: false,
          message: 'No active thoughts available'
        });
      }

      res.json({
        success: true,
        data: dailyThought
      });
    } catch (error) {
      console.error('Error fetching random thought:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch random thought',
        error: error.message
      });
    }
  },

  // Get thoughts by category
  getThoughtsByCategory: async (req, res) => {
    try {
      const { category } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows: thoughts } = await DailyThought.findAndCountAll({
        where: { 
          category: { [Op.iLike]: `%${category}%` },
          isActive: true 
        },
        order: [['scheduledDate', 'DESC']],
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          thoughts,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / limit),
            totalItems: count,
            itemsPerPage: parseInt(limit)
          }
        }
      });
    } catch (error) {
      console.error('Error fetching thoughts by category:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch thoughts by category',
        error: error.message
      });
    }
  },

  // Get categories statistics (Admin)
  getCategoriesStats: async (req, res) => {
    try {
      const stats = await DailyThought.findAll({
        attributes: [
          'category',
          [require('sequelize').fn('COUNT', '*'), 'count']
        ],
        group: ['category'],
        order: [[require('sequelize').fn('COUNT', '*'), 'DESC']]
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error fetching category stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch category statistics',
        error: error.message
      });
    }
  }
};

module.exports = dailyThoughtController;
