const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Setup nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // upgrade later with STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Verify connection configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error('Email server connection error:', error);
  } else {
    console.log('Email server is ready to take messages');
  }
});

// Send an email
const sendEmail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: `HabitUP [49m<${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html
  };

  return transporter.sendMail(mailOptions);
};

module.exports = { sendEmail };
