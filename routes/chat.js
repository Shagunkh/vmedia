const express = require("express");
const router = express.Router();
const Message = require("../models/message.js");
const { isLoggedIn } = require('../middleware/auth');

// GET messages for a specific room
router.get('/', async (req, res) => {
  try {
    const room = req.query.room || 'general';
    const messages = await Message.find({ room })
      .sort({ createdAt: 1 }) // Oldest to newest
      .limit(20);
    res.json(messages);
  } catch (err) {
    console.error("Error fetching messages:", err);
    res.status(500).send("Failed to fetch messages");
  }
});

router.post('/', isLoggedIn,async (req, res) => {
  try {
    const { username, text, room = 'general' } = req.body;

    // 1. Save the new message
    const message = new Message({ username, text, room });
    await message.save();

    // 2. Count total messages in this room
    const messageCount = await Message.countDocuments({ room });

    // 3. If over 20, delete the oldest ones
    if (messageCount > 20) {
      const messagesToDelete = messageCount - 20;
      
      // Find the oldest messages beyond the limit
      const oldestMessages = await Message.find({ room })
        .sort({ createdAt: 1 }) // Get oldest first
        .limit(messagesToDelete);
      
      // Delete them
      const deleteResult = await Message.deleteMany({
        _id: { $in: oldestMessages.map(m => m._id) }
      });

      console.log(`Deleted ${deleteResult.deletedCount} old messages in room '${room}'`);
    }

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("Error saving or cleaning messages:", err);
    res.status(500).send('Error saving message');
  }
});

module.exports = router;