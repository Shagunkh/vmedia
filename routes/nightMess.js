const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const NightMessFood = require('../models/NightMessFood');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/user');
const emailService = require('../utils/emailService');
const { storage, cloudinary } = require("../cloudConfig");

// Helper function to generate consistent chat room ID
function generateChatRoomId(itemId, user1Id, user2Id) {
    const ids = [user1Id.toString(), user2Id.toString()].sort();
    return `nightmess_${itemId}_${ids[0]}_${ids[1]}`;
}

// Check if night mess is open (10:25 PM to 3:00 AM IST)
function isNightMessOpen() {
    // Get current time reliably in IST format regardless of server timezone
    const now = new Date();
    const istOptions = { timeZone: 'Asia/Kolkata', hour12: false, hour: 'numeric', minute: 'numeric' };
    const istTimeFormatter = new Intl.DateTimeFormat('en-US', istOptions);
    const parts = istTimeFormatter.formatToParts(now);
    
    let hours = 0;
    let minutes = 0;
    
    for (const part of parts) {
        if (part.type === 'hour') hours = parseInt(part.value, 10);
        if (part.type === 'minute') minutes = parseInt(part.value, 10);
    }
    
    // In Intl.DateTimeFormat hour="numeric" and hour12=false, 24:00 is sometimes output as 24 
    if (hours === 24) hours = 0;

    const totalMinutes = hours * 60 + minutes;

    // Open: 22:25 (1345 mins) to 23:59, and 00:00 to 03:00 (180 mins)
    const openStart = 22 * 60 + 25; // 22:25
    const openEnd   =  3 * 60 + 0;  // 03:00

    return totalMinutes >= openStart || totalMinutes <= openEnd; // Changed to <= to include exactly 3:00 AM
}

// Authentication middleware
const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'You need to login first!');
        return res.redirect('/users/login');
    }
    next();
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'), false);
        }
    }
});

// ============ PUBLIC ROUTES ============

