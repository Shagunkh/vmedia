const express = require('express');
const router = express.Router();
const AddDrop = require('../models/AddDrop');
const { isLoggedIn } = require('../middleware/auth');
const ExpressError = require('../utils/ExpressError');
const wrapAsync = require('../utils/wrapAsyc');
const mongoose = require('mongoose');
const Message = require('../models/Messagee');
const { sendInterestNotification } = require('../utils/emaill');

// GET add/drop page
router.get('/page', isLoggedIn, wrapAsync(async (req, res) => {
    const addDrops = await AddDrop.find()
        .populate('user', 'username profilePhoto')
        .populate('interestedUser', 'username profilePhoto')
        .sort({ createdAt: -1 });
    
    res.render('indexx', { 
        title: 'Add/Drop Subjects',
        currentUser: req.user,
        addDrops
    });
}));

// Get chat messages for a room
router.get('/:roomId/messages', isLoggedIn, wrapAsync(async (req, res) => {
    const messages = await Message.find({ roomId: req.params.roomId })
        .sort({ createdAt: 1 });
    
    res.json(messages);
}));

// Save a message
router.post('/:roomId/messages', isLoggedIn, wrapAsync(async (req, res) => {
    const { username, text } = req.body;
    
    if (!username || !text) {
        throw new ExpressError('Username and text are required', 400);
    }
    
    const message = new Message({
        roomId: req.params.roomId,
        username,
        text
    });
    
    await message.save();
    
    res.status(201).json({
        success: true,
        message
    });
}));

// Create new add/drop request
router.post('/', isLoggedIn, wrapAsync(async (req, res) => {
    const { currentSubject, currentTeacher, currentSlot, desiredSubject, desiredTeacher, desiredSlot } = req.body;
    
    if (!currentSubject || !currentTeacher || !currentSlot || !desiredSubject || !desiredTeacher || !desiredSlot) {
        throw new ExpressError('All fields are required', 400);
    }
    
    const addDrop = new AddDrop({
        user: req.user._id,
        currentSubject,
        currentTeacher,
        currentSlot,
        desiredSubject,
        desiredTeacher,
        desiredSlot
    });
    
    await addDrop.save();
    
    res.status(201).json({
        success: true,
        addDrop
    });
}));

// Get all add/drop requests with optional search
router.get('/', wrapAsync(async (req, res) => {
    const { search } = req.query;
    let query = {};
    
    if (search) {
        query = {
            $or: [
                { currentSubject: { $regex: search, $options: 'i' } },
                { currentTeacher: { $regex: search, $options: 'i' } },
                { currentSlot: { $regex: search, $options: 'i' } },
                { desiredSubject: { $regex: search, $options: 'i' } },
                { desiredTeacher: { $regex: search, $options: 'i' } },
                { desiredSlot: { $regex: search, $options: 'i' } }
            ]
        };
    }
    
    const addDrops = await AddDrop.find(query)
        .populate('user', 'username profilePhoto')
        .populate('interestedUser', 'username profilePhoto')
        .sort({ createdAt: -1 });
        
    res.json({
        success: true,
        count: addDrops.length,
        addDrops
    });
}));

// Start chat for an add/drop request
router.post('/:id/chat', isLoggedIn, wrapAsync(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new ExpressError('Invalid request ID', 400);
    }
    
    const addDrop = await AddDrop.findById(req.params.id)
        .populate('user', 'username email')
        .populate('interestedUser', 'username email');
    
    if (!addDrop) {
        throw new ExpressError('Add/Drop request not found', 404);
    }
    
    if (addDrop.status !== 'open') {
        throw new ExpressError('This request is already being processed', 400);
    }
    
    if (addDrop.user._id.equals(req.user._id)) {
        throw new ExpressError('You cannot chat with yourself', 400);
    }
    
    addDrop.interestedUser = req.user._id;
    addDrop.status = 'in-progress';
    addDrop.chatRoomId = `adddrop-${addDrop._id}-${req.user._id}`;
    await addDrop.save();
    
    // Send email notification to the request owner
    try {
        await sendInterestNotification(
            addDrop.user.email,
            addDrop.user.username,
            req.user.username,
            addDrop.currentSubject,
            addDrop._id
        );
    } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails
    }
    
    res.json({ 
        success: true,
        chatRoomId: addDrop.chatRoomId,
        addDrop
    });
}));

// Close chat for an add/drop request
router.post('/:id/close', isLoggedIn, wrapAsync(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new ExpressError('Invalid request ID', 400);
    }
    
    const addDrop = await AddDrop.findById(req.params.id);
    
    if (!addDrop) {
        throw new ExpressError('Add/Drop request not found', 404);
    }
    
    if (!addDrop.user._id.equals(req.user._id)) {
        throw new ExpressError('Only the request creator can close this', 403);
    }
    
    // Delete all messages associated with this chat room
    await Message.deleteMany({ roomId: addDrop.chatRoomId });
    
    // Reset the add/drop request
    addDrop.status = 'open';
    addDrop.chatRoomId = null;
    addDrop.interestedUser = null;
    await addDrop.save();
    
    res.json({ 
        success: true,
        addDrop
    });
}));

// Delete add/drop request
router.delete('/:id', isLoggedIn, wrapAsync(async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        throw new ExpressError('Invalid request ID', 400);
    }
    
    const addDrop = await AddDrop.findById(req.params.id);
    
    if (!addDrop) {
        throw new ExpressError('Add/Drop request not found', 404);
    }
    
    if (!addDrop.user._id.equals(req.user._id)) {
        throw new ExpressError('Only the request creator can delete this', 403);
    }
    
    await AddDrop.findByIdAndDelete(req.params.id);
    
    res.json({ 
        success: true,
        message: 'Request deleted successfully'
    });
}));

module.exports = router;
