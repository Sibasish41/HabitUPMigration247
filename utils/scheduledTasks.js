const cron = require('node-cron');
const { User, Habit, HabitProgress, sequelize } = require('../models');
const { sendEmail } = require('./emailService');
const emailTemplates = require('./emailTemplates');
const { Op } = require('sequelize');

class ScheduledTasks {
  // Initialize all scheduled tasks
  static init() {
    console.log('🕒 Initializing scheduled tasks...');
    
    // Daily habit reminders (9 AM every day)
    this.scheduleHabitReminders();
    
    // Streak milestone check (10 PM every day)
    this.scheduleStreakMilestones();
    
    // Weekly progress summary (Sunday 8 PM)
    this.scheduleWeeklyProgressSummary();
    
    // Clean up old messages (Every Sunday at 2 AM)
    this.scheduleMessageCleanup();
    
    console.log('✅ All scheduled tasks initialized');
  }

  // Daily habit reminders
  static scheduleHabitReminders() {
    cron.schedule('0 9 * * *', async () => {
      console.log('📧 Sending daily habit reminders...');
      
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get users with active habits who haven't completed them today
        const usersWithIncompleteHabits = await User.findAll({
          include: [{
            model: Habit,
            as: 'habits',
            where: { 
              isActive: true,
              reminderEnabled: true
            },
            include: [{
              model: HabitProgress,
              as: 'progress',
              where: {
                completionDate: today,
                completionStatus: 'COMPLETED'
              },
              required: false
            }]
          }]
        });

        for (const user of usersWithIncompleteHabits) {
          const incompleteHabits = user.habits.filter(habit => 
            habit.progress.length === 0 // No progress today
          );

          if (incompleteHabits.length > 0) {
            const emailData = emailTemplates.habitReminder(user.name, incompleteHabits);
            
            await sendEmail({
              to: user.email,
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text
            });
          }
        }
        
        console.log(`✅ Habit reminders sent to ${usersWithIncompleteHabits.length} users`);
      } catch (error) {
        console.error('❌ Error sending habit reminders:', error);
      }
    });
  }

  // Check for streak milestones
  static scheduleStreakMilestones() {
    cron.schedule('0 22 * * *', async () => {
      console.log('🔥 Checking for streak milestones...');
      
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Get today's completed habits
        const completedHabitsToday = await HabitProgress.findAll({
          where: {
            completionDate: today,
            completionStatus: 'COMPLETED'
          },
          include: [
            {
              model: User,
              as: 'user'
            },
            {
              model: Habit,
              as: 'habit'
            }
          ]
        });

        for (const progress of completedHabitsToday) {
          const { user, habit } = progress;
          const streak = habit.currentStreak;
          
          // Send email for milestone streaks (7, 21, 30, 50, 100 days)
          const milestones = [7, 21, 30, 50, 100];
          
          if (milestones.includes(streak)) {
            const emailData = emailTemplates.streakMilestone(
              user.name, 
              habit.habitName, 
              streak
            );
            
            await sendEmail({
              to: user.email,
              subject: emailData.subject,
              html: emailData.html,
              text: emailData.text
            });
          }
        }
        
        console.log(`✅ Streak milestone check completed for ${completedHabitsToday.length} habits`);
      } catch (error) {
        console.error('❌ Error checking streak milestones:', error);
      }
    });
  }

  // Weekly progress summary
  static scheduleWeeklyProgressSummary() {
    cron.schedule('0 20 * * 0', async () => { // Sunday 8 PM
      console.log('📊 Sending weekly progress summaries...');
      
      try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        
        const users = await User.findAll({
          where: { accountStatus: 'ACTIVE' },
          include: [{
            model: Habit,
            as: 'habits',
            where: { isActive: true }
          }]
        });

        for (const user of users) {
          // Calculate weekly stats
          const weeklyProgress = await HabitProgress.findAll({
            where: {
              userId: user.userId,
              completionDate: {
                [Op.gte]: weekAgo.toISOString().split('T')[0]
              }
            }
          });

          const completedCount = weeklyProgress.filter(p => p.completionStatus === 'COMPLETED').length;
          const totalPossible = user.habits.length * 7;
          const completionRate = totalPossible > 0 ? (completedCount / totalPossible * 100).toFixed(1) : 0;

          // Send weekly summary email
          const emailContent = {
            subject: `Your Weekly HabitUP Progress Summary 📊`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Hi ${user.name}!</h2>
                <p>Here's your weekly progress summary:</p>
                <ul>
                  <li><strong>Completed Habits:</strong> ${completedCount}</li>
                  <li><strong>Completion Rate:</strong> ${completionRate}%</li>
                  <li><strong>Active Habits:</strong> ${user.habits.length}</li>
                </ul>
                <p>Keep up the great work!</p>
                <a href="${process.env.CLIENT_URL}/dashboard" style="background: #fdc134; color: #315575; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a>
              </div>
            `,
            text: `Weekly Progress: ${completedCount} habits completed (${completionRate}% completion rate)`
          };

          await sendEmail({
            to: user.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text
          });
        }
        
        console.log(`✅ Weekly summaries sent to ${users.length} users`);
      } catch (error) {
        console.error('❌ Error sending weekly summaries:', error);
      }
    });
  }

  // Cleanup old messages
  static scheduleMessageCleanup() {
    cron.schedule('0 2 * * 0', async () => { // Sunday 2 AM
      console.log('🧹 Cleaning up old messages...');
      
      try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const deletedCount = await Message.destroy({
          where: {
            isDeleted: true,
            deletedAt: {
              [Op.lt]: sixMonthsAgo
            }
          }
        });
        
        console.log(`✅ Cleaned up ${deletedCount} old messages`);
      } catch (error) {
        console.error('❌ Error cleaning up messages:', error);
      }
    });
  }

  // Manual trigger for testing (can be called via API)
  static async sendTestReminder(userId) {
    try {
      const user = await User.findByPk(userId, {
        include: [{
          model: Habit,
          as: 'habits',
          where: { isActive: true }
        }]
      });

      if (user && user.habits.length > 0) {
        const emailData = emailTemplates.habitReminder(user.name, user.habits);
        
        await sendEmail({
          to: user.email,
          subject: emailData.subject,
          html: emailData.html,
          text: emailData.text
        });
        
        return { success: true, message: 'Test reminder sent successfully' };
      } else {
        return { success: false, message: 'User not found or has no active habits' };
      }
    } catch (error) {
      console.error('Error sending test reminder:', error);
      return { success: false, message: 'Failed to send test reminder' };
    }
  }
}

module.exports = ScheduledTasks;
