const { Feedback, User } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const { Op } = require('sequelize');

class FeedbackController {
  // Submit feedback
  async submitFeedback(req, res, next) {
    try {
      const {
        feedbackType,
        targetId,
        targetType,
        subject,
        message,
        rating,
        isAnonymous = false,
        tags,
        metadata
      } = req.body;

      const userId = req.user.userId;

      const feedback = await Feedback.create({
        userId,
        feedbackType,
        targetId,
        targetType,
        subject,
        message,
        rating,
        isAnonymous,
        tags,
        metadata,
        status: 'PENDING'
      });

      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: feedback
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user's feedback history
  async getUserFeedback(req, res, next) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const userId = req.user.userId;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const { count, rows: feedback } = await Feedback.findAndCountAll({
        where: { userId },
        order: [['submittedAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          feedback,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalFeedback: count,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all feedback (Admin only)
  async getAllFeedback(req, res, next) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        feedbackType,
        priority
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = {};

      if (status) whereClause.status = status;
      if (feedbackType) whereClause.feedbackType = feedbackType;
      if (priority) whereClause.priority = priority;

      const { count, rows: feedback } = await Feedback.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          attributes: ['userId', 'name', 'email']
        }],
        order: [['submittedAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          feedback,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalFeedback: count,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get specific feedback by ID
  async getFeedbackById(req, res, next) {
    try {
      const { feedbackId } = req.params;

      const feedback = await Feedback.findByPk(feedbackId, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['userId', 'name', 'email']
        }]
      });

      if (!feedback) {
        return next(new ApiError('Feedback not found', 404));
      }

      res.json({
        success: true,
        data: feedback
      });
    } catch (error) {
      next(error);
    }
  }

  // Update feedback status (Admin only)
  async updateFeedbackStatus(req, res, next) {
    try {
      const { feedbackId } = req.params;
      const { status, adminResponse, priority } = req.body;
      const adminId = req.user.userId;

      const feedback = await Feedback.findByPk(feedbackId);

      if (!feedback) {
        return next(new ApiError('Feedback not found', 404));
      }

      const updateData = { status };
      if (adminResponse) {
        updateData.adminResponse = adminResponse;
        updateData.adminId = adminId;
        updateData.responseDate = new Date();
      }
      if (priority) updateData.priority = priority;

      await feedback.update(updateData);

      res.json({
        success: true,
        message: 'Feedback updated successfully',
        data: feedback
      });
    } catch (error) {
      next(error);
    }
  }

  // Get public reviews/feedback
  async getPublicReviews(req, res, next) {
    try {
      const { targetType, targetId, page = 1, limit = 10 } = req.query;
      const offset = (parseInt(page) - 1) * parseInt(limit);

      const whereClause = {
        isPublic: true,
        feedbackType: 'APP_REVIEW'
      };

      if (targetType && targetId) {
        whereClause.targetType = targetType;
        whereClause.targetId = targetId;
      }

      const { count, rows: reviews } = await Feedback.findAndCountAll({
        where: whereClause,
        include: [{
          model: User,
          as: 'user',
          attributes: ['name'] // Only show name for public reviews
        }],
        order: [['submittedAt', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          reviews,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalReviews: count,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get feedback statistics (Admin only)
  async getFeedbackStats(req, res, next) {
    try {
      const [
        totalFeedback,
        pendingFeedback,
        resolvedFeedback,
        averageRating,
        feedbackByType,
        feedbackByPriority
      ] = await Promise.all([
        Feedback.count(),
        Feedback.count({ where: { status: 'PENDING' } }),
        Feedback.count({ where: { status: 'RESOLVED' } }),
        Feedback.findAll({
          attributes: [
            [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating']
          ],
          where: { rating: { [Op.not]: null } }
        }),
        Feedback.findAll({
          attributes: [
            'feedbackType',
            [sequelize.fn('COUNT', sequelize.col('feedbackId')), 'count']
          ],
          group: ['feedbackType']
        }),
        Feedback.findAll({
          attributes: [
            'priority',
            [sequelize.fn('COUNT', sequelize.col('feedbackId')), 'count']
          ],
          group: ['priority']
        })
      ]);

      res.json({
        success: true,
        data: {
          totalFeedback,
          pendingFeedback,
          resolvedFeedback,
          averageRating: averageRating[0]?.dataValues?.avgRating || 0,
          feedbackByType,
          feedbackByPriority
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FeedbackController();
