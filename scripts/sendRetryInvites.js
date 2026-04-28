const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const nodemailer = require('nodemailer');
const fs = require('fs');

async function sendRetryInvites() {
    console.log('🚀 Starting Retry Invite Script...');

    // 1. Configure Nodemailer
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

    // 3. Load Failed Recipients
    let recipientsPath = path.join(__dirname, 'failed_emails.txt');
    let emails = [];
    try {
        const rawContent = fs.readFileSync(recipientsPath, 'utf8');
        emails = rawContent.split('\n').map(e => e.trim()).filter(e => e.includes('@'));
        console.log(`✅ Loaded ${emails.length} recipients for retry.`);
    } catch (error) {
        console.error('❌ Failed to load retry list:', error);
        process.exit(1);
    }

    if (emails.length === 0) {
        console.log('No recipients found for retry. Exiting.');
        process.exit(0);
    }

    // 4. Batching
    const limitIdx = process.argv.indexOf('--limit');
    let limit = (limitIdx !== -1) ? parseInt(process.argv[limitIdx + 1]) : emails.length;
    const startIdx = process.argv.indexOf('--start');
    let start = (startIdx !== -1) ? parseInt(process.argv[startIdx + 1]) : 0;

    let targetBatch = emails.slice(start, start + limit);
    console.log(`📧 Attempting to send to ${targetBatch.length} recipients (Start: ${start}, Limit: ${limit})...`);

    // 5. Sending process
    let successCount = 0;
    let failCount = 0;
    const log = [];

    for (let i = 0; i < targetBatch.length; i++) {
        const email = targetBatch[i];
        
        let mailOptions = {
            from: `"VALL Ecosystem" <${process.env.EMAIL_USERNAME}>`,
            to: email,
            subject: '🚀 Welcome to VMall - Your New Digital Campus Marketplace!',
            html: htmlTemplate
        };

        try {
            await transporter.sendMail(mailOptions);
            successCount++;
            console.log(`[${i+1}/${targetBatch.length}] ✅ Sent to: ${email}`);
            log.push({ email, status: 'success', timestamp: new Date().toISOString() });
        } catch (error) {
            failCount++;
            console.error(`[${i+1}/${targetBatch.length}] ❌ Failed to send to: ${email}`, error.message);
            log.push({ email, status: 'failed', error: error.message, timestamp: new Date().toISOString() });
        }

        await new Promise(resolve => setTimeout(resolve, 1500));
    }

    // 6. Save Append Log
    const logPath = path.join(__dirname, 'retry_log.json');
    let existingLog = { summary: { success: 0, failed: 0 }, details: [] };
    if (fs.existsSync(logPath)) {
        existingLog = JSON.parse(fs.readFileSync(logPath, 'utf8'));
    }
    
    existingLog.summary.success += successCount;
    existingLog.summary.failed += failCount;
    existingLog.details.push(...log);
    
    fs.writeFileSync(logPath, JSON.stringify(existingLog, null, 2));

    console.log('----------------------------------------------------');
    console.log('🎉 Retry batch completed!');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📄 Results appended to: scripts/retry_log.json`);
}

sendRetryInvites();
