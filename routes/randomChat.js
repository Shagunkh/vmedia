const express = require('express');
const router = express.Router();
const User = require('../models/user');
const RandomChat = require('../models/RandomChat');
const { isLoggedIn } = require('../middleware/auth');


router.get('/',isLoggedIn,async(req,res)=>{
    res.render('random');
});
// Start looking for a random chat
router.post('/start',isLoggedIn, async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Mark user as available
    await User.findByIdAndUpdate(userId, {
      isAvailableForRandomChat: true,
      currentRandomChat: null
    });

    // Try to find another available user
    const availableUser = await User.findOne({
      _id: { $ne: userId },
      isAvailableForRandomChat: true,
      currentRandomChat: null
    });

    if (availableUser) {
      // Create a new chat
      const newChat = new RandomChat({
        participants: [userId, availableUser._id]
      });
      await newChat.save();

      // Update both users
      await User.updateMany(
        { _id: { $in: [userId, availableUser._id] } },
        { 
          isAvailableForRandomChat: false,
          currentRandomChat: newChat._id
        }
      );

      // Notify both participants via WebSocket
      const io = req.app.get('io');
      io.to(userId.toString()).to(availableUser._id.toString()).emit('chat_started', {
        chatId: newChat._id,
        participants: [userId, availableUser._id]
      });

      return res.json({ 
        success: true,
        chatId: newChat._id,
        status: 'connected'
      });
    }

    res.json({ 
      success: true,
      status: 'waiting'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// End current random chat
router.post('/end',isLoggedIn, async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (user.currentRandomChat) {
      // Delete all messages from this chat
      await RandomChat.findByIdAndUpdate(
        user.currentRandomChat,
        {
          $set: {
            messages: [], // Clear messages array
            endedAt: Date.now()
          }
        }
      );

      // Notify other participant
      const io = req.app.get('io');
      io.to(user.currentRandomChat.toString()).emit('chat_ended', {
        chatId: user.currentRandomChat
      });

      // Optionally: Archive chat before clearing messages if needed
      // await archiveChat(user.currentRandomChat);
    }

    await User.findByIdAndUpdate(userId, {
      isAvailableForRandomChat: false,
      currentRandomChat: null
    });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});
// Send message in random chat
router.post('/message',isLoggedIn, async (req, res) => {
  try {
    const { content, chatId } = req.body;
    const userId = req.user._id;

    const updatedChat = await RandomChat.findByIdAndUpdate(
      chatId,
      {
        $push: {
          messages: {
            sender: userId,
            content
          }
        }
      },
      { new: true }
    );

    // Broadcast message to chat participants
    const io = req.app.get('io');
    io.to(chatId.toString()).emit('new_message', {
      chatId,
      content,
      sender: userId
    });

    res.json({ success: true, message: updatedChat.messages.slice(-1)[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get chat messages
router.post('/messages',isLoggedIn, async (req, res) => {
  try {
    const { chatId } = req.body;
    const chat = await RandomChat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    res.json({
      success: true,
      messages: chat.messages
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Get current chat status
router.get('/status', isLoggedIn,async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (user.currentRandomChat) {
      const chat = await RandomChat.findById(user.currentRandomChat);
      return res.json({
        success: true,
        status: 'connected',
        chatId: chat._id,
        isActive: !chat.endedAt
      });
    }

    res.json({
      success: true,
      status: user.isAvailableForRandomChat ? 'waiting' : 'inactive'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;