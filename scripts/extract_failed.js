const fs = require('fs');
const path = require('path');

function extractFailedEmails() {
    const logPath = path.join(__dirname, 'delivery_log.json');
    const failedPath = path.join(__dirname, 'failed_emails.txt');
    
    try {
        const logData = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        const failedEmails = logData.details
            .filter(entry => entry.status === 'failed')
            .map(entry => entry.email);
        
        fs.writeFileSync(failedPath, failedEmails.join('\n'));
        console.log(`✅ Extracted ${failedEmails.length} failed emails to: ${failedPath}`);
    } catch (error) {
        console.error('❌ Error processing delivery log:', error.message);
    }
}

extractFailedEmails();