// Get all available food stalls
router.get('/', async (req, res) => {
    try {
        const { hostelBlock, search, category, hostelType } = req.query;
        let filter = { status: 'available' };
        
        if (hostelBlock && hostelBlock !== '') filter.hostelBlock = hostelBlock.toUpperCase();
        if (category && category !== '') filter.category = category;
        
        if (hostelType && hostelType !== '') {
            filter.hostelType = hostelType;
        }
        
        if (search) {
            filter.$or = [
                { vendorName: { $regex: search, $options: 'i' } },
                { 'menuItems.itemName': { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } }
            ];
        }
        
        const items = await NightMessFood.find(filter)
            .populate('vendor', 'username profilePhoto email')
            .sort({ createdAt: -1 });
            
        const categories = ['Snacks', 'Beverages', 'Meals', 'Desserts', 'Burgers', 'Pizza', 'Others'];
        const hostelBlocks = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
        
        const isOpen = isNightMessOpen();
        
        res.render('nightmess/index', { 
            items, 
            categories,
            hostelBlocks,
            filters: req.query,
            currUser: req.user,
            searchQuery: search || '',
            isOpen: isOpen
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading night mess items');
        res.redirect('/');
    }
});

// Get food stall details
router.get('/item/:id', async (req, res) => {
    try {
        const item = await NightMessFood.findById(req.params.id)
            .populate('vendor', 'username profilePhoto email')
            .populate('interestedBuyers.user', 'username');
            
        if (!item) {
            req.flash('error', 'Item not found');
            return res.redirect('/nightmess');
        }
        
        item.views += 1;
        await item.save();
        
        const similarItems = await NightMessFood.find({
            hostelBlock: item.hostelBlock,
            status: 'available',
            _id: { $ne: item._id }
        })
        .populate('vendor', 'username')
        .limit(4);
        
        let hasInterested = false;
        let existingChatRoom = null;
        let interestedBuyersWithChat = [];
        let userConfirmed = false;
        let dealStatus = item.dealStatus;
        
        if (req.user) {
            hasInterested = item.interestedBuyers.some(
                i => i.user && i.user._id && i.user._id.toString() === req.user._id.toString()
            );
            
            if (item.chatRooms && item.chatRooms.length > 0) {
                const existingRoom = item.chatRooms.find(
                    room => room.user && room.user.toString() === req.user._id.toString()
                );
                if (existingRoom) {
                    existingChatRoom = existingRoom.roomId;
                }
            }
            
            // For seller - get interested buyers with chat info
            if (item.vendor._id.toString() === req.user._id.toString() && item.interestedBuyers && item.interestedBuyers.length > 0) {
                const buyerIds = item.interestedBuyers.map(b => b.user);
                const buyers = await User.find({
                    _id: { $in: buyerIds }
                }).select('username profilePhoto email');
                
                interestedBuyersWithChat = buyers.map(buyer => {
                    const chatRoom = item.chatRooms.find(
                        room => room.user && room.user.toString() === buyer._id.toString()
                    );
                    return {
                        user: buyer,
                        chatRoomId: chatRoom ? chatRoom.roomId : null,
                        lastMessage: chatRoom ? chatRoom.lastMessage : null,
                        unreadCount: chatRoom ? chatRoom.unreadCount : 0
                    };
                });
            }
            
            // Check if user already confirmed the deal
            userConfirmed = item.dealConfirmations && item.dealConfirmations.some(
                conf => conf.user.toString() === req.user._id.toString()
            );
        }
        
        const returnTo = `/nightmess/item/${item._id}`;
        const isOpen = isNightMessOpen();
        
        res.render('nightmess/item-details', {
            item,
            similarItems,
            hasInterested,
            existingChatRoom,
            interestedBuyersWithChat,
            currUser: req.user,
            returnTo,
            isOpen,
            userConfirmed,
            dealStatus
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading item');
        res.redirect('/nightmess');
    }
});

// ============ PROTECTED ROUTES ============

// Add item form
router.get('/add-item', isLoggedIn, (req, res) => {
    const hostelBlocks = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
    res.render('nightmess/add-item', { 
        currUser: req.user,
        hostelBlocks
    });
});

// Add item
router.post('/add-item', isLoggedIn, upload.array('images', 5), async (req, res) => {
    try {
        const { vendorName, category, hostelBlock, hostelType, vendorPhone, vendorEmail, menuItems } = req.body;
        
        const images = req.files ? req.files.map(file => ({
            url: file.path,
            public_id: file.filename
        })) : [];
        
        if (images.length === 0) {
            req.flash('error', 'Please upload at least one image');
            return res.redirect('/nightmess/add-item');
        }
        
        let parsedMenuItems = [];
        if (menuItems && Array.isArray(menuItems)) {
            parsedMenuItems = menuItems.filter(item => item.itemName && item.price);
        } else if (menuItems && typeof menuItems === 'object') {
            parsedMenuItems = Object.values(menuItems).filter(item => item.itemName && item.price);
        }
        
        if (parsedMenuItems.length === 0) {
            req.flash('error', 'Please add at least one menu item');
            return res.redirect('/nightmess/add-item');
        }
        
        const item = new NightMessFood({
            vendorName,
            category,
            hostelBlock: hostelBlock.toUpperCase(),
            hostelType,
            menuItems: parsedMenuItems,
            images,
            vendor: req.user._id,
            vendorPhone,
            vendorEmail,
            chatRooms: []
        });
        
        await item.save();
        
        req.flash('success', 'Food stall added successfully!');
        res.redirect('/nightmess/my-items');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error adding item: ' + error.message);
        res.redirect('/nightmess/add-item');
    }
});

// My items (vendor view)
router.get('/my-items', isLoggedIn, async (req, res) => {
    try {
        const items = await NightMessFood.find({ vendor: req.user._id })
            .sort({ createdAt: -1 });
            
        res.render('nightmess/my-items', { 
            items,
            currUser: req.user
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading your items');
        res.redirect('/');
    }
});

// Edit item form
router.get('/edit-item/:id', isLoggedIn, async (req, res) => {
    try {
        const item = await NightMessFood.findById(req.params.id);
        
        if (!item) {
            req.flash('error', 'Item not found');
            return res.redirect('/nightmess/my-items');
        }
        
        if (item.vendor.toString() !== req.user._id.toString()) {
            req.flash('error', 'You can only edit your own items');
            return res.redirect('/nightmess/my-items');
        }
        
        const hostelBlocks = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
        
        res.render('nightmess/edit-item', { 
            item,
            currUser: req.user,
            hostelBlocks
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading item');
        res.redirect('/nightmess/my-items');
    }
});

// Edit item
router.put('/edit-item/:id', isLoggedIn, upload.array('images', 5), async (req, res) => {
    try {
        const item = await NightMessFood.findById(req.params.id);
        
        if (!item) {
            req.flash('error', 'Item not found');
            return res.redirect('/nightmess/my-items');
        }
        
        if (item.vendor.toString() !== req.user._id.toString()) {
            req.flash('error', 'You can only edit your own items');
            return res.redirect('/nightmess/my-items');
        }
        
        const { vendorName, category, hostelBlock, hostelType, vendorPhone, vendorEmail, menuItems } = req.body;
        
        let parsedMenuItems = [];
        if (menuItems && Array.isArray(menuItems)) {
            parsedMenuItems = menuItems.filter(item => item.itemName && item.price);
        } else if (menuItems && typeof menuItems === 'object') {
            parsedMenuItems = Object.values(menuItems).filter(item => item.itemName && item.price);
        }
        
        item.vendorName = vendorName;
        item.category = category;
        item.hostelBlock = hostelBlock.toUpperCase();
        item.hostelType = hostelType;
        item.menuItems = parsedMenuItems;
        item.vendorPhone = vendorPhone;
        item.vendorEmail = vendorEmail;
        
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => ({
                url: file.path,
                public_id: file.filename
            }));
            item.images = [...item.images, ...newImages];
        }
        
        await item.save();
        
        req.flash('success', 'Food stall updated successfully!');
        res.redirect('/nightmess/my-items');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error updating item');
        res.redirect('/nightmess/my-items');
    }
});

// ============ VISIBILITY TOGGLE ROUTE ============
router.put('/item/:id/visibility', isLoggedIn, async (req, res) => {
    try {
        const { status } = req.body;
        console.log(`Attempting to toggle visibility for item ${req.params.id} to ${status}`);
        
        const item = await NightMessFood.findById(req.params.id);
        
        if (!item) {
            console.log(`Item ${req.params.id} not found`);
            return res.status(404).json({ error: 'Item not found' });
        }
        
        if (item.vendor.toString() !== req.user._id.toString()) {
            console.log(`Unauthorized: User ${req.user._id} is not vendor ${item.vendor}`);
            return res.status(403).json({ error: 'Unauthorized - You can only edit your own items' });
        }
        
        item.status = status;
        await item.save();
        
        console.log(`✅ Night mess item ${item._id} visibility toggled to: ${status}`);
        
        res.json({ success: true, status: item.status });
    } catch (error) {
        console.error('Error updating visibility:', error);
        res.status(500).json({ error: 'Error updating visibility: ' + error.message });
    }
});

// Delete item
router.delete('/item/:id', isLoggedIn, async (req, res) => {
    try {
        const item = await NightMessFood.findById(req.params.id);
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        if (item.vendor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You can only delete your own items' });
        }
        
        // Delete images from Cloudinary
        if (item.images && item.images.length > 0) {
            for (const image of item.images) {
                if (image.public_id) {
                    await cloudinary.uploader.destroy(image.public_id);
                }
            }
        }
        
        await NightMessFood.findByIdAndDelete(req.params.id);
        
        res.json({ success: 'Item deleted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting item' });
    }
});

// Mark as closed (legacy)
router.post('/item/:id/mark-sold', isLoggedIn, async (req, res) => {
    try {
        const item = await NightMessFood.findById(req.params.id);
        
        if (!item) {
            req.flash('error', 'Item not found');
            return res.redirect('/nightmess');
        }
        
        if (item.vendor.toString() !== req.user._id.toString()) {
            req.flash('error', 'You can only mark your own items as closed');
            return res.redirect(`/nightmess/item/${item._id}`);
        }
        
        const { buyerId } = req.body;
        
        if (!buyerId) {
            req.flash('error', 'Please select a buyer');
            return res.redirect(`/nightmess/item/${item._id}`);
        }
        
        item.status = 'sold_out';
        await item.save();
        
        const buyer = await User.findById(buyerId);
        if (buyer && buyer.email) {
            console.log(`Notification sent to buyer: ${buyer.email}`);
        }
        
        req.flash('success', 'Stall marked as closed!');
        res.redirect('/nightmess/my-items');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error marking item as closed');
        res.redirect(`/nightmess/item/${req.params.id}`);
    }
});

// ============ DEAL CONFIRMATION ROUTES ============

// Deal confirmation route for night mess items
router.post('/item/:id/deal-confirm', isLoggedIn, async (req, res) => {
    try {
        const item = await NightMessFood.findById(req.params.id);
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        if (item.status === 'sold_out') {
            return res.status(400).json({ error: 'This stall is already closed' });
        }
        
        const userIdStr = req.user._id.toString();
        let role;
        if (item.vendor.toString() === userIdStr) {
            role = 'vendor';
        } else if (item.interestedBuyers.some(b => b.user.toString() === userIdStr)) {
            role = 'buyer';
        } else {
            return res.status(403).json({ error: 'You are not involved in this deal' });
        }
        
        const buyerId = req.body.buyerId || null;
        const result = await item.addDealConfirmation(req.user._id, role, buyerId);
        
        if (result.queued) {
            return res.json({
                success: false,
                queued: true,
                message: result.message,
                sellerPhone: result.sellerPhone,
                sellerEmail: result.sellerEmail
            });
        }
        
        if (result.success) {
            const io = req.app.get('io');
            
            if (result.bothConfirmed) {
                const vendor = await User.findById(item.vendor);
                const buyerUser = await User.findById(item.buyer);
                
                if (io) {
                    io.to(`user_${item.vendor}`).emit('deal-confirmation', {
                        productId: item._id, productTitle: item.vendorName,
                        dealStatus: result.dealStatus, confirmedBy: req.user.username, bothConfirmed: true, type: 'nightmess'
                    });
                    io.to(`user_${item.buyer}`).emit('deal-confirmation', {
                        productId: item._id, productTitle: item.vendorName,
                        dealStatus: result.dealStatus, confirmedBy: req.user.username, bothConfirmed: true, type: 'nightmess'
                    });
                    item.queuedBuyers.forEach(qb => {
                        io.to(`user_${qb.user}`).emit('deal-sold', { productId: item._id, productTitle: item.vendorName });
                    });
                }
                
                if (vendor && buyerUser) {
                    emailService.sendAutoSoldNotification(item, vendor, buyerUser, true).catch(err => {
                        console.error('Failed to send sold notification:', err);
                    });
                }
            } else {
                const otherUser = role === 'buyer' ? item.vendor : item.pendingDealWith;
                if (io && otherUser) {
                    io.to(`user_${otherUser}`).emit('deal-confirmation', {
                        productId: item._id, productTitle: item.vendorName,
                        dealStatus: result.dealStatus, confirmedBy: req.user.username, bothConfirmed: false, type: 'nightmess'
                    });
                }
            }
            
            res.json({ 
                success: true, 
                dealStatus: result.dealStatus,
                bothConfirmed: result.bothConfirmed,
                message: result.bothConfirmed ? 'Deal confirmed! Stall marked as closed.' : 'Confirmation recorded. Waiting for other party.'
            });
        } else {
            res.json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('Error confirming deal:', error);
        res.status(500).json({ error: 'Error confirming deal' });
    }
});

// Cancel a deal for night mess
router.post('/item/:id/deal-cancel', isLoggedIn, async (req, res) => {
    try {
        const item = await NightMessFood.findById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        
        const result = await item.cancelDeal(req.user._id);
        
        if (result.success) {
            const io = req.app.get('io');
            if (io && result.cancelledWith) {
                io.to(`user_${result.cancelledWith}`).emit('deal-cancelled', { productId: item._id, productTitle: item.vendorName, cancelledBy: req.user.username });
                io.to(`user_${item.vendor}`).emit('deal-cancelled', { productId: item._id, productTitle: item.vendorName, cancelledBy: req.user.username });
            }
            if (io && result.queuedBuyers && result.queuedBuyers.length > 0) {
                result.queuedBuyers.forEach(qb => {
                    io.to(`user_${qb.user}`).emit('product-available-again', {
                        productId: item._id,
                        productTitle: item.vendorName,
                        message: `Good news! The stall "${item.vendorName}" you were waiting for is now available again.`
                    });
                });
            }
            res.json({ success: true, message: 'Deal cancelled successfully.' });
        } else {
            res.json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('Error cancelling deal:', error);
        res.status(500).json({ error: 'Error cancelling deal' });
    }
});

// Revert interest for night mess
router.post('/item/:id/interest-revert', isLoggedIn, async (req, res) => {
    try {
        const item = await NightMessFood.findById(req.params.id);
        if (!item) return res.status(404).json({ error: 'Item not found' });
        
        const userIdStr = req.user._id.toString();
        if (item.status === 'sold_out') return res.status(400).json({ error: 'Cannot revert interest after stall is closed.' });
        
        const isInterested = item.interestedBuyers.some(i => i.user && i.user.toString() === userIdStr);
        if (!isInterested) return res.status(400).json({ error: 'You have not shown interest in this stall.' });
        
        const isPendingBuyer = item.pendingDealWith && item.pendingDealWith.toString() === userIdStr;
        let cancelResult = null;
        if (isPendingBuyer) {
            cancelResult = await item.cancelDeal(req.user._id);
        }
        
        item.interestedBuyers = item.interestedBuyers.filter(i => i.user && i.user.toString() !== userIdStr);
        item.queuedBuyers = item.queuedBuyers.filter(q => q.user && q.user.toString() !== userIdStr);
        await item.save();
        
        const io = req.app.get('io');
        if (isPendingBuyer && cancelResult && cancelResult.success && io) {
            cancelResult.queuedBuyers.forEach(qb => {
                if (qb.user.toString() !== userIdStr) {
                    io.to(`user_${qb.user}`).emit('product-available-again', {
                        productId: item._id, productTitle: item.vendorName,
                        message: `Good news! The stall "${item.vendorName}" you were waiting for is now available again.`
                    });
                }
            });
            io.to(`user_${item.vendor}`).emit('deal-cancelled', { productId: item._id, productTitle: item.vendorName, cancelledBy: req.user.username });
        }
        
        res.json({ success: true, message: 'Interest removed successfully.' });
    } catch (error) {
        console.error('Error reverting interest:', error);
        res.status(500).json({ error: 'Error reverting interest' });
    }
});

// Get deal status for night mess item
router.get('/item/:id/deal-status', isLoggedIn, async (req, res) => {
    try {
        const item = await NightMessFood.findById(req.params.id);
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        const userIdStr = req.user._id.toString();
        const userConfirmed = item.dealConfirmations && item.dealConfirmations.some(conf => conf.user.toString() === userIdStr);
        const isQueued = item.queuedBuyers && item.queuedBuyers.some(q => q.user.toString() === userIdStr);
        const isBlocked = item.pendingDealWith && item.pendingDealWith.toString() !== userIdStr && item.vendor.toString() !== userIdStr;
        const isPendingBuyer = item.pendingDealWith && item.pendingDealWith.toString() === userIdStr;
        
        res.json({
            dealStatus: item.dealStatus,
            status: item.status,
            userConfirmed,
            bothConfirmed: item.dealStatus === 'both_confirmed',
            autoMarkSoldAt: item.autoMarkSoldAt,
            interestCreatedAt: item.interestCreatedAt,
            isQueued,
            isBlocked,
            isPendingBuyer,
            sellerPhone: item.vendorPhone,
            sellerEmail: item.vendorEmail
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching deal status' });
    }
});

// ============ CHAT ROUTES ============

// Get chat messages for a food stall
router.get('/chat/:itemId/:userId', isLoggedIn, async (req, res) => {
    try {
        const { itemId, userId } = req.params;
        const item = await NightMessFood.findById(itemId);
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        const consistentRoomId = generateChatRoomId(itemId, req.user._id, userId);
        
        let chatRoom = null;
        if (item.chatRooms && item.chatRooms.length > 0) {
            chatRoom = item.chatRooms.find(room => room.roomId === consistentRoomId);
        }
        
        if (!chatRoom) {
            chatRoom = {
                user: userId,
                roomId: consistentRoomId,
                lastMessage: null,
                lastMessageTime: new Date(),
                unreadCount: 0
            };
            
            if (!item.chatRooms) item.chatRooms = [];
            item.chatRooms.push(chatRoom);
            await item.save();
        }
        
        const messages = await ChatMessage.find({ roomId: consistentRoomId })
            .populate('sender', 'username profilePhoto')
            .sort({ createdAt: 1 });
        
        await ChatMessage.updateMany(
            { 
                roomId: consistentRoomId, 
                receiver: req.user._id, 
                read: false 
            },
            { read: true, readAt: new Date() }
        );
        
        const room = item.chatRooms.find(r => r.roomId === consistentRoomId);
        if (room) {
            room.unreadCount = 0;
            await item.save();
        }
        
        // Include deal status in chat response
        const dealStatus = {
            dealStatus: item.dealStatus,
            bothConfirmed: item.dealConfirmations && item.dealConfirmations.length === 2,
            userConfirmed: item.dealConfirmations && item.dealConfirmations.some(
                conf => conf.user.toString() === req.user._id.toString()
            ),
            autoMarkSoldAt: item.autoMarkSoldAt
        };
        
        res.json({ 
            messages: messages || [], 
            roomId: consistentRoomId,
            success: true,
            dealStatus: dealStatus
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Error fetching messages: ' + error.message });
    }
});

// Send chat message
router.post('/chat/send', isLoggedIn, async (req, res) => {
    try {
        const { itemId, receiverId, message, roomId } = req.body;
        
        console.log('Sending night mess message:', { itemId, receiverId, message, roomId, sender: req.user._id });
        
        const item = await NightMessFood.findById(itemId);
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        const chatMessage = new ChatMessage({
            roomId,
            productId: itemId,
            sender: req.user._id,
            receiver: receiverId,
            message,
            read: false
        });
        
        const savedMessage = await chatMessage.save();
        await savedMessage.populate('sender', 'username profilePhoto');
        
        console.log('Night mess message saved:', savedMessage._id);
        
        if (item.chatRooms && item.chatRooms.length > 0) {
            const chatRoom = item.chatRooms.find(room => room.roomId === roomId);
            if (chatRoom) {
                chatRoom.lastMessage = message;
                chatRoom.lastMessageTime = new Date();
                
                if (receiverId.toString() !== req.user._id.toString()) {
                    chatRoom.unreadCount = (chatRoom.unreadCount || 0) + 1;
                }
                
                await item.save();
            }
        }
        
        const io = req.app.get('io');
        if (io) {
            const messageData = {
                _id: savedMessage._id,
                message: savedMessage.message,
                sender: {
                    _id: req.user._id,
                    username: req.user.username,
                    profilePhoto: req.user.profilePhoto
                },
                receiver: receiverId,
                createdAt: savedMessage.createdAt,
                roomId: roomId,
                itemId: itemId,
                itemTitle: item.vendorName,
                dealStatus: item.dealStatus
            };
            
            io.to(roomId).emit('receive-chat-message', messageData);
            io.to(`user_${receiverId}`).emit('chat-notification', {
                itemId,
                itemTitle: item.vendorName,
                message: message.substring(0, 50),
                roomId,
                sender: req.user.username,
                timestamp: new Date(),
                messageId: savedMessage._id
            });
        }
        
        res.json({ 
            success: true, 
            message: savedMessage
        });
    } catch (error) {
        console.error('Error sending night mess message:', error);
        res.status(500).json({ error: 'Error sending message: ' + error.message });
    }
});

// Get all active chats for user (night mess specific)
router.get('/my-chats', isLoggedIn, async (req, res) => {
    try {
        const itemsAsVendor = await NightMessFood.find({ vendor: req.user._id })
            .populate('chatRooms.user', 'username profilePhoto');
        
        const itemsAsBuyer = await NightMessFood.find({
            'chatRooms.user': req.user._id
        }).populate('vendor', 'username profilePhoto');
        
        const allChats = [];
        
        for (const item of itemsAsVendor) {
            if (item.chatRooms && item.chatRooms.length > 0) {
                for (const chat of item.chatRooms) {
                    if (chat.user) {
                        allChats.push({
                            itemId: item._id,
                            itemTitle: item.vendorName,
                            itemImage: item.images[0],
                            otherUserId: chat.user._id,
                            otherUserName: chat.user.username,
                            roomId: chat.roomId,
                            lastMessage: chat.lastMessage || 'No messages yet',
                            lastMessageTime: chat.lastMessageTime,
                            unreadCount: chat.unreadCount,
                            role: 'vendor',
                            type: 'nightmess',
                            dealStatus: item.dealStatus
                        });
                    }
                }
            }
        }
        
        for (const item of itemsAsBuyer) {
            if (item.chatRooms && item.chatRooms.length > 0) {
                const chat = item.chatRooms.find(room => room.user && room.user.toString() === req.user._id.toString());
                if (chat) {
                    allChats.push({
                        itemId: item._id,
                        itemTitle: item.vendorName,
                        itemImage: item.images[0],
                        otherUserId: item.vendor._id,
                        otherUserName: item.vendor.username,
                        roomId: chat.roomId,
                        lastMessage: chat.lastMessage || 'No messages yet',
                        lastMessageTime: chat.lastMessageTime,
                        unreadCount: chat.unreadCount,
                        role: 'buyer',
                        type: 'nightmess',
                        dealStatus: item.dealStatus
                    });
                }
            }
        }
        
        allChats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        
        res.render('nightmess/my-chats', { 
            chats: allChats,
            currUser: req.user
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading chats');
        res.redirect('/');
    }
});

// Show interest and create/join chat - UPDATED with interestCreatedAt
router.post('/item/:id/interest', isLoggedIn, async (req, res) => {
    try {
        const item = await NightMessFood.findById(req.params.id)
            .populate('vendor', 'username email');
            
        if (!item) {
            req.flash('error', 'Item not found');
            return res.redirect('/nightmess');
        }
        
        if (item.vendor._id.toString() === req.user._id.toString()) {
            req.flash('error', 'You cannot show interest in your own stall');
            return res.redirect(`/nightmess/item/${item._id}`);
        }
        
        const alreadyInterested = item.interestedBuyers.some(
            i => i.user && i.user.toString() === req.user._id.toString()
        );
        
        let chatRoomId;
        
        if (!alreadyInterested) {
            item.interestedBuyers.push({ user: req.user._id });
            
            // Set interest creation timestamp for deal tracking
            if (!item.interestCreatedAt) {
                item.interestCreatedAt = new Date();
            }
            
            chatRoomId = generateChatRoomId(item._id, req.user._id, item.vendor._id);
            
            if (!item.chatRooms) {
                item.chatRooms = [];
            }
            
            item.chatRooms.push({
                user: req.user._id,
                roomId: chatRoomId,
                lastMessage: null,
                lastMessageTime: new Date(),
                unreadCount: 0
            });
            
            await item.save();
            
            // Send email notifications in background
            const buyer = {
                _id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                phone: req.user.phone || 'Not provided'
            };
            
            const vendor = {
                username: item.vendor.username,
                email: item.vendor.email
            };
            
            Promise.all([
                emailService.sendInterestEmailToSeller(item, buyer, vendor),
                emailService.sendBuyerConfirmationEmail(item, buyer, vendor)
            ]).catch(err => {
                console.error('Failed to send interest emails:', err);
            });
            
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${item.vendor._id}`).emit('newInterest', {
                    productId: item._id,
                    productTitle: item.vendorName,
                    buyer: {
                        id: req.user._id,
                        username: req.user.username
                    },
                    chatRoomId: chatRoomId
                });
            }
        } else {
            if (item.chatRooms && item.chatRooms.length > 0) {
                const existingRoom = item.chatRooms.find(
                    room => room.user && room.user.toString() === req.user._id.toString()
                );
                chatRoomId = existingRoom ? existingRoom.roomId : null;
            }
        }
        
        req.flash('success', `Interest shown! Check your email for vendor details. You can now chat with the vendor.`);
        res.redirect(`/nightmess/item/${item._id}`);
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error showing interest');
        res.redirect(`/nightmess/item/${req.params.id}`);
    }
});

// ============ API ENDPOINTS ============

// Get all night mess items (API)
router.get('/api/nightmess', async (req, res) => {
    try {
        const { hostelBlock, search, category, hostelType } = req.query;
        let filter = { status: 'available' };
        
        if (hostelBlock && hostelBlock !== '') filter.hostelBlock = hostelBlock.toUpperCase();
        if (category && category !== '') filter.category = category;
        
        if (hostelType && hostelType !== '' && hostelType !== 'both') {
            filter.hostelType = hostelType;
        }
        
        if (search && search !== '') {
            filter.$or = [
                { vendorName: { $regex: search, $options: 'i' } },
                { category: { $regex: search, $options: 'i' } },
                { 'menuItems.itemName': { $regex: search, $options: 'i' } }
            ];
        }
        
        const items = await NightMessFood.find(filter)
            .populate('vendor', 'username profilePhoto email')
            .sort({ createdAt: -1 });
        
        const isOpen = isNightMessOpen();
        
        res.json({ 
            items: items || [], 
            success: true,
            isOpen: isOpen
        });
    } catch (error) {
        console.error('Error loading night mess items:', error);
        res.status(200).json({ 
            items: [], 
            success: false, 
            error: error.message,
            isOpen: true
        });
    }
});

module.exports = router;