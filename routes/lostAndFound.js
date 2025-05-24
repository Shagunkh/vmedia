const express = require('express');
const router = express.Router();
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const { isLoggedIn } = require('../middleware/auth');
const multer = require('multer');
const { storage, cloudinary } = require("../cloudConfig");
const upload = multer({ storage });

// Get all items
// routes/lostAndFound.js
// Add a new API endpoint for JSON data
router.get('/api/items', isLoggedIn, async (req, res) => {
  try {
    const lostItems = await LostItem.find().populate('postedBy', 'username profilePhoto');
    const foundItems = await FoundItem.find().populate('postedBy', 'username profilePhoto');
    
    res.json({ 
      lostItems, 
      foundItems,
      currentUser: req.user // Pass the authenticated user to the template
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Keep your existing route for HTML rendering
router.get('/', isLoggedIn, async (req, res) => {
  try {
    const lostItems = await LostItem.find().populate('postedBy', 'username profilePhoto');
    const foundItems = await FoundItem.find().populate('postedBy', 'username profilePhoto');
    
    res.render('lost-and-found', { 
      lostItems, 
      foundItems,
      currentUser: req.user
    });
  } catch (err) {
    res.status(500).render('error', { message: err.message });
  }
});

// Post a lost item with image upload
router.post('/lost', isLoggedIn, upload.single('image'), async (req, res) => {
  try {
    const { itemName, lastSeenLocation, dateLost, description, contactInfo } = req.body;
    
    const lostItem = new LostItem({
      itemName,
      lastSeenLocation,
      dateLost,
      description,
      contactInfo,
      postedBy: req.user._id
    });

    if (req.file) {
      lostItem.image = {
        public_id: req.file.public_id,
        url: req.file.path
      };
    }

    await lostItem.save();
    res.status(201).json(lostItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Post a found item with image upload
router.post('/found', isLoggedIn, upload.single('image'), async (req, res) => {
  try {
    const { itemName, foundLocation, dateFound, description, contactInfo } = req.body;
    
    const foundItem = new FoundItem({
      itemName,
      foundLocation,
      dateFound,
      description,
      contactInfo,
      postedBy: req.user._id
    });

    if (req.file) {
      foundItem.image = {
        public_id: req.file.public_id,
        url: req.file.path
      };
    }

    await foundItem.save();
    res.status(201).json(foundItem);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a lost item (also deletes image from Cloudinary)
router.delete('/lost/:id', isLoggedIn, async (req, res) => {
  try {
    const item = await LostItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (!item.postedBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete image from Cloudinary if exists
    if (item.image && item.image.public_id) {
      await cloudinary.uploader.destroy(item.image.public_id);
    }

    await item.deleteOne(); // Changed from remove() to deleteOne()
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// Get current user's items
router.get('/api/my-items', isLoggedIn, async (req, res) => {
  try {
    const lostItems = await LostItem.find({ postedBy: req.user._id })
      .populate('postedBy', 'username profilePhoto');
      
    const foundItems = await FoundItem.find({ postedBy: req.user._id })
      .populate('postedBy', 'username profilePhoto');
    
    res.json({ 
      lostItems, 
      foundItems,
      currentUser: req.user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
// In your routes/lostFound.js file

// Delete an item (works for both lost and found)
// Delete a lost item (also deletes image from Cloudinary)
// Delete an item (works for both lost and found)
router.delete('/:id', isLoggedIn, async (req, res) => {
  try {
    const item = await LostFound.findById(req.params.id);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }

    // Check if the user is the owner
    if (!item.postedBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own posts' });
    }

    // Delete image from Cloudinary if exists
    if (item.image && item.image.public_id) {
      await cloudinary.uploader.destroy(item.image.public_id);
    }

    await item.deleteOne(); // Changed from remove() to deleteOne()
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ message: 'Server error during deletion' });
  }
});
// Delete a found item (also deletes image from Cloudinary)
router.delete('/found/:id', isLoggedIn, async (req, res) => {
  try {
    const item = await FoundItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Item not found' });
    if (!item.postedBy.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Delete image from Cloudinary if exists
    if (item.image && item.image.public_id) {
      await cloudinary.uploader.destroy(item.image.public_id);
    }

    await item.deleteOne();
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;