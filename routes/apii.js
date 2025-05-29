// In your routes file (e.g., routes/api.js)
const express = require('express');
const router = express.Router();
const Announcement = require('../models/Announcement');
const {isLoggedIn} = require('../middleware/auth');

// Get all announcements
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('user', 'username profilePhoto');
    res.json(announcements);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new announcement (admin only)
router.post('/announcements', isLoggedIn, async (req, res) => {
  try {
   

    const { text, imageUrl } = req.body;
    
    const newAnnouncement = new Announcement({
      user: req.user._id,
      text,
      imageUrl
    });

    await newAnnouncement.save();
    res.json(newAnnouncement);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
