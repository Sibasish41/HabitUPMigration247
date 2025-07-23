const { Meeting, User, Doctor } = require('../models');
const { Op } = require('sequelize');
const { validationResult } = require('express-validator');

/**
 * Create a new meeting
 */
const createMeeting = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      doctorId,
      title,
      description,
      scheduledAt,
      duration = 30,
      meetingType = 'video',
      agenda
    } = req.body;

    const userId = req.user.id;

    // Check if doctor exists
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    // Check for conflicting meetings
    const conflictingMeeting = await Meeting.findOne({
      where: {
        [Op.or]: [
          { userId: userId },
          { doctorId: doctorId }
        ],
        scheduledAt: {
          [Op.between]: [
            new Date(scheduledAt),
            new Date(new Date(scheduledAt).getTime() + duration * 60000)
          ]
        },
        status: {
          [Op.in]: ['scheduled', 'in_progress']
        }
      }
    });

    if (conflictingMeeting) {
      return res.status(409).json({
        success: false,
        message: 'Meeting time conflicts with existing appointment'
      });
    }

    const meeting = await Meeting.create({
      userId,
      doctorId,
      title,
      description,
      scheduledAt: new Date(scheduledAt),
      duration,
      meetingType,
      agenda,
      status: 'scheduled'
    });

    // Fetch the created meeting with associations
    const createdMeeting = await Meeting.findByPk(meeting.id, {
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
        },
        {
          model: Doctor,
          attributes: ['id', 'firstName', 'lastName', 'email', 'specialization', 'phoneNumber']
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Meeting scheduled successfully',
      data: createdMeeting
    });

  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all meetings for the authenticated user
 */
const getUserMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      upcoming = false,
      past = false 
    } = req.query;

    const offset = (page - 1) * limit;
    
    let whereClause = { userId };
    
    // Filter by status
    if (status) {
      whereClause.status = status;
    }
    
    // Filter for upcoming meetings
    if (upcoming === 'true') {
      whereClause.scheduledAt = {
        [Op.gte]: new Date()
      };
    }
    
    // Filter for past meetings
    if (past === 'true') {
      whereClause.scheduledAt = {
        [Op.lt]: new Date()
      };
    }

    const { count, rows: meetings } = await Meeting.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Doctor,
          attributes: ['id', 'firstName', 'lastName', 'email', 'specialization', 'phoneNumber']
        }
      ],
      order: [['scheduledAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: meetings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all meetings for a doctor
 */
const getDoctorMeetings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 10, 
      status, 
      upcoming = false,
      past = false 
    } = req.query;

    // Check if user is a doctor
    const doctor = await Doctor.findOne({ where: { userId } });
    if (!doctor) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Doctor account required.'
      });
    }

    const offset = (page - 1) * limit;
    
    let whereClause = { doctorId: doctor.id };
    
    // Filter by status
    if (status) {
      whereClause.status = status;
    }
    
    // Filter for upcoming meetings
    if (upcoming === 'true') {
      whereClause.scheduledAt = {
        [Op.gte]: new Date()
      };
    }
    
    // Filter for past meetings
    if (past === 'true') {
      whereClause.scheduledAt = {
        [Op.lt]: new Date()
      };
    }

    const { count, rows: meetings } = await Meeting.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
        }
      ],
      order: [['scheduledAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.status(200).json({
      success: true,
      data: meetings,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Error fetching doctor meetings:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get meeting by ID
 */
const getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
        },
        {
          model: Doctor,
          attributes: ['id', 'firstName', 'lastName', 'email', 'specialization', 'phoneNumber']
        }
      ]
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user has access to this meeting
    const doctor = await Doctor.findOne({ where: { userId } });
    const hasAccess = meeting.userId === userId || 
                      (doctor && meeting.doctorId === doctor.id) ||
                      req.user.role === 'admin';

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      data: meeting
    });

  } catch (error) {
    console.error('Error fetching meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Update meeting
 */
const updateMeeting = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const userId = req.user.id;
    const updates = req.body;

    const meeting = await Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user has permission to update
    const doctor = await Doctor.findOne({ where: { userId } });
    const canUpdate = meeting.userId === userId || 
                      (doctor && meeting.doctorId === doctor.id) ||
                      req.user.role === 'admin';

    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Prevent updating completed or cancelled meetings
    if (meeting.status === 'completed' || meeting.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed or cancelled meetings'
      });
    }

    // If updating scheduled time, check for conflicts
    if (updates.scheduledAt) {
      const conflictingMeeting = await Meeting.findOne({
        where: {
          id: { [Op.ne]: id },
          [Op.or]: [
            { userId: meeting.userId },
            { doctorId: meeting.doctorId }
          ],
          scheduledAt: {
            [Op.between]: [
              new Date(updates.scheduledAt),
              new Date(new Date(updates.scheduledAt).getTime() + (updates.duration || meeting.duration) * 60000)
            ]
          },
          status: {
            [Op.in]: ['scheduled', 'in_progress']
          }
        }
      });

      if (conflictingMeeting) {
        return res.status(409).json({
          success: false,
          message: 'Meeting time conflicts with existing appointment'
        });
      }
    }

    await meeting.update(updates);

    const updatedMeeting = await Meeting.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
        },
        {
          model: Doctor,
          attributes: ['id', 'firstName', 'lastName', 'email', 'specialization', 'phoneNumber']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Meeting updated successfully',
      data: updatedMeeting
    });

  } catch (error) {
    console.error('Error updating meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Cancel meeting
 */
const cancelMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const meeting = await Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user has permission to cancel
    const doctor = await Doctor.findOne({ where: { userId } });
    const canCancel = meeting.userId === userId || 
                      (doctor && meeting.doctorId === doctor.id) ||
                      req.user.role === 'admin';

    if (!canCancel) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Cannot cancel already completed or cancelled meetings
    if (meeting.status === 'completed' || meeting.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Meeting is already completed or cancelled'
      });
    }

    await meeting.update({
      status: 'cancelled',
      notes: reason ? `Cancelled: ${reason}` : 'Meeting cancelled'
    });

    const updatedMeeting = await Meeting.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
        },
        {
          model: Doctor,
          attributes: ['id', 'firstName', 'lastName', 'email', 'specialization', 'phoneNumber']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Meeting cancelled successfully',
      data: updatedMeeting
    });

  } catch (error) {
    console.error('Error cancelling meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Start meeting
 */
const startMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const meeting = await Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user has permission to start
    const doctor = await Doctor.findOne({ where: { userId } });
    const canStart = meeting.userId === userId || 
                     (doctor && meeting.doctorId === doctor.id);

    if (!canStart) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Can only start scheduled meetings
    if (meeting.status !== 'scheduled') {
      return res.status(400).json({
        success: false,
        message: 'Meeting must be in scheduled status to start'
      });
    }

    await meeting.update({
      status: 'in_progress',
      actualStartTime: new Date()
    });

    const updatedMeeting = await Meeting.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
        },
        {
          model: Doctor,
          attributes: ['id', 'firstName', 'lastName', 'email', 'specialization', 'phoneNumber']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Meeting started successfully',
      data: updatedMeeting
    });

  } catch (error) {
    console.error('Error starting meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * End meeting
 */
const endMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, summary } = req.body;
    const userId = req.user.id;

    const meeting = await Meeting.findByPk(id);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found'
      });
    }

    // Check if user has permission to end
    const doctor = await Doctor.findOne({ where: { userId } });
    const canEnd = meeting.userId === userId || 
                   (doctor && meeting.doctorId === doctor.id);

    if (!canEnd) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Can only end in-progress meetings
    if (meeting.status !== 'in_progress') {
      return res.status(400).json({
        success: false,
        message: 'Meeting must be in progress to end'
      });
    }

    const updateData = {
      status: 'completed',
      actualEndTime: new Date()
    };

    if (notes) updateData.notes = notes;
    if (summary) updateData.summary = summary;

    await meeting.update(updateData);

    const updatedMeeting = await Meeting.findByPk(id, {
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber']
        },
        {
          model: Doctor,
          attributes: ['id', 'firstName', 'lastName', 'email', 'specialization', 'phoneNumber']
        }
      ]
    });

    res.status(200).json({
      success: true,
      message: 'Meeting completed successfully',
      data: updatedMeeting
    });

  } catch (error) {
    console.error('Error ending meeting:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get meeting analytics for admin
 */
const getMeetingAnalytics = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }

    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        scheduledAt: {
          [Op.between]: [new Date(startDate), new Date(endDate)]
        }
      };
    }

    // Total meetings
    const totalMeetings = await Meeting.count({ where: dateFilter });

    // Meetings by status
    const meetingsByStatus = await Meeting.findAll({
      where: dateFilter,
      attributes: [
        'status',
        [require('sequelize').fn('COUNT', '*'), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Meetings by type
    const meetingsByType = await Meeting.findAll({
      where: dateFilter,
      attributes: [
        'meetingType',
        [require('sequelize').fn('COUNT', '*'), 'count']
      ],
      group: ['meetingType'],
      raw: true
    });

    // Average duration
    const avgDuration = await Meeting.findOne({
      where: {
        ...dateFilter,
        status: 'completed'
      },
      attributes: [
        [require('sequelize').fn('AVG', require('sequelize').col('duration')), 'avgDuration']
      ],
      raw: true
    });

    // Completion rate
    const completedMeetings = await Meeting.count({
      where: {
        ...dateFilter,
        status: 'completed'
      }
    });

    const completionRate = totalMeetings > 0 ? (completedMeetings / totalMeetings * 100).toFixed(2) : 0;

    // Most active doctors
    const activeDoctors = await Meeting.findAll({
      where: dateFilter,
      include: [
        {
          model: Doctor,
          attributes: ['id', 'firstName', 'lastName', 'specialization']
        }
      ],
      attributes: [
        'doctorId',
        [require('sequelize').fn('COUNT', '*'), 'meetingCount']
      ],
      group: ['doctorId', 'Doctor.id'],
      order: [[require('sequelize').literal('meetingCount'), 'DESC']],
      limit: 5,
      raw: false
    });

    res.status(200).json({
      success: true,
      data: {
        totalMeetings,
        meetingsByStatus: meetingsByStatus.reduce((acc, item) => {
          acc[item.status] = parseInt(item.count);
          return acc;
        }, {}),
        meetingsByType: meetingsByType.reduce((acc, item) => {
          acc[item.meetingType] = parseInt(item.count);
          return acc;
        }, {}),
        averageDuration: parseFloat(avgDuration?.avgDuration || 0),
        completionRate: parseFloat(completionRate),
        activeDoctors: activeDoctors.map(meeting => ({
          doctor: meeting.Doctor,
          meetingCount: meeting.dataValues.meetingCount
        }))
      }
    });

  } catch (error) {
    console.error('Error fetching meeting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createMeeting,
  getUserMeetings,
  getDoctorMeetings,
  getMeetingById,
  updateMeeting,
  cancelMeeting,
  startMeeting,
  endMeeting,
  getMeetingAnalytics
};
