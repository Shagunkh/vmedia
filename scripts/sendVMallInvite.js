require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const User = require('../models/user'); // Check path depending on where script runs

async function sendVMallInvites() {
    console.log('🚀 Starting VMall Invite Email Script...');

    // 1. Connect to MongoDB
    try {
        await mongoose.connect(process.env.ATLASDB_URL);
        console.log('✅ Connected to MongoDB');
    } catch (error) {
        console.error('❌ Failed to connect to MongoDB:', error);
        process.exit(1);
    }

    // 2. Fetch all users
    let users = [];
    try {
        users = await User.find({ email: { $exists: true, $ne: "" } });
        console.log(`✅ Found ${users.length} users with email addresses.`);
    } catch (error) {
        console.error('❌ Failed to fetch users:', error);
        process.exit(1);
    }

    if (users.length === 0) {
        console.log('No users to send emails to. Exiting.');
        process.exit(0);
    }

    // 3. Configure Nodemailer
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD
        }
    });

    // 4. Load the Email Template
    let templatePath = path.join(__dirname, 'inviteEmailTemplate.html');
    let htmlTemplate = '';
    try {
        htmlTemplate = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
        console.error('❌ Failed to load HTML email template from:', templatePath, error);
        process.exit(1);
    }

    // 5. Optionally, ask for confirmation or test (Here we just do a dry-run by Default)
    const isDryRun = process.argv.includes('--dry-run');
    if (isDryRun) {
        console.log('----------------------------------------------------');
        console.log('🛑 DRY RUN MODE ACTIVE - No real emails will be sent.');
        console.log(`Would have sent to ${users.length} users:`);
        users.slice(0, 5).forEach((u, i) => console.log(`  ${i+1}. ${u.email}`));
        if (users.length > 5) console.log(`  ... and ${users.length - 5} more.`);
        console.log('To actually send, run: node sendVMallInvite.js --send');
        console.log('----------------------------------------------------');
        process.exit(0);
    }

    const isSend = process.argv.includes('--send');
    if (!isSend) {
        console.log('Please run with --dry-run to test or --send to actually send emails.');
        process.exit(0);
    }

    // 6. Send Emails (Using a delay to avoid rate limits from Gmail)
    console.log(`📧 Starting to send emails to ${users.length} users...`);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < users.length; i++) {
        const user = users[i];
        
        let mailOptions = {
            from: `"VALL Ecosystem" <${process.env.EMAIL_USERNAME}>`,
            to: user.email,
            subject: '🚀 Welcome to VMall - Your New Digital Campus Marketplace!',
            html: htmlTemplate
        };

        try {
            await transporter.sendMail(mailOptions);
            successCount++;
            console.log(`[${i+1}/${users.length}] ✅ Sent to: ${user.email}`);
        } catch (error) {
            failCount++;
            console.error(`[${i+1}/${users.length}] ❌ Failed to send to: ${user.email}`, error.message);
        }

        // Wait 1 second between emails to prevent Google blocking (Basic rate limiting)
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('----------------------------------------------------');
    console.log('🎉 Email broadcast completed!');
    console.log(`✅ Success: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    
    mongoose.disconnect();
}

sendVMallInvites();
