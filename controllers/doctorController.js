const { Doctor, Meeting, User } = require('../models');
const { ApiError } = require('../middleware/errorHandler');
const Sequelize = require('sequelize');
const { Op } = require('sequelize');

class DoctorController {
  // Get all doctors with filters and pagination
  async getAllDoctors(req, res, next) {
    try {
      const {
        specialization,
        rating,
        page = 1,
        limit = 10
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const whereClause = {
        accountStatus: 'ACTIVE'
      };

      // Add specialization filter if provided
      if (specialization) {
        whereClause.specialization = specialization;
      }

      // Add minimum rating filter if provided
      if (rating) {
        whereClause.rating = { [Op.gte]: parseFloat(rating) };
      }

      const { count, rows: doctors } = await Doctor.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          doctors,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(count / parseInt(limit)),
            totalDoctors: count,
            limit: parseInt(limit)
          }
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Get specific doctor details by ID
  async getDoctorDetails(req, res, next) {
    try {
      const { doctorId } = req.params;

      const doctor = await Doctor.findByPk(doctorId);

      if (!doctor || doctor.accountStatus !== 'ACTIVE') {
        return next(new ApiError('Doctor not found', 404));
      }

      res.json({
        success: true,
        data: doctor
      });
    } catch (error) {
      next(error);
    }
  }

  // Get doctor availability
  async getDoctorAvailability(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;
      const targetDate = date ? new Date(date) : new Date();

      const doctor = await Doctor.findByPk(doctorId);

      if (!doctor || doctor.accountStatus !== 'ACTIVE') {
        return next(new ApiError('Doctor not found', 404));
      }

      const meetings = await Meeting.findAll({
        where: {
          doctorId,
          scheduledDate: {
            [Op.between]: [
              targetDate.setHours(0, 0, 0, 0),
              targetDate.setHours(23, 59, 59, 999)
            ]
          }
        }
      });

      const availability = doctor.availableHours || [];

      res.json({
        success: true,
        data: {
          availability,
          meetings
        }
      });
    } catch (error) {
      next(error);
    }
  }

  // Book appointment with doctor
  async bookAppointment(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { scheduledDate, meetingType, agenda } = req.body;
      const userId = req.user.userId;

      const doctor = await Doctor.findByPk(doctorId);

      if (!doctor || doctor.accountStatus !== 'ACTIVE') {
        return next(new ApiError('Doctor not found', 404));
      }

      const newMeeting = await Meeting.create({
        userId,
        doctorId,
        scheduledDate,
        meetingType,
        agenda,
        status: 'SCHEDULED',
        fee: doctor.consultationFee
      });

      res.json({
        success: true,
        message: 'Appointment booked successfully',
        data: newMeeting
      });
    } catch (error) {
      next(error);
    }
  }

  // Rate doctor after meeting
  async rateDoctor(req, res, next) {
    try {
      const { doctorId } = req.params;
      const { rating, feedback, meetingId } = req.body;

      const doctor = await Doctor.findByPk(doctorId);

      if (!doctor) {
        return next(new ApiError('Doctor not found', 404));
      }

      const meeting = await Meeting.findByPk(meetingId);

      if (!meeting || meeting.doctorId !== doctorId || meeting.userId !== req.user.userId) {
        return next(new ApiError('Meeting not found or unauthorized', 404));
      }

      if (meeting.status !== 'COMPLETED') {
        return next(new ApiError('Cannot rate doctor before meeting completion', 400));
      }

      await doctor.updateRating(rating);
      await meeting.update({ rating, feedback });

      res.json({
        success: true,
        message: 'Rating submitted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DoctorController();

