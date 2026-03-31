const cron = require('node-cron');
const Product = require('../models/Product');
const NightMessFood = require('../models/NightMessFood');
const User = require('../models/user');
const emailService = require('./emal');

// ============ AUTO-MARK SOLD (3 HOUR TIMEOUT) ============
async function processAutoMarkSold() {
    const now = new Date();
    console.log(`[${new Date().toISOString()}] 🔄 Auto-mark sold check...`);
    
    // Process products
    const productsToMark = await Product.find({
        dealStatus: { $in: ['buyer_confirmed', 'seller_confirmed'] },
        autoMarkSoldAt: { $lte: now },
        status: { $nin: ['sold', 'expired'] }
    });
    
    for (const product of productsToMark) {
        product.dealStatus = 'both_confirmed';
        product.status = 'sold';
        product.soldDate = now;
        await product.save();
        
        // Notify parties
        const seller = await User.findById(product.seller);
        const buyer = product.dealConfirmations.find(
            conf => conf.user.toString() !== product.seller.toString()
        );
        if (buyer) {
            const buyerUser = await User.findById(buyer.user);
            await emailService.sendAutoSoldNotification(product, seller, buyerUser);
        }
    }
    
    // Process night mess items
    const itemsToMark = await NightMessFood.find({
        dealStatus: { $in: ['buyer_confirmed', 'vendor_confirmed'] },
        autoMarkSoldAt: { $lte: now },
        status: { $nin: ['sold_out', 'expired'] }
    });
    
    for (const item of itemsToMark) {
        item.dealStatus = 'both_confirmed';
        item.status = 'sold_out';
        item.soldDate = now;
        await item.save();
        
        const vendor = await User.findById(item.vendor);
        const buyer = item.dealConfirmations.find(
            conf => conf.user.toString() !== item.vendor.toString()
        );
        if (buyer) {
            const buyerUser = await User.findById(buyer.user);
            await emailService.sendAutoSoldNotification(item, vendor, buyerUser, true);
        }
    }
}

// ============ SEND REMINDERS (48 HOUR INTERVALS) ============
async function sendReminders() {
    const now = new Date();
    const fortyEightHoursAgo = new Date(now - 48 * 60 * 60 * 1000);
    
    // Process products
    const products = await Product.find({
        dealStatus: { $in: ['buyer_confirmed', 'seller_confirmed', 'pending'] },
        interestCreatedAt: { $lte: fortyEightHoursAgo },
        reminderCount: { $lt: 2 },
        status: { $nin: ['sold', 'expired'] }
    }).populate('seller').populate('interestedBuyers.user');
    
    for (const product of products) {
        const lastReminder = product.lastReminderSent;
        const shouldSend = !lastReminder || (now - lastReminder) >= 48 * 60 * 60 * 1000;
        
        if (shouldSend && product.interestedBuyers[0]) {
            await emailService.sendDealReminder(product, product.seller, product.interestedBuyers[0].user);
            product.lastReminderSent = now;
            product.reminderCount += 1;
            await product.save();
        }
        
        if (product.reminderCount >= 2) {
            product.dealStatus = 'expired';
            product.status = 'expired';
            await product.save();
        }
    }
    
    // Process night mess items
    const items = await NightMessFood.find({
        dealStatus: { $in: ['buyer_confirmed', 'vendor_confirmed', 'pending'] },
        interestCreatedAt: { $lte: fortyEightHoursAgo },
        reminderCount: { $lt: 2 },
        status: { $nin: ['sold_out', 'expired'] }
    }).populate('vendor').populate('interestedBuyers.user');
    
    for (const item of items) {
        const lastReminder = item.lastReminderSent;
        const shouldSend = !lastReminder || (now - lastReminder) >= 48 * 60 * 60 * 1000;
        
        if (shouldSend && item.interestedBuyers[0]) {
            await emailService.sendDealReminder(item, item.vendor, item.interestedBuyers[0].user, true);
            item.lastReminderSent = now;
            item.reminderCount += 1;
            await item.save();
        }
        
        if (item.reminderCount >= 2) {
            item.dealStatus = 'expired';
            item.status = 'expired';
            await item.save();
        }
    }
}

// ============ ARCHIVE STALE INTERESTS (10-15 DAYS) ============
async function archiveStaleInterests() {
    const now = new Date();
    const fifteenDaysAgo = new Date(now - 15 * 24 * 60 * 60 * 1000);
    
    // Products
    const staleProducts = await Product.find({
        interestCreatedAt: { $lte: fifteenDaysAgo },
        status: 'available',
        dealStatus: 'pending',
        $or: [
            { dealConfirmations: { $size: 0 } },
            { dealConfirmations: { $exists: false } }
        ]
    }).populate('seller');
    
    for (const product of staleProducts) {
        product.status = 'expired';
        product.dealStatus = 'expired';
        await product.save();
        
        if (product.seller) {
            await emailService.sendStaleInterestNotification(product, product.seller);
        }
    }
    
    // Night mess items
    const staleItems = await NightMessFood.find({
        interestCreatedAt: { $lte: fifteenDaysAgo },
        status: 'available',
        dealStatus: 'pending',
        $or: [
            { dealConfirmations: { $size: 0 } },
            { dealConfirmations: { $exists: false } }
        ]
    }).populate('vendor');
    
    for (const item of staleItems) {
        item.status = 'expired';
        item.dealStatus = 'expired';
        await item.save();
        
        if (item.vendor) {
            await emailService.sendStaleInterestNotification(item, item.vendor, true);
        }
    }
}

// ============ UPDATE AUTO-MARK TIMES ============
async function updateAutoMarkTimes() {
    // Products needing auto-mark time
    const products = await Product.find({
        dealStatus: { $in: ['buyer_confirmed', 'seller_confirmed'] },
        autoMarkSoldAt: null,
        status: { $nin: ['sold', 'expired'] }
    });
    
    for (const product of products) {
        product.autoMarkSoldAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
        await product.save();
    }
    
    // Night mess items
    const items = await NightMessFood.find({
        dealStatus: { $in: ['buyer_confirmed', 'vendor_confirmed'] },
        autoMarkSoldAt: null,
        status: { $nin: ['sold_out', 'expired'] }
    });
    
    for (const item of items) {
        item.autoMarkSoldAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
        await item.save();
    }
}

// ============ START ALL CRON JOBS ============
function startDealScheduler() {
    console.log('🚀 Starting Deal Scheduler...');
    
    // Auto-mark sold - every hour
    cron.schedule('0 * * * *', async () => {
        try {
            await processAutoMarkSold();
        } catch (error) {
            console.error('Auto-mark sold error:', error);
        }
    });
    
    // Reminders - every 6 hours
    cron.schedule('0 */6 * * *', async () => {
        try {
            await sendReminders();
        } catch (error) {
            console.error('Reminder error:', error);
        }
    });
    
    // Auto-mark time update - every hour at :30
    cron.schedule('30 * * * *', async () => {
        try {
            await updateAutoMarkTimes();
        } catch (error) {
            console.error('Auto-mark time update error:', error);
        }
    });
    
    // Stale interest archive - daily at midnight
    cron.schedule('0 0 * * *', async () => {
        try {
            await archiveStaleInterests();
        } catch (error) {
            console.error('Stale interest archive error:', error);
        }
    });
    
    console.log('✅ Deal Scheduler started');
}

module.exports = {
    startDealScheduler,
    processAutoMarkSold,
    sendReminders,
    archiveStaleInterests,
    updateAutoMarkTimes
};