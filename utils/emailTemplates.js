const emailTemplates = {
  // Welcome email template
  welcomeEmail: (name) => ({
    subject: 'Welcome to HabitUP! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fdc134, #FFEB00); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #315575; margin: 0; font-size: 32px;">Welcome to HabitUP!</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #315575;">Hi ${name},</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Welcome to HabitUP! We're excited to have you join our community of habit builders.
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Start your journey by creating your first habit and tracking your progress. 
            Remember, small consistent actions lead to big changes!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/dashboard" 
               style="background: linear-gradient(135deg, #fdc134, #FFEB00); 
                      color: #315575; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold;
                      display: inline-block;">
              Get Started
            </a>
          </div>
          <p style="color: #999; font-size: 14px; text-align: center;">
            Happy habit building!<br>
            The HabitUP Team
          </p>
        </div>
      </div>
    `,
    text: `Welcome to HabitUP, ${name}! Start building better habits today.`
  }),

  // Password reset email template
  passwordReset: (name, resetToken) => ({
    subject: 'Reset Your HabitUP Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #315575; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #315575;">Hi ${name},</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            We received a request to reset your password. Click the button below to reset it:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/reset-password?token=${resetToken}" 
               style="background: #dc3545; 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold;
                      display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            This link will expire in 1 hour. If you didn't request this reset, please ignore this email.
          </p>
          <p style="color: #999; font-size: 14px; text-align: center;">
            Best regards,<br>
            The HabitUP Team
          </p>
        </div>
      </div>
    `,
    text: `Hi ${name}, reset your password using this link: ${process.env.CLIENT_URL}/reset-password?token=${resetToken}`
  }),

  // Account activation email
  accountActivation: (name) => ({
    subject: 'Your HabitUP Account Has Been Activated! ✅',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745, #20c997); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Account Activated!</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #315575;">Hi ${name},</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Great news! Your HabitUP account has been activated and is now ready to use.
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You can now access all features and start building amazing habits!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/login" 
               style="background: linear-gradient(135deg, #28a745, #20c997); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold;
                      display: inline-block;">
              Login Now
            </a>
          </div>
        </div>
      </div>
    `,
    text: `Hi ${name}, your HabitUP account has been activated! Login at ${process.env.CLIENT_URL}/login`
  }),

  // Habit reminder email
  habitReminder: (name, habits) => ({
    subject: 'Don\'t Forget Your Daily Habits! ⏰',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #fdc134, #FFEB00); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: #315575; margin: 0; font-size: 28px;">Habit Reminder</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #315575;">Hi ${name},</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Just a friendly reminder about your daily habits:
          </p>
          <ul style="color: #666; font-size: 16px; line-height: 1.8;">
            ${habits.map(habit => `<li>${habit.habitName}</li>`).join('')}
          </ul>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Keep up the great work! Every small step counts towards your goals.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/dashboard" 
               style="background: linear-gradient(135deg, #fdc134, #FFEB00); 
                      color: #315575; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold;
                      display: inline-block;">
              Track Progress
            </a>
          </div>
        </div>
      </div>
    `,
    text: `Hi ${name}, reminder for your habits: ${habits.map(h => h.habitName).join(', ')}`
  }),

  // Streak milestone email
  streakMilestone: (name, habitName, streakCount) => ({
    subject: `🔥 ${streakCount} Day Streak! You're on Fire!`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 32px;">🔥 ${streakCount} Day Streak!</h1>
        </div>
        <div style="background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px;">
          <h2 style="color: #315575;">Congratulations ${name}!</h2>
          <p style="color: #666; font-size: 18px; line-height: 1.6; text-align: center;">
            You've maintained your <strong>"${habitName}"</strong> habit for <strong>${streakCount} consecutive days</strong>!
          </p>
          <p style="color: #666; font-size: 16px; line-height: 1.6; text-align: center;">
            This is a fantastic achievement. Keep the momentum going!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/habits" 
               style="background: linear-gradient(135deg, #ff6b35, #f7931e); 
                      color: white; 
                      padding: 15px 30px; 
                      text-decoration: none; 
                      border-radius: 25px; 
                      font-weight: bold;
                      display: inline-block;">
              View Progress
            </a>
          </div>
        </div>
      </div>
    `,
    text: `Congratulations ${name}! You've maintained your "${habitName}" habit for ${streakCount} consecutive days!`
  })
};

module.exports = emailTemplates;
