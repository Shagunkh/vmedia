const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const NightMessFood = require('../models/NightMessFood');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/user');
const emailService = require('../utils/emailService');

// Helper function to generate consistent chat room ID
function generateChatRoomId(itemId, user1Id, user2Id) {
    const ids = [user1Id.toString(), user2Id.toString()].sort();
    return `nightmess_${itemId}_${ids[0]}_${ids[1]}`;
}

// Check if night mess is open (10:30 PM to 3:00 AM)
function isNightMessOpen() {
    
    return true;
}

// Authentication middleware
const isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.flash('error', 'You need to login first!');
        return res.redirect('/users/login');
    }
    next();
};

// Configure multer for image upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './public/uploads/nightmess';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

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

// Get all available food items
router.get('/', async (req, res) => {
    try {
        const { hostelBlock, search, category } = req.query;
        let filter = { status: 'available' };
        
        if (hostelBlock && hostelBlock !== '') filter.hostelBlock = hostelBlock.toUpperCase();
        if (category && category !== '') filter.category = category;
        
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
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

// Get food item details
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
            isOpen
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
        const { title, description, price, category, hostelBlock, tags, vendorPhone, vendorEmail } = req.body;
        
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
        const images = req.files ? req.files.map(file => `/uploads/nightmess/${file.filename}`) : [];
        
        if (images.length === 0) {
            req.flash('error', 'Please upload at least one image');
            return res.redirect('/nightmess/add-item');
        }
        
        const item = new NightMessFood({
            title,
            description,
            price: price ? parseFloat(price) : 0,
            category,
            hostelBlock: hostelBlock.toUpperCase(),
            tags: tagsArray,
            images,
            vendor: req.user._id,
            vendorPhone: vendorPhone,
            vendorEmail: vendorEmail,
            chatRooms: []
        });
        
        await item.save();
        
        req.flash('success', 'Food item added successfully!');
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
        
        const { title, description, price, category, hostelBlock, tags, vendorPhone, vendorEmail } = req.body;
        
        item.title = title;
        item.description = description;
        item.price = price ? parseFloat(price) : 0;
        item.category = category;
        item.hostelBlock = hostelBlock.toUpperCase();
        item.tags = tags ? tags.split(',').map(tag => tag.trim()) : [];
        item.vendorPhone = vendorPhone;
        item.vendorEmail = vendorEmail;
        
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `/uploads/nightmess/${file.filename}`);
            item.images = [...item.images, ...newImages];
        }
        
        await item.save();
        
        req.flash('success', 'Item updated successfully!');
        res.redirect('/nightmess/my-items');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error updating item');
        res.redirect('/nightmess/my-items');
    }
});
// ============ VISIBILITY TOGGLE ROUTE ============
// Add this BEFORE the module.exports, preferably near other PUT routes

// Toggle visibility for night mess item
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
        
        // Update status
        item.status = status;
        await item.save();
        
        console.log(`✅ Night mess item ${item._id} visibility toggled to: ${status}`);
        
        res.json({ success: true, status: item.status });
    } catch (error) {
        console.error('Error updating visibility:', error);
        res.status(500).json({ error: 'Error updating visibility: ' + error.message });
    }
});

