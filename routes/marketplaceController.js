const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Product = require('../models/Product');
const Transaction = require('../models/Transaction');
const ChatMessage = require('../models/ChatMessage');
const User = require('../models/user');
const emailService = require('../utils/emailService');

// Helper function to generate consistent chat room ID (sorted IDs)
function generateChatRoomId(productId, user1Id, user2Id) {
    const ids = [user1Id.toString(), user2Id.toString()].sort();
    return `product_${productId}_${ids[0]}_${ids[1]}`;
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
        const dir = './public/uploads/products';
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

// Get all available products - UPDATED with total sales
router.get('/', async (req, res) => {
    try {
        const { category, minPrice, maxPrice, condition, search } = req.query;
        let filter = { status: 'available' };
        
        if (category && category !== '') filter.category = category;
        if (condition && condition !== '') filter.condition = condition;
        
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { tags: { $in: [new RegExp(search, 'i')] } }
            ];
        }
        
        if (minPrice || maxPrice) {
            filter.price = {};
            if (minPrice) filter.price.$gte = parseInt(minPrice);
            if (maxPrice) filter.price.$lte = parseInt(maxPrice);
        }
        
        const products = await Product.find(filter)
            .populate('seller', 'username profilePhoto email')
            .sort({ createdAt: -1 });
        
        // Calculate total sales from all sold products
        const allSoldProducts = await Product.find({ status: 'sold' });
        const totalSales = allSoldProducts.reduce((sum, product) => sum + product.price, 0);
        const totalItemsSold = allSoldProducts.length;
            
        const categories = ['Books', 'Electronics', 'Furniture', 'Clothing', 'Stationery', 'Sports', 'Others'];
        
        res.render('marketplace/index', { 
            products, 
            categories,
            filters: req.query,
            currUser: req.user,
            searchQuery: search || '',
            totalSales: totalSales,
            totalItemsSold: totalItemsSold
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading products');
        res.redirect('/');
    }
});

// Search products
router.get('/search', async (req, res) => {
    try {
        const { q } = req.query;
        res.redirect(`/marketplace?search=${encodeURIComponent(q)}`);
    } catch (error) {
        console.error(error);
        req.flash('error', 'Search failed');
        res.redirect('/marketplace');
    }
});

// Get product details - Add returnTo parameter
router.get('/product/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('seller', 'username profilePhoto email')
            .populate('interestedBuyers.user', 'username')
            .populate('reviews.user', 'username profilePhoto')
            .populate('reviews.replies.user', 'username profilePhoto');
            
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/marketplace');
        }
        
        product.views += 1;
        await product.save();
        
        const similarProducts = await Product.find({
            category: product.category,
            status: 'available',
            _id: { $ne: product._id }
        })
        .populate('seller', 'username')
        .limit(4);
        
        let hasInterested = false;
        let transaction = null;
        let existingChatRoom = null;
        let userConfirmed = false;
        let dealStatus = product.dealStatus;
        
        if (req.user) {
            hasInterested = product.interestedBuyers.some(
                i => i.user && i.user._id && i.user._id.toString() === req.user._id.toString()
            );
            
            if (product.chatRooms && product.chatRooms.length > 0) {
                const existingRoom = product.chatRooms.find(
                    room => room.user && room.user.toString() === req.user._id.toString()
                );
                if (existingRoom) {
                    existingChatRoom = existingRoom.roomId;
                }
            }
            
            if (product.status === 'sold') {
                transaction = await Transaction.findOne({
                    product: product._id,
                    status: 'completed'
                });
            }
            
            // Check if user already confirmed the deal
            userConfirmed = product.dealConfirmations.some(
                conf => conf.user.toString() === req.user._id.toString()
            );
        }
        
        let interestedBuyers = [];
        if (req.user && product.seller._id.toString() === req.user._id.toString()) {
            if (product.interestedBuyers && product.interestedBuyers.length > 0) {
                interestedBuyers = await User.find({
                    _id: { $in: product.interestedBuyers.map(i => i.user) }
                }).select('username email profilePhoto');
                
                for (let buyer of interestedBuyers) {
                    if (product.chatRooms && product.chatRooms.length > 0) {
                        const chatRoom = product.chatRooms.find(
                            room => room.user && room.user.toString() === buyer._id.toString()
                        );
                        if (chatRoom) {
                            buyer.chatRoomId = chatRoom.roomId;
                            buyer.lastMessage = chatRoom.lastMessage;
                            buyer.unreadCount = chatRoom.unreadCount;
                        }
                    }
                }
            }
        }
        
        // Create returnTo URL for login redirect
        const returnTo = `/marketplace/product/${product._id}`;
        
        res.render('marketplace/product-details', {
            product,
            similarProducts,
            hasInterested,
            transaction,
            interestedBuyers,
            existingChatRoom,
            currUser: req.user,
            searchQuery: req.query.search || '',
            returnTo: returnTo,
            userConfirmed: userConfirmed,
            dealStatus: dealStatus
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading product');
        res.redirect('/marketplace');
    }
});

