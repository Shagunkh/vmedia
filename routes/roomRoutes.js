const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const GroupChat = require('../models/GroupChat');
const { isLoggedIn } = require('../middleware/auth');

// Create room
router.post('/', isLoggedIn, async (req, res) => {
  try {
    const { name, size, course, year, hostel, interests, whatsappNumber } = req.body;
    
    // Normalize gender comparison (case-insensitive)
    if (hostel.toLowerCase() !== req.user.gender.toLowerCase()) {
      return res.status(400).json({ 
        error: `You can only create ${req.user.gender} hostel rooms`,
        success: false 
      });
    }
    
    const room = new Room({
      creator: req.user._id,
      name,
      size: parseInt(size),
      course,
      year,
      hostel, // Store the original case from form
      interests: interests.split(',').map(i => i.trim()),
      whatsappNumber
    });
    
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ 
      error: err.message,
      success: false 
    });
  }

});
// Add this route to your routes file (where you have other room routes)
router.get('/:id', isLoggedIn, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('creator', 'profilePhoto email username')
      .populate('members.user', 'profilePhoto email username')
      .populate('groupChat');

    if (!room) {
      return res.status(404).json({ 
        success: false,
        error: 'Room not found' 
      });
    }

    res.json({
      success: true,
      room
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Get all rooms (HTML page)
router.get('/', isLoggedIn, async (req, res) => {
  try {
    const rooms = await Room.find({})
      .populate('creator', 'profilePhoto email')
      .populate('members.user', 'profilePhoto email')
      .populate('groupChat');
      
    res.render('users/roommate-finder', { 
      rooms,
      user: req.user
    });
  } catch (err) {
    req.flash('error', err.message);
    res.redirect('/');
  }
});

// Join room
// Join room
// Join room
router.post('/:id/join', isLoggedIn, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ 
        success: false,
        error: 'Room not found' 
      });
    }
    
    // Server-side gender validation with null check
    if (!room.hostel) {
      return res.status(400).json({
        success: false,
        error: 'This room has invalid hostel information'
      });
    }
    
    if (room.hostel.toLowerCase() !== req.user.gender.toLowerCase()) {
      return res.status(403).json({
        success: false,
        error: `You can only join ${room.hostel} hostel rooms`
      });
    }
    
    await room.addMember(req.user._id);
    res.json({ 
      success: true,
      data: room 
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
});
// Accept member
router.post('/:id/accept/:userId', isLoggedIn, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!room.creator.equals(req.user._id)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await room.acceptMember(req.params.userId);
    
    const updatedRoom = await Room.findById(req.params.id)
      .populate('creator')
      .populate('members.user')
      .populate('groupChat');

    res.json({ 
      success: true,
      room: updatedRoom,
      message: 'Member accepted successfully'
    });
  } catch (err) {
    res.status(400).json({ 
      success: false,
      error: err.message 
    });
  }
});

// Get group chat
router.get('/:id/chat', isLoggedIn, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id)
      .populate('creator')
      .populate('members.user');

    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    // Check if user is authorized
    const isMember = room.members.some(m => 
      m.user._id.equals(req.user._id) && m.status === 'accepted'
    ) || room.creator._id.equals(req.user._id);
    
    if (!isMember) return res.status(403).json({ error: 'Not authorized' });

    if (!room.groupChat) {
      return res.json({
        success: true,
        messages: [],
        room: { name: room.name }
      });
    }
    
    const groupChat = await GroupChat.findById(room.groupChat)
      .populate('members', 'profilePhoto email')
      .populate('messages.sender', 'profilePhoto email');

    res.json({
      success: true,
      messages: groupChat.messages,
      room: { name: room.name }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send message
router.post('/:id/chat/message', isLoggedIn, async (req, res) => {
  try {
    const { content } = req.body;
    const room = await Room.findById(req.params.id)
      .populate('groupChat')
      .populate('members.user');

    if (!room) return res.status(404).json({ error: 'Room not found' });
    
    // Check authorization
    const isMember = room.members.some(m => 
      m.user._id.equals(req.user._id) && m.status === 'accepted'
    ) || room.creator._id.equals(req.user._id);
    
    if (!isMember) return res.status(403).json({ error: 'Not authorized' });

    // Create group chat if it doesn't exist
    if (!room.groupChat) {
      const groupChat = new GroupChat({
        room: room._id,
        members: [
          room.creator._id,
          ...room.members
            .filter(m => m.status === 'accepted')
            .map(m => m.user._id)
        ]
      });
      await groupChat.save();
      room.groupChat = groupChat._id;
      await room.save();
    }

    // Add message
    const groupChat = await GroupChat.findById(room.groupChat);
    const newMessage = {
      sender: req.user._id,
      content
    };
    
    groupChat.messages.push(newMessage);
    await groupChat.save();
    
    // Populate sender info
    const populatedMessage = await GroupChat.populate(newMessage, {
      path: 'sender',
      select: 'profilePhoto email'
    });

    res.json({
      success: true,
      message: populatedMessage
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;