// Also add a route for getting item visibility status (optional)
router.get('/item/:id/visibility', isLoggedIn, async (req, res) => {
    try {
        const item = await NightMessFood.findById(req.params.id);
        
        if (!item) {
            return res.status(404).json({ error: 'Item not found' });
        }
        
        if (item.vendor.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized' });
        }
        
        res.json({ 
            success: true, 
            status: item.status,
            isVisible: item.status !== 'hidden'
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching visibility' });
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
        
        await NightMessFood.findByIdAndDelete(req.params.id);
        
        res.json({ success: 'Item deleted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting item' });
    }
});
// Mark as sold for night mess item
router.post('/item/:id/mark-sold', isLoggedIn, async (req, res) => {
    try {
        const item = await NightMessFood.findById(req.params.id);
        
        if (!item) {
            req.flash('error', 'Item not found');
            return res.redirect('/nightmess');
        }
        
        if (item.vendor.toString() !== req.user._id.toString()) {
            req.flash('error', 'You can only mark your own items as sold');
            return res.redirect(`/nightmess/item/${item._id}`);
        }
        
        const { buyerId } = req.body;
        
        if (!buyerId) {
            req.flash('error', 'Please select a buyer');
            return res.redirect(`/nightmess/item/${item._id}`);
        }
        
        // Update item status
        item.status = 'sold_out';
        await item.save();
        
        // Create a transaction record (optional - you might want to create a similar model for food transactions)
        // For now, just update the status
        
        // Notify the buyer
        const buyer = await User.findById(buyerId);
        if (buyer && buyer.email) {
            try {
                const transporter = require('../utils/emailService');
                // Send email notification to buyer
                const mailOptions = {
                    from: `"VMALL Night Mess" <${process.env.EMAIL_USER}>`,
                    to: buyer.email,
                    subject: `Your food item has been marked as sold: ${item.title}`,
                    html: `
                        <h2>Food Item Sold</h2>
                        <p>Hello ${buyer.username},</p>
                        <p>The vendor has marked "${item.title}" as sold.</p>
                        <p>Thank you for using VMALL Night Mess!</p>
                        <a href="${process.env.BASE_URL}/nightmess">Browse more items</a>
                    `
                };
                // Uncomment if you have transporter configured
                // await transporter.sendMail(mailOptions);
            } catch (emailErr) {
                console.log('Email error:', emailErr);
            }
        }
        
        req.flash('success', 'Item marked as sold!');
        res.redirect('/nightmess/my-items');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error marking item as sold');
        res.redirect(`/nightmess/item/${req.params.id}`);
    }
});
// Show interest
// Show interest and create/join chat
router.post('/item/:id/interest', isLoggedIn, async (req, res) => {
    try {
        const item = await NightMessFood.findById(req.params.id)
            .populate('vendor', 'username email');
            
        if (!item) {
            req.flash('error', 'Item not found');
            return res.redirect('/nightmess');
        }
        
        if (item.vendor._id.toString() === req.user._id.toString()) {
            req.flash('error', 'You cannot show interest in your own item');
            return res.redirect(`/nightmess/item/${item._id}`);
        }
        
        const alreadyInterested = item.interestedBuyers.some(
            i => i.user && i.user.toString() === req.user._id.toString()
        );
        
        let chatRoomId;
        
        if (!alreadyInterested) {
            item.interestedBuyers.push({ user: req.user._id });
            
            // Generate consistent room ID
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
            
            // Send email notifications
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
            
            await emailService.sendInterestEmailToSeller(item, buyer, vendor);
            await emailService.sendBuyerConfirmationEmail(item, buyer, vendor);
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

// ============ CHAT ROUTES ============

// Get chat messages for a food item - FIXED
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
        
        // Return in the same format as marketplace chat
        res.json({ 
            messages: messages || [], 
            roomId: consistentRoomId,
            success: true 
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Error fetching messages: ' + error.message });
    }
});

// Send chat message - FIXED
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
                itemTitle: item.title
            };
            
            io.to(roomId).emit('receive-chat-message', messageData);
            io.to(`user_${receiverId}`).emit('chat-notification', {
                itemId,
                itemTitle: item.title,
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
                            itemTitle: item.title,
                            itemImage: item.images[0],
                            otherUserId: chat.user._id,
                            otherUserName: chat.user.username,
                            roomId: chat.roomId,
                            lastMessage: chat.lastMessage || 'No messages yet',
                            lastMessageTime: chat.lastMessageTime,
                            unreadCount: chat.unreadCount,
                            role: 'vendor',
                            type: 'nightmess'
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
                        itemTitle: item.title,
                        itemImage: item.images[0],
                        otherUserId: item.vendor._id,
                        otherUserName: item.vendor.username,
                        roomId: chat.roomId,
                        lastMessage: chat.lastMessage || 'No messages yet',
                        lastMessageTime: chat.lastMessageTime,
                        unreadCount: chat.unreadCount,
                        role: 'buyer',
                        type: 'nightmess'
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

// Add this API endpoint to your nightMess.js routes
// Add at the end of your routes/marketplaceController.js

// ============ NIGHT MESS API ENDPOINTS (Integrated) ============

// ============ API ENDPOINTS ============

// Get all night mess items (API)
router.get('/api/nightmess', async (req, res) => {
    try {
        const { hostelBlock, search, category } = req.query;
        let filter = { status: 'available' };
        
        if (hostelBlock && hostelBlock !== '') filter.hostelBlock = hostelBlock.toUpperCase();
        if (category && category !== '') filter.category = category;
        
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }
        
        const items = await NightMessFood.find(filter)
            .populate('vendor', 'username profilePhoto email')
            .sort({ createdAt: -1 });
        
        const isOpen = isNightMessOpen();
        
        res.json({ 
            items: items, 
            success: true,
            isOpen: isOpen
        });
    } catch (error) {
        console.error('Error loading night mess items:', error);
        res.status(500).json({ error: 'Error loading night mess items', success: false });
    }
});

// Add night mess item
router.post('/api/nightmess/add', isLoggedIn, upload.array('images', 5), async (req, res) => {
    try {
        const NightMessFood = require('../models/NightMessFood');
        const { title, description, price, category, hostelBlock, tags, vendorPhone, vendorEmail } = req.body;
        
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
        const images = req.files ? req.files.map(file => `/uploads/nightmess/${file.filename}`) : [];
        
        if (images.length === 0) {
            return res.status(400).json({ error: 'Please upload at least one image' });
        }
        
        const item = new NightMessFood({
            title,
            description,
            price: price ? parseFloat(price) : 0,
            category,
            hostelBlock: hostelBlock.toUpperCase(),
            tags: tagsArray,
            images,
            vendor: req.user._id,
            vendorPhone: vendorPhone,
            vendorEmail: vendorEmail,
            chatRooms: []
        });
        
        await item.save();
        
        res.json({ success: true, item });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Get single night mess item
router.get('/marketplace/nightmess-item/:id', async (req, res) => {
    try {
        const NightMessFood = require('../models/NightMessFood');
        const item = await NightMessFood.findById(req.params.id)
            .populate('vendor', 'username profilePhoto email');
            
        if (!item) {
            req.flash('error', 'Item not found');
            return res.redirect('/marketplace');
        }
        
        let hasInterested = false;
        let existingChatRoom = null;
        
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
        }
        
        res.render('marketplace/nightmess-item', {
            item,
            hasInterested,
            existingChatRoom,
            currUser: req.user
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading item');
        res.redirect('/marketplace');
    }
});
// ============ API ENDPOINTS ============



// Add night mess item (API)
router.post('/api/nightmess/add', isLoggedIn, upload.array('images', 5), async (req, res) => {
    try {
        const { title, description, price, category, hostelBlock, tags, vendorPhone, vendorEmail } = req.body;
        
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
        const images = req.files ? req.files.map(file => `/uploads/nightmess/${file.filename}`) : [];
        
        if (images.length === 0) {
            return res.status(400).json({ error: 'Please upload at least one image' });
        }
        
        const item = new NightMessFood({
            title,
            description,
            price: price ? parseFloat(price) : 0,
            category,
            hostelBlock: hostelBlock.toUpperCase(),
            tags: tagsArray,
            images,
            vendor: req.user._id,
            vendorPhone: vendorPhone,
            vendorEmail: vendorEmail,
            chatRooms: []
        });
        
        await item.save();
        
        res.json({ success: true, item });
    } catch (error) {
        console.error('Error adding night mess item:', error);
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;