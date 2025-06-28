const nodemailer = require('nodemailer');

// Configure your email transporter (example for Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: "vitforall2025@gmail.com",
        pass: "oxdfqvuwkzxqyylo"
    }
});

async function sendInterestNotification(ownerEmail, ownerName, interestedUserName, subjectName, requestId) {
    const mailOptions = {
        from: `VALL <${process.env.EMAIL_USERNAME}>`,
        to: ownerEmail,
        subject: `[VALL] ${interestedUserName} is interested in your ${subjectName} request`,
        html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
                <!-- Header with VALL branding -->
                <div style="background: linear-gradient(135deg, #6e8efb, #a777e3); padding: 25px; text-align: center; border-radius: 8px 8px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px;">VALL</h1>
                    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0; font-size: 16px;">FFCS Swap Hub</p>
                </div>
                
                <!-- Email content -->
                <div style="padding: 25px; background: #ffffff; border-radius: 0 0 8px 8px; border: 1px solid #e1e1e1; border-top: none;">
                    <h2 style="color: #2c3e50; margin-top: 0;">New Interest in Your Request</h2>
                    
                    <p>Hello <strong>${ownerName}</strong>,</p>
                    
                    <p style="background: #f8f9fa; padding: 15px; border-radius: 6px; border-left: 4px solid #6e8efb;">
                        <strong>${interestedUserName}</strong> is interested in your add/drop request for:<br>
                        <span style="font-size: 18px; color: #2c3e50;">${subjectName}</span>
                    </p>
                    
                    <p>You can now connect with them to discuss the details:</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://vmedia.onrender.com/add-drop/page" 
                           style="display: inline-block; background: linear-gradient(135deg, #6e8efb, #a777e3); 
                                  color: white; padding: 12px 30px; text-decoration: none; 
                                  border-radius: 50px; font-weight: 500; font-size: 16px;
                                  box-shadow: 0 4px 12px rgba(110, 142, 251, 0.3);">
                            View Request on VALL
                        </a>
                    </div>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
                        <p style="font-size: 14px; color: #7f8c8d;">
                            If you didn't expect this notification, please 
                            <a href="mailto:support@vall.com" style="color: #6e8efb;">contact our support team</a>.
                        </p>
                    </div>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #95a5a6;">
                    <p>&copy; ${new Date().getFullYear()} VALL. All rights reserved.</p>
                    <p>
                        <a href="${process.env.BASE_URL}" style="color: #7f8c8d; text-decoration: none;">Visit our website</a> | 
                        <a href="${process.env.BASE_URL}/privacy" style="color: #7f8c8d; text-decoration: none;">Privacy Policy</a>
                    </p>
                </div>
            </div>
        `
    };

    await transporter.sendMail(mailOptions);
}
module.exports = { sendInterestNotification };
