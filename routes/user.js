const express = require('express');
const router = express.Router();
const User = require('../models/user');
const multer = require('multer');
const path = require('path');
const Post = require('../models/post');
const { isLoggedIn } = require('../middleware/auth');
const { storage, cloudinary } = require("../cloudConfig");
const Task = require('../models/task'); // Add this line at the top with other requires

// Configure multer with error handling

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image (JPEG, JPG, PNG) and PDF files are allowed'));
  }
}).single('screenshot');

// In your profile route (profile.js or user.js)
router.get('/', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
  .populate({
    path: 'followRequests',
    select: 'username profilePhoto',
    options: { lean: true }
  })
  .populate({
    path: 'followers',
    select: 'username profilePhoto',
    options: { lean: true }
  })
  .populate({
    path: 'following',
    select: 'username profilePhoto',
    options: { lean: true }
  })
  .lean();
    const tasks = await Task.find({ userId: req.user._id })
      .sort({ dueDate: 1 })
      .lean();
    // Initialize empty arrays if they don't exist
    user.followers = user.followers || [];
    user.following = user.following || [];
    user.followRequests = user.followRequests || [];

    const posts = await Post.find({ user: user._id }).lean();
    
    res.render('profile', { 
      user, 
      posts,
      tasks: tasks,
      profilePhoto: user.profilePhoto || '/images/default-avatar.png',
      hasTimetableScreenshot: !!user.timetableScreenshot,
      hasManualTimetable: !!user.timetableManual
    });
  } catch (err) {
    console.error('Profile page error:', err);
    res.status(500).render('error', { message: 'Failed to load profile' });
  }
});

router.post('/upload', isLoggedIn, (req, res) => {
  console.log('Upload route hit'); // Debug log
  upload(req, res, async (err) => {
    try {
      console.log('Multer processing started'); // Debug log
      
      if (err) {
        console.error('Multer error:', err);
        return res.status(400).json({ 
          error: err.message,
          code: err.code 
        });
      }

      console.log('File:', req.file); // Debug log - check if file exists
      
      if (!req.file) {
        console.log('No file received');
        return res.status(400).json({ error: 'No file uploaded' });
      }

      console.log('File uploaded to:', req.file.path); // Debug log
      
      const user = await User.findById(req.user._id);
      if (!user) {
        console.log('User not found');
        await cloudinary.uploader.destroy(req.file.filename);
        return res.status(404).json({ error: 'User not found' });
      }

      console.log('Old profile photo:', user.profilePhoto); // Debug log
      
      if (user.profilePhoto) {
        const publicId = user.profilePhoto.split('/').pop().split('.')[0];
        console.log('Deleting old photo with publicId:', publicId);
        await cloudinary.uploader.destroy(`PYQ/pages/${publicId}`);
      }

      user.profilePhoto = req.file.path;
if (user.gender && typeof user.gender === 'string') {
  user.gender = user.gender.charAt(0).toUpperCase() + user.gender.slice(1).toLowerCase();
}
await user.save();
      console.log('Profile updated successfully');

      res.json({ 
        success: true, 
        profilePhoto: req.file.path 
      });
      
    } catch (error) {
      console.error('Full error stack:', error.stack); // More detailed error
      if (req.file) {
        console.log('Cleaning up uploaded file due to error');
        await cloudinary.uploader.destroy(req.file.filename);
      }
      res.status(500).json({ 
        error: 'Failed to update profile photo',
        details: error.message 
      });
    }
  });
});
// Add this to your profile.js routes
router.post('/update', isLoggedIn, async (req, res) => {
  try {
    const { username, email, linkedinId, bio } = req.body;
    
    // Basic validation
    if (!username || !email) {
      return res.status(400).json({ error: 'Username and email are required' });
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { 
        username,
        email,
        linkedinId: linkedinId || null, // Set to null if empty
        bio: bio || null
      },
      { new: true }
    );
    
    res.redirect('/profile');
    
  } catch (err) {
    console.error('Profile update error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/timetable-manual', isLoggedIn, async (req, res) => {
  try {
    const { timetable } = req.body;
    if (!timetable) {
      return res.status(400).json({ error: 'Timetable data is required' });
    }

    await User.findByIdAndUpdate(req.user._id, { timetableManual: timetable });
    
    res.redirect('/profile');
    
  } catch (err) {
    console.error('Timetable save error:', err);
    res.status(500).json({ error: 'Failed to save timetable' });
  }
});

// In your posts routes file

// In your profile routes (profile.js)
// In your profile.js routes file
router.post('/upload-timetable', isLoggedIn, (req, res) => {
  upload(req, res, async (err) => {
    try {
      if (err) {
        return res.status(400).json({ error: err.message });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const user = await User.findById(req.user._id);
      if (!user) {
        await cloudinary.uploader.destroy(req.file.filename);
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete old screenshot if exists
      if (user.timetableScreenshot) {
        const publicId = user.timetableScreenshot.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`timetables/${publicId}`);
      }

      user.timetableScreenshot = req.file.path;
      await user.save();

      res.json({ 
        success: true, 
        timetableScreenshot: req.file.path 
      });
      
    } catch (error) {
      console.error('Timetable upload error:', error);
      if (req.file) {
        await cloudinary.uploader.destroy(req.file.filename);
      }
      res.status(500).json({ error: 'Failed to upload timetable' });
    }
  });
});

// Add route for deleting screenshot
router.post('/delete-timetable-screenshot', isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.timetableScreenshot) {
      const publicId = user.timetableScreenshot.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`timetables/${publicId}`);
      
      user.timetableScreenshot = undefined;
      await user.save();
    }

    res.json({ success: true });
    
  } catch (error) {
    console.error('Delete timetable error:', error);
    res.status(500).json({ error: 'Failed to delete timetable' });
  }
});

module.exports = router;
