const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: "vitforall2025@gmail.com", // Your Gmail
    pass: "oxdfqvuwkzxqyylo" // Your App Password
  }
});

const sendEmail = async ({ to, subject, text }) => {
  try {
    const mailOptions = {
      from: '"V-Ride System" <vitforall2025@gmail.com>', // Consistent with auth user
      to,
      subject,
      text
    };
    
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw error; // Rethrow to handle in calling function
  }
};

module.exports = { sendEmail };