// ============ PROTECTED ROUTES ============

// My products - Updated with earnings data
router.get('/my-products', isLoggedIn, async (req, res) => {
    try {
        const products = await Product.find({ seller: req.user._id })
            .sort({ createdAt: -1 });
        
        const NightMessFood = require('../models/NightMessFood');
        const nightmessItems = await NightMessFood.find({ vendor: req.user._id })
            .sort({ createdAt: -1 });
        
        const hiddenCount = [...products, ...nightmessItems].filter(item => item.status === 'hidden').length;
        
        // Calculate earnings from sold products
        const soldProducts = products.filter(p => p.status === 'sold');
        const soldProductsCount = soldProducts.length;
        const productEarnings = soldProducts.reduce((sum, p) => sum + p.price, 0);
        
        // Calculate earnings from sold food items
        const soldFoodItems = nightmessItems.filter(i => i.status === 'sold_out');
        const soldFoodItemsCount = soldFoodItems.length;
        const foodEarnings = soldFoodItems.reduce((sum, i) => sum + (i.price || 0), 0);
        
        const totalEarnings = productEarnings + foodEarnings;
        const totalItemsSold = soldProductsCount + soldFoodItemsCount;
        const avgOrderValue = totalItemsSold > 0 ? Math.round(totalEarnings / totalItemsSold) : 0;
        
        res.render('marketplace/my-products', { 
            products,
            nightmessItems,
            hiddenCount,
            totalEarnings,
            soldProductsCount,
            soldFoodItemsCount,
            avgOrderValue,
            currUser: req.user,
            searchQuery: ''
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading your items');
        res.redirect('/');
    }
});

// My orders
router.get('/orders', isLoggedIn, async (req, res) => {
    try {
        const transactions = await Transaction.find({ buyer: req.user._id })
            .populate('product')
            .populate('seller', 'username')
            .sort({ createdAt: -1 });
            
        res.render('marketplace/orders', { 
            transactions,
            currUser: req.user,
            searchQuery: ''
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading orders');
        res.redirect('/');
    }
});

// Add product form
router.get('/add-product', isLoggedIn, (req, res) => {
    res.render('marketplace/add-product', { 
        currUser: req.user,
        searchQuery: ''
    });
});

// Add product
router.post('/add-product', isLoggedIn, upload.array('images', 5), async (req, res) => {
    try {
        const { title, description, price, category, condition, tags, sellerPhone, sellerEmail } = req.body;
        
        const tagsArray = tags ? tags.split(',').map(tag => tag.trim()) : [];
        const images = req.files ? req.files.map(file => `/uploads/products/${file.filename}`) : [];
        
        if (images.length === 0) {
            req.flash('error', 'Please upload at least one image');
            return res.redirect('/marketplace/add-product');
        }
        
        const product = new Product({
            title,
            description,
            price: parseFloat(price),
            category,
            condition,
            tags: tagsArray,
            images,
            seller: req.user._id,
            sellerPhone: sellerPhone,
            sellerEmail: sellerEmail,
            chatRooms: []
        });
        
        await product.save();
        
        req.flash('success', 'Product added successfully!');
        res.redirect('/marketplace/my-products');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error adding product: ' + error.message);
        res.redirect('/marketplace/add-product');
    }
});

// Edit product form
router.get('/edit-product/:id', isLoggedIn, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/marketplace/my-products');
        }
        
        if (product.seller.toString() !== req.user._id.toString()) {
            req.flash('error', 'You can only edit your own products');
            return res.redirect('/marketplace/my-products');
        }
        
        res.render('marketplace/edit-product', { 
            product,
            currUser: req.user,
            searchQuery: ''
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading product');
        res.redirect('/marketplace/my-products');
    }
});

// Edit product
router.put('/edit-product/:id', isLoggedIn, upload.array('images', 5), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/marketplace/my-products');
        }
        
        if (product.seller.toString() !== req.user._id.toString()) {
            req.flash('error', 'You can only edit your own products');
            return res.redirect('/marketplace/my-products');
        }
        
        const { title, description, price, category, condition, tags, sellerPhone, sellerEmail } = req.body;
        
        product.title = title;
        product.description = description;
        product.price = parseFloat(price);
        product.category = category;
        product.condition = condition;
        product.tags = tags ? tags.split(',').map(tag => tag.trim()) : [];
        product.sellerPhone = sellerPhone;
        product.sellerEmail = sellerEmail;
        
        if (req.files && req.files.length > 0) {
            const newImages = req.files.map(file => `/uploads/products/${file.filename}`);
            product.images = [...product.images, ...newImages];
        }
        
        await product.save();
        
        req.flash('success', 'Product updated successfully!');
        res.redirect('/marketplace/my-products');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error updating product');
        res.redirect('/marketplace/my-products');
    }
});

