const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');
const fs = require('fs');

async function sendBulkInvites() {
    console.log('🚀 Starting Bulk VMall Invite Script...');

    // 1. Configure Nodemailer
    console.log('Credentials Check:', {
        user: process.env.EMAIL_USERNAME ? 'LOADED' : 'MISSING',
        pass: process.env.EMAIL_PASSWORD ? 'LOADED' : 'MISSING'
    });

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // 2. Load the Email Template
    let templatePath = path.join(__dirname, 'inviteEmailTemplate.html');
    let htmlTemplate = '';
    try {
        htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
        console.error('❌ Failed to load HTML email template:', error);
        process.exit(1);
    }

    // 3. Load Recipients
    let recipientsPath = path.join(__dirname, 'recipients.txt');
    let emails = [];
    try {
        const rawContent = fs.readFileSync(recipientsPath, 'utf8');
        emails = [...new Set(rawContent.split('\n').map(e => e.trim()).filter(e => e.includes('@')))];
        console.log(`✅ Loaded ${emails.length} unique recipient emails.`);
    } catch (error) {
        console.error('❌ Failed to load recipients list:', error);
        process.exit(1);
    }

    if (emails.length === 0) {
        console.log('No recipients found. Exiting.');
        process.exit(0);
    }

    // 4. Sending process
    console.log(`📧 Starting to send emails to ${emails.length} recipients...`);
    let successCount = 0;
    let failCount = 0;
    const log = [];

    for (let i = 0; i < emails.length; i++) {
        const email = emails[i];
        
        let mailOptions = {
            from: `"VALL Ecosystem" <${process.env.EMAIL_USERNAME}>`,
            to: email,
            subject: '🚀 Welcome to VMall - Your New Digital Campus Marketplace!',
            html: htmlTemplate
        };

        try {
            await transporter.sendMail(mailOptions);
            successCount++;
            console.log(`[${i+1}/${emails.length}] ✅ Sent to: ${email}`);
            log.push({ email, status: 'success', timestamp: new Date().toISOString() });
        } catch (error) {
            failCount++;
            console.error(`[${i+1}/${emails.length}] ❌ Failed to send to: ${email}`, error.message);
            log.push({ email, status: 'failed', error: error.message, timestamp: new Date().toISOString() });
        }

        // Wait 1.5 seconds between emails to be extra safe with Gmail limits
        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // 5. Save Log
    const logPath = path.join(__dirname, 'delivery_log.json');
    fs.writeFileSync(logPath, JSON.stringify({
        summary: { total: emails.length, success: successCount, failed: failCount },
        details: log
    }, null, 2));

    console.log('----------------------------------------------------');
    console.log('🎉 Bulk broadcast completed!');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📄 Log saved to: scripts/delivery_log.json`);
}

sendBulkInvites();
