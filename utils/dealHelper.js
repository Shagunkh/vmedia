const Product = require('../models/Product');
const NightMessFood = require('../models/NightMessFood');
const User = require('../models/user');
const emailService = require('./emal');

// ============ DEAL HELPER FUNCTIONS ============

// Add deal confirmation from user
async function addDealConfirmation(item, userId, role, isFood = false) {
    // Check if user already confirmed
    const alreadyConfirmed = item.dealConfirmations.some(
        conf => conf.user.toString() === userId.toString()
    );
    
    if (alreadyConfirmed) {
        return { success: false, message: 'You already confirmed this deal' };
    }
    
    // Add confirmation
    item.dealConfirmations.push({ user: userId });
    
    // Update deal status
    if (item.dealConfirmations.length === 2) {
        // Both confirmed
        item.dealStatus = 'both_confirmed';
        item.status = isFood ? 'sold_out' : 'sold';
        item.soldDate = new Date();
        
        // Set buyer if not already set
        if (!item.buyer) {
            const otherUser = item.dealConfirmations.find(
                conf => conf.user.toString() !== (isFood ? item.vendor.toString() : item.seller.toString())
            );
            if (otherUser) {
                item.buyer = otherUser.user;
            }
        }
        
        await item.save();
        
        // Send email notifications
        const seller = await User.findById(isFood ? item.vendor : item.seller);
        const buyer = await User.findById(item.buyer);
        
        if (seller && buyer) {
            await emailService.sendAutoSoldNotification(item, seller, buyer, isFood);
        }
        
        return { success: true, dealStatus: 'both_confirmed', bothConfirmed: true };
        
    } else {
        // One confirmed - set auto-mark time
        if (role === 'buyer') {
            item.dealStatus = isFood ? 'buyer_confirmed' : 'buyer_confirmed';
        } else {
            item.dealStatus = isFood ? 'vendor_confirmed' : 'seller_confirmed';
        }
        
        // Set auto-mark time (3 hours from now)
        item.autoMarkSoldAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
        await item.save();
        
        return { 
            success: true, 
            dealStatus: item.dealStatus, 
            bothConfirmed: false,
            autoMarkSoldAt: item.autoMarkSoldAt
        };
    }
}

// Get deal status
async function getDealStatus(item, userId, isFood = false) {
    const userConfirmed = item.dealConfirmations.some(
        conf => conf.user.toString() === userId.toString()
    );
    
    return {
        dealStatus: item.dealStatus,
        status: item.status,
        userConfirmed: userConfirmed,
        bothConfirmed: item.dealConfirmations.length === 2,
        autoMarkSoldAt: item.autoMarkSoldAt,
        interestCreatedAt: item.interestCreatedAt,
        reminderCount: item.reminderCount
    };
}

// Check if deal is stale (no confirmation after 10 days)
function isDealStale(item) {
    if (!item.interestCreatedAt) return false;
    const daysSinceInterest = (Date.now() - item.interestCreatedAt) / (1000 * 60 * 60 * 24);
    return daysSinceInterest >= 10;
}

// Get interested user (buyer)
function getInterestedBuyer(item) {
    if (item.interestedBuyers && item.interestedBuyers.length > 0) {
        return item.interestedBuyers[0].user;
    }
    return null;
}

// Get seller/vendor
function getSeller(item, isFood = false) {
    return isFood ? item.vendor : item.seller;
}

module.exports = {
    addDealConfirmation,
    getDealStatus,
    isDealStale,
    getInterestedBuyer,
    getSeller
};