const express = require('express');
const router = express.Router();

const CollabMessage = require('../models/CollabMessage');
const CollabRequest = require('../models/CollabRequest'); // Add this if you missed it
const { isLoggedIn } = require('../middleware/auth'); // Adjust path as needed

router.get('/chat/:projectId', isLoggedIn, async (req, res) => {
  try {
    const project = await CollabRequest.findById(req.params.projectId)
      .populate('creator')
      .populate('teamMembers');

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isMember = project.creator._id.equals(req.user._id) || 
                     project.teamMembers.some(m => m._id.equals(req.user._id));
    if (!isMember) return res.status(403).json({ error: 'Unauthorized' });

    const messages = await CollabMessage.find({ project: project._id })
      .sort({ createdAt: 1 })
      .populate('user', 'username');

    res.json({ messages });
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST chat message
router.post('/chat/:projectId', isLoggedIn, async (req, res) => {
  try {
    const project = await CollabRequest.findById(req.params.projectId)
      .populate('creator')
      .populate('teamMembers');

    if (!project) return res.status(404).json({ error: 'Project not found' });

    const isMember = project.creator._id.equals(req.user._id) || 
                     project.teamMembers.some(m => m._id.equals(req.user._id));
    if (!isMember) return res.status(403).json({ error: 'Unauthorized' });

    const newMsg = new CollabMessage({
      project: project._id,
      user: req.user._id,
      text: req.body.text
    });

    await newMsg.save();
    await newMsg.populate('user', 'username');
    
    res.status(201).json(newMsg);
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;