// Delete product
router.delete('/product/:id', isLoggedIn, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        if (product.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'You can only delete your own products' });
        }
        
        await Product.findByIdAndDelete(req.params.id);
        
        res.json({ success: 'Product deleted successfully!' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error deleting product' });
    }
});

// Show interest and create/join chat - UPDATED with interestCreatedAt
router.post('/product/:id/interest', isLoggedIn, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('seller', 'username email');
            
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/marketplace');
        }
        
        if (product.seller._id.toString() === req.user._id.toString()) {
            req.flash('error', 'You cannot show interest in your own product');
            return res.redirect(`/marketplace/product/${product._id}`);
        }
        
        const alreadyInterested = product.interestedBuyers.some(
            i => i.user && i.user.toString() === req.user._id.toString()
        );
        
        let chatRoomId;
        
        if (!alreadyInterested) {
            product.interestedBuyers.push({ user: req.user._id });
            
            // Set interest creation timestamp for deal tracking
            if (!product.interestCreatedAt) {
                product.interestCreatedAt = new Date();
            }
            
            chatRoomId = generateChatRoomId(product._id, req.user._id, product.seller._id);
            
            if (!product.chatRooms) {
                product.chatRooms = [];
            }
            
            product.chatRooms.push({
                user: req.user._id,
                roomId: chatRoomId,
                lastMessage: null,
                lastMessageTime: new Date(),
                unreadCount: 0
            });
            
            await product.save();
            
            // Prepare email data
            const buyer = {
                _id: req.user._id,
                username: req.user.username,
                email: req.user.email,
                phone: req.user.phone || 'Not provided'
            };
            
            const seller = {
                username: product.seller.username,
                email: product.seller.email
            };
            
            // Send emails in the background
            Promise.all([
                emailService.sendInterestEmailToSeller(product, buyer, seller),
                emailService.sendBuyerConfirmationEmail(product, buyer, seller)
            ]).catch(err => {
                console.error('Failed to send interest emails:', err);
            });
            
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${product.seller._id}`).emit('newInterest', {
                    productId: product._id,
                    productTitle: product.title,
                    buyer: {
                        id: req.user._id,
                        username: req.user.username
                    },
                    chatRoomId: chatRoomId
                });
            }
        } else {
            if (product.chatRooms && product.chatRooms.length > 0) {
                const existingRoom = product.chatRooms.find(
                    room => room.user && room.user.toString() === req.user._id.toString()
                );
                chatRoomId = existingRoom ? existingRoom.roomId : null;
            }
        }
        
        req.flash('success', `Interest shown! Check your email for seller details. You can now chat with the seller.`);
        res.redirect(`/marketplace/product/${product._id}`);
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error showing interest');
        res.redirect(`/marketplace/product/${req.params.id}`);
    }
});

// ============ DEAL CONFIRMATION ROUTES ============

// Deal confirmation route
router.post('/product/:id/deal-confirm', isLoggedIn, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        if (product.status === 'sold') {
            return res.status(400).json({ error: 'This product is already sold' });
        }
        
        // Determine role
        let role;
        const userIdStr = req.user._id.toString();
        if (product.seller.toString() === userIdStr) {
            role = 'seller';
        } else if (product.interestedBuyers.some(b => b.user.toString() === userIdStr)) {
            role = 'buyer';
        } else {
            return res.status(403).json({ error: 'You are not involved in this deal' });
        }
        
        // The seller can optionally specify which buyer they are confirming with
        const buyerId = req.body.buyerId || null;
        
        const result = await product.addDealConfirmation(req.user._id, role, buyerId);
        
        if (result.queued) {
            // Buyer was queued because deal is locked with someone else
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
            
            // Notify the other party that a confirmation happened
            if (result.bothConfirmed) {
                // Notify both parties
                const seller = await User.findById(product.seller);
                const buyerUser = await User.findById(product.buyer);
                
                if (io) {
                    io.to(`user_${product.seller}`).emit('deal-confirmation', {
                        productId: product._id,
                        productTitle: product.title,
                        dealStatus: result.dealStatus,
                        confirmedBy: req.user.username,
                        bothConfirmed: true
                    });
                    io.to(`user_${product.buyer}`).emit('deal-confirmation', {
                        productId: product._id,
                        productTitle: product.title,
                        dealStatus: result.dealStatus,
                        confirmedBy: req.user.username,
                        bothConfirmed: true
                    });
                    // Notify queued buyers that the product is sold
                    product.queuedBuyers.forEach(qb => {
                        io.to(`user_${qb.user}`).emit('deal-sold', {
                            productId: product._id,
                            productTitle: product.title
                        });
                    });
                }
                
                if (seller && buyerUser) {
                    emailService.sendAutoSoldNotification(product, seller, buyerUser).catch(err => {
                        console.error('Failed to send sold notification:', err);
                    });
                }
            } else {
                // Notify the other confirmed party
                const otherUser = role === 'buyer' ? product.seller : product.pendingDealWith;
                if (io && otherUser) {
                    io.to(`user_${otherUser}`).emit('deal-confirmation', {
                        productId: product._id,
                        productTitle: product.title,
                        dealStatus: result.dealStatus,
                        confirmedBy: req.user.username,
                        bothConfirmed: false
                    });
                }
            }
            
            res.json({ 
                success: true, 
                dealStatus: result.dealStatus,
                bothConfirmed: result.bothConfirmed,
                message: result.bothConfirmed ? 'Deal confirmed! Item marked as sold.' : 'Confirmation recorded. Waiting for other party.'
            });
        } else {
            res.json({ success: false, message: result.message });
        }
    } catch (error) {
        console.error('Error confirming deal:', error);
        res.status(500).json({ error: 'Error confirming deal' });
    }
});

// Cancel a deal — accessible by seller or the pending buyer
router.post('/product/:id/deal-cancel', isLoggedIn, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const result = await product.cancelDeal(req.user._id);
        
        if (result.success) {
            const io = req.app.get('io');
            
            // Notify the other party (cancelled with)
            if (io && result.cancelledWith) {
                io.to(`user_${result.cancelledWith}`).emit('deal-cancelled', {
                    productId: product._id,
                    productTitle: product.title,
                    cancelledBy: req.user.username
                });
                io.to(`user_${product.seller}`).emit('deal-cancelled', {
                    productId: product._id,
                    productTitle: product.title,
                    cancelledBy: req.user.username
                });
            }
            
            // Notify all queued buyers that the product is now available
            if (io && result.queuedBuyers && result.queuedBuyers.length > 0) {
                result.queuedBuyers.forEach(qb => {
                    io.to(`user_${qb.user}`).emit('product-available-again', {
                        productId: product._id,
                        productTitle: product.title,
                        message: `Good news! The product "${product.title}" you were waiting for is now available again.`
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

// Revert / remove interest
router.post('/product/:id/interest-revert', isLoggedIn, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const userIdStr = req.user._id.toString();
        
        // Cannot revert if product is already sold
        if (product.status === 'sold') {
            return res.status(400).json({ error: 'Cannot revert interest after product is sold.' });
        }
        
        // Check buyer is actually interested
        const isInterested = product.interestedBuyers.some(i => i.user && i.user.toString() === userIdStr);
        if (!isInterested) {
            return res.status(400).json({ error: 'You have not shown interest in this product.' });
        }
        
        // If this buyer is the pending deal buyer, cancel the deal first
        const isPendingBuyer = product.pendingDealWith && product.pendingDealWith.toString() === userIdStr;
        let cancelResult = null;
        if (isPendingBuyer) {
            cancelResult = await product.cancelDeal(req.user._id);
            // After cancel, re-fetch to work on latest
        }
        
        // Remove from interestedBuyers
        product.interestedBuyers = product.interestedBuyers.filter(i => i.user && i.user.toString() !== userIdStr);
        // Remove from queuedBuyers if there
        product.queuedBuyers = product.queuedBuyers.filter(q => q.user && q.user.toString() !== userIdStr);
        await product.save();
        
        const io = req.app.get('io');
        // If their cancellation freed up a deal, notify queued buyers
        if (isPendingBuyer && cancelResult && cancelResult.success && io) {
            cancelResult.queuedBuyers.forEach(qb => {
                if (qb.user.toString() !== userIdStr) {
                    io.to(`user_${qb.user}`).emit('product-available-again', {
                        productId: product._id,
                        productTitle: product.title,
                        message: `Good news! The product "${product.title}" you were waiting for is now available again.`
                    });
                }
            });
            // Notify seller
            io.to(`user_${product.seller}`).emit('deal-cancelled', {
                productId: product._id,
                productTitle: product.title,
                cancelledBy: req.user.username
            });
        }
        
        res.json({ success: true, message: 'Interest removed successfully.' });
    } catch (error) {
        console.error('Error reverting interest:', error);
        res.status(500).json({ error: 'Error reverting interest' });
    }
});

// Get deal status
router.get('/product/:id/deal-status', isLoggedIn, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const userIdStr = req.user._id.toString();
        const userConfirmed = product.dealConfirmations.some(conf => conf.user.toString() === userIdStr);
        const isQueued = product.queuedBuyers.some(q => q.user.toString() === userIdStr);
        const isBlocked = product.pendingDealWith &&
            product.pendingDealWith.toString() !== userIdStr &&
            product.seller.toString() !== userIdStr;
        const isPendingBuyer = product.pendingDealWith &&
            product.pendingDealWith.toString() === userIdStr;
        
        res.json({
            dealStatus: product.dealStatus,
            status: product.status,
            userConfirmed,
            bothConfirmed: product.dealStatus === 'both_confirmed',
            autoMarkSoldAt: product.autoMarkSoldAt,
            interestCreatedAt: product.interestCreatedAt,
            isQueued,
            isBlocked,
            isPendingBuyer,
            sellerPhone: product.sellerPhone,
            sellerEmail: product.sellerEmail
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching deal status' });
    }
});

// ============ EXISTING CHAT ROUTES ============

// Get chat messages for a product
router.get('/chat/:productId/:otherUserId', isLoggedIn, async (req, res) => {
    try {
        const { productId, otherUserId } = req.params;
        const product = await Product.findById(productId);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const consistentRoomId = generateChatRoomId(productId, req.user._id, otherUserId);
        
        let chatRoom = null;
        if (product.chatRooms && product.chatRooms.length > 0) {
            chatRoom = product.chatRooms.find(room => room.roomId === consistentRoomId);
        }
        
        if (!chatRoom) {
            chatRoom = {
                user: otherUserId,
                roomId: consistentRoomId,
                lastMessage: null,
                lastMessageTime: new Date(),
                unreadCount: 0
            };
            
            if (!product.chatRooms) product.chatRooms = [];
            product.chatRooms.push(chatRoom);
            await product.save();
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
        
        const room = product.chatRooms.find(r => r.roomId === consistentRoomId);
        if (room) {
            room.unreadCount = 0;
            await product.save();
        }
        
        // Include deal status in chat response
        const dealStatus = {
            dealStatus: product.dealStatus,
            bothConfirmed: product.dealConfirmations.length === 2,
            userConfirmed: product.dealConfirmations.some(
                conf => conf.user.toString() === req.user._id.toString()
            ),
            autoMarkSoldAt: product.autoMarkSoldAt
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
        const { productId, receiverId, message, roomId } = req.body;
        
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const chatMessage = new ChatMessage({
            roomId,
            productId,
            sender: req.user._id,
            receiver: receiverId,
            message,
            read: false
        });
        
        const savedMessage = await chatMessage.save();
        await savedMessage.populate('sender', 'username profilePhoto');
        
        if (product.chatRooms && product.chatRooms.length > 0) {
            const chatRoom = product.chatRooms.find(room => room.roomId === roomId);
            if (chatRoom) {
                chatRoom.lastMessage = message;
                chatRoom.lastMessageTime = new Date();
                
                if (receiverId.toString() !== req.user._id.toString()) {
                    chatRoom.unreadCount = (chatRoom.unreadCount || 0) + 1;
                }
                
                await product.save();
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
                productId: productId,
                productTitle: product.title,
                dealStatus: product.dealStatus
            };
            
            io.to(roomId).emit('receive-chat-message', messageData);
            
            io.to(`user_${receiverId}`).emit('chat-notification', {
                productId,
                productTitle: product.title,
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
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Error sending message: ' + error.message });
    }
});

// Get all active chats for user (combined)
router.get('/my-chats', isLoggedIn, async (req, res) => {
    try {
        // Get product chats
        const productsAsSeller = await Product.find({ seller: req.user._id })
            .populate('chatRooms.user', 'username profilePhoto');
        
        const productsAsBuyer = await Product.find({
            'chatRooms.user': req.user._id
        }).populate('seller', 'username profilePhoto');
        
        const allChats = [];
        
        // Process product seller chats
        for (const product of productsAsSeller) {
            if (product.chatRooms && product.chatRooms.length > 0) {
                for (const chat of product.chatRooms) {
                    if (chat.user) {
                        allChats.push({
                            productId: product._id,
                            productTitle: product.title,
                            productImage: product.images[0],
                            otherUserId: chat.user._id,
                            otherUserName: chat.user.username,
                            roomId: chat.roomId,
                            lastMessage: chat.lastMessage || 'No messages yet',
                            lastMessageTime: chat.lastMessageTime,
                            unreadCount: chat.unreadCount,
                            role: 'seller',
                            type: 'product',
                            dealStatus: product.dealStatus
                        });
                    }
                }
            }
        }
        
        // Process product buyer chats
        for (const product of productsAsBuyer) {
            if (product.chatRooms && product.chatRooms.length > 0) {
                const chat = product.chatRooms.find(room => room.user && room.user.toString() === req.user._id.toString());
                if (chat) {
                    allChats.push({
                        productId: product._id,
                        productTitle: product.title,
                        productImage: product.images[0],
                        otherUserId: product.seller._id,
                        otherUserName: product.seller.username,
                        roomId: chat.roomId,
                        lastMessage: chat.lastMessage || 'No messages yet',
                        lastMessageTime: chat.lastMessageTime,
                        unreadCount: chat.unreadCount,
                        role: 'buyer',
                        type: 'product',
                        dealStatus: product.dealStatus
                    });
                }
            }
        }
        
        // Get night mess food chats
        const NightMessFood = require('../models/NightMessFood');
        const itemsAsVendor = await NightMessFood.find({ vendor: req.user._id })
            .populate('chatRooms.user', 'username profilePhoto');
        
        const itemsAsBuyer = await NightMessFood.find({
            'chatRooms.user': req.user._id
        }).populate('vendor', 'username profilePhoto');
        
        // Process night mess vendor chats
        for (const item of itemsAsVendor) {
            if (item.chatRooms && item.chatRooms.length > 0) {
                for (const chat of item.chatRooms) {
                    if (chat.user) {
                        allChats.push({
                            productId: item._id,
                            productTitle: item.vendorName,
                            productImage: item.images[0],
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
        
        // Process night mess buyer chats
        for (const item of itemsAsBuyer) {
            if (item.chatRooms && item.chatRooms.length > 0) {
                const chat = item.chatRooms.find(room => room.user && room.user.toString() === req.user._id.toString());
                if (chat) {
                    allChats.push({
                        productId: item._id,
                        productTitle: item.vendorName,
                        productImage: item.images[0],
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
        
        // Sort by last message time
        allChats.sort((a, b) => new Date(b.lastMessageTime) - new Date(a.lastMessageTime));
        
        res.render('marketplace/my-chats', { 
            chats: allChats,
            currUser: req.user,
            searchQuery: ''
        });
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error loading chats');
        res.redirect('/');
    }
});

// Mark as sold (legacy - kept for compatibility)
router.post('/product/:id/mark-sold', isLoggedIn, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect('/marketplace/my-products');
        }
        
        if (product.seller.toString() !== req.user._id.toString()) {
            req.flash('error', 'You can only mark your own products as sold');
            return res.redirect('/marketplace/my-products');
        }
        
        const { buyerId } = req.body;
        
        if (!buyerId) {
            req.flash('error', 'Please select a buyer');
            return res.redirect(`/marketplace/product/${product._id}`);
        }
        
        const transaction = new Transaction({
            product: product._id,
            seller: req.user._id,
            buyer: buyerId,
            status: 'completed',
            completedAt: new Date()
        });
        
        await transaction.save();
        
        product.status = 'sold';
        product.buyer = buyerId;
        product.soldDate = new Date();
        await product.save();
        
        req.flash('success', 'Product marked as sold!');
        res.redirect('/marketplace/my-products');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error marking product as sold');
        res.redirect('/marketplace/my-products');
    }
});

// Rate product
router.post('/product/:id/rate', isLoggedIn, async (req, res) => {
    try {
        const { rating, review } = req.body;
        const transaction = await Transaction.findOne({
            product: req.params.id,
            buyer: req.user._id,
            status: 'completed'
        });
        
        if (!transaction) {
            req.flash('error', 'You can only rate products you have purchased');
            return res.redirect('/marketplace/orders');
        }
        
        transaction.rating = {
            score: parseInt(rating),
            review,
            createdAt: new Date()
        };
        
        await transaction.save();
        
        req.flash('success', 'Thank you for your review!');
        res.redirect('/marketplace/orders');
    } catch (error) {
        console.error(error);
        req.flash('error', 'Error submitting review');
        res.redirect('/marketplace/orders');
    }
});

// ============ REVIEW ROUTES ============

// Get product reviews
router.get('/product/:id/reviews', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id)
            .populate('reviews.user', 'username profilePhoto')
            .populate('reviews.replies.user', 'username profilePhoto');
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        res.json({
            success: true,
            reviews: product.reviews,
            averageRating: product.averageRating,
            totalReviews: product.totalReviews,
            ratingDistribution: product.ratingDistribution
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error fetching reviews' });
    }
});

// Add a review
router.post('/product/:id/review', isLoggedIn, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            req.flash('error', 'Product not found');
            return res.redirect(`/marketplace/product/${req.params.id}`);
        }
        
        if (product.seller.toString() === req.user._id.toString()) {
            req.flash('error', 'You cannot review your own product');
            return res.redirect(`/marketplace/product/${req.params.id}`);
        }
        
        const { rating, review, title } = req.body;
        
        await product.addReview(req.user._id, {
            rating: parseInt(rating),
            review: review,
            title: title || ''
        });
        
        req.flash('success', 'Thank you for your review!');
        res.redirect(`/marketplace/product/${req.params.id}`);
    } catch (error) {
        console.error(error);
        req.flash('error', error.message || 'Error adding review');
        res.redirect(`/marketplace/product/${req.params.id}`);
    }
});

// Update a review
router.put('/product/:id/review', isLoggedIn, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const { rating, review, title } = req.body;
        
        await product.updateReview(req.user._id, {
            rating: parseInt(rating),
            review: review,
            title: title || ''
        });
        
        res.json({ success: true, message: 'Review updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Delete a review
router.delete('/product/:id/review', isLoggedIn, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        await product.deleteReview(req.user._id);
        
        res.json({ success: true, message: 'Review deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Mark review as helpful
router.post('/product/:id/review/:reviewId/helpful', isLoggedIn, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        const review = await product.markReviewHelpful(req.params.reviewId, req.user._id);
        
        res.json({ 
            success: true, 
            helpfulCount: review.helpful.length,
            isHelpful: review.helpful.some(h => h.user.toString() === req.user._id.toString())
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Add reply to review
router.post('/product/:id/review/:reviewId/reply', isLoggedIn, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        if (product.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Only seller can reply to reviews' });
        }
        
        const { comment } = req.body;
        
        if (!comment || comment.trim().length === 0) {
            return res.status(400).json({ error: 'Reply cannot be empty' });
        }
        
        const review = await product.addReviewReply(req.params.reviewId, req.user._id, comment);
        
        const populatedReview = await Product.populate(review, {
            path: 'replies.user',
            select: 'username profilePhoto'
        });
        
        res.json({ 
            success: true, 
            reply: populatedReview.replies[populatedReview.replies.length - 1]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// Toggle visibility for product
router.put('/product/:id/visibility', isLoggedIn, async (req, res) => {
    try {
        const { status } = req.body;
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        if (product.seller.toString() !== req.user._id.toString()) {
            return res.status(403).json({ error: 'Unauthorized - You can only edit your own products' });
        }
        
        product.status = status;
        await product.save();
        
        console.log(`Product ${product._id} visibility toggled to: ${status}`);
        
        res.json({ success: true, status: product.status });
    } catch (error) {
        console.error('Error updating visibility:', error);
        res.status(500).json({ error: 'Error updating visibility: ' + error.message });
    }
});

module.exports = router;