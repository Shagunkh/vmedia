const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
    service: 'Gmail', // or your email service
    auth: {
        user: "vitforall2025@gmail.com",
        pass: "oxdfqvuwkzxqyylo"
    }
});

// Function to send welcome email
const sendWelcomeEmail = async (email, username) => {
    try {
        const mailOptions = {
            from: `"VALL Team" <${process.env.EMAIL_USERNAME}>`,
            to: email,
            subject: 'Welcome to VALL - Your Complete VITian Ecosystem!',
            html: `
                <div style="font-family: 'Poppins', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0a0a12; color: #f0f8ff; border-radius: 10px; border: 1px solid #00d8ff;">
                    <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #00d8ff; font-size: 28px; margin-bottom: 10px;">Welcome to VALL, ${username}!</h1>
                        <p style="color: #a0b8d0; font-size: 16px;">Your all-in-one VITian platform is ready</p>
                    </div>
                    
                    <!-- FFCS Highlight Section -->
                    <div style="background: linear-gradient(135deg, rgba(0,216,255,0.2), rgba(0,140,255,0.2)); padding: 20px; border-radius: 8px; margin-bottom: 25px; border: 2px solid #00d8ff; text-align: center;">
                        <h2 style="color: #00d8ff; font-size: 24px; margin-top: 0; margin-bottom: 10px; text-transform: uppercase;">FFCS SEASON IS HERE!</h2>
                        <p style="color: #ffffff; font-size: 18px; font-weight: 600; margin-bottom: 15px;">YOU HAVEN'T FINALIZED YOUR FFCS YET</p>
                        <p style="color: #a0b8d0; font-size: 16px; margin-bottom: 20px;">For who are you waiting? Go and finalize your FFCS with VALL's smart planner!</p>
                        <a href="${process.env.BASE_URL}/ffcs-planner" 
                           style="display: inline-block; padding: 10px 20px; background: linear-gradient(135deg, #00d8ff, #008cff); 
                           color: #111; text-decoration: none; border-radius: 6px; font-weight: 600;">
                            Plan Your FFCS Now
                        </a>
                    </div>
                    
                    <div style="background: rgba(20, 25, 40, 0.8); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h2 style="color: #00d8ff; font-size: 22px; text-align: center; margin-bottom: 15px;">Explore Your VITian Ecosystem</h2>
                        
                        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-top: 20px;">
                            <!-- Feature Boxes with consistent spacing -->
                            <div style="background: rgba(0, 216, 255, 0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #00d8ff; margin-bottom: 0;">
                                <h3 style="color: #00d8ff; margin-top: 0; font-size: 18px;">CGPA/GPA Calculator</h3>
                                <p style="color: #a0b8d0; font-size: 14px; margin-bottom: 0;">Track and plan your academic performance</p>
                            </div>
                            
                            <div style="background: rgba(0, 216, 255, 0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #00d8ff; margin-bottom: 0;">
                                <h3 style="color: #00d8ff; margin-top: 0; font-size: 18px;">Study Planner</h3>
                                <p style="color: #a0b8d0; font-size: 14px; margin-bottom: 0;">AI-powered scheduling for optimal study sessions</p>
                            </div>
                            
                            <div style="background: rgba(0, 216, 255, 0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #00d8ff; margin-bottom: 0;">
                                <h3 style="color: #00d8ff; margin-top: 0; font-size: 18px;">Flashcards & Quizlets</h3>
                                <p style="color: #a0b8d0; font-size: 14px; margin-bottom: 0;">Enhanced learning with spaced repetition</p>
                            </div>
                            
                            <div style="background: rgba(0, 216, 255, 0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #00d8ff; margin-bottom: 0;">
                                <h3 style="color: #00d8ff; margin-top: 0; font-size: 18px;">Roommate Finder</h3>
                                <p style="color: #a0b8d0; font-size: 14px; margin-bottom: 0;">Algorithmic matching for perfect roommates</p>
                            </div>
                            
                            <div style="background: rgba(0, 216, 255, 0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #00d8ff; margin-bottom: 0;">
                                <h3 style="color: #00d8ff; margin-top: 0; font-size: 18px;">Confessions Wall</h3>
                                <p style="color: #a0b8d0; font-size: 14px; margin-bottom: 0;">Anonymous sharing with community support</p>
                            </div>
                            
                            <div style="background: rgba(0, 216, 255, 0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #00d8ff; margin-bottom: 0;">
                                <h3 style="color: #00d8ff; margin-top: 0; font-size: 18px;">Lost & Found</h3>
                                <p style="color: #a0b8d0; font-size: 14px; margin-bottom: 0;">Campus-wide board for lost items</p>
                            </div>
                            
                            <div style="background: rgba(0, 216, 255, 0.15); padding: 15px; border-radius: 8px; border-left: 3px solid #00d8ff; margin-bottom: 0; box-shadow: 0 0 15px rgba(0,216,255,0.3);">
                                <h3 style="color: #00d8ff; margin-top: 0; font-size: 18px;">FFCS Planner ★</h3>
                                <p style="color: #a0b8d0; font-size: 14px; margin-bottom: 0;">Optimal course selection with professor ratings</p>
                            </div>
                            
                            <div style="background: rgba(0, 216, 255, 0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #00d8ff; margin-bottom: 0;">
                                <h3 style="color: #00d8ff; margin-top: 0; font-size: 18px;">Faculty Review</h3>
                                <p style="color: #a0b8d0; font-size: 14px; margin-bottom: 0;">Make informed course selection decisions</p>
                            </div>
                            
                            <div style="background: rgba(0, 216, 255, 0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #00d8ff; margin-bottom: 0;">
                                <h3 style="color: #00d8ff; margin-top: 0; font-size: 18px;">Previous Year Papers</h3>
                                <p style="color: #a0b8d0; font-size: 14px; margin-bottom: 0;">Access to comprehensive exam resources</p>
                            </div>
                            
                            <div style="background: rgba(0, 216, 255, 0.1); padding: 15px; border-radius: 8px; border-left: 3px solid #00d8ff; margin-bottom: 0;">
                                <h3 style="color: #00d8ff; margin-top: 0; font-size: 18px;">Collab Requests</h3>
                                <p style="color: #a0b8d0; font-size: 14px; margin-bottom: 0;">Find project partners across disciplines</p>
                            </div>
                        </div>
                    </div>
                    
                    <div style="background: rgba(20, 25, 40, 0.8); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h2 style="color: #00d8ff; font-size: 22px; text-align: center; margin-bottom: 15px;">Announcements & Latest Updates</h2>
                        <p style="color: #a0b8d0; font-size: 16px; text-align: center;">
                            Stay tuned for important campus updates, event notifications, and feature enhancements!
                        </p>
                    </div>
                    
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="${process.env.BASE_URL}/dashboard" 
                           style="display: inline-block; padding: 12px 25px; background: linear-gradient(135deg, #00d8ff, #008cff); 
                           color: #111; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 10px;">
                            Go to Your Dashboard
                        </a>
                    </div>
                    
                    <div style="margin-top: 30px; text-align: center; color: #a0b8d0; font-size: 14px;">
                        <p>If you didn't create this account, please ignore this email.</p>
                        <p>© ${new Date().getFullYear()} VALL - VIT for ALL</p>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Welcome email sent to ${email}`);
    } catch (error) {
        console.error('Error sending welcome email:', error);
    }
};
module.exports = { sendWelcomeEmail };
