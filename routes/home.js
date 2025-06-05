

const express = require('express');
const router = express.Router();
const User = require('../models/user'); 
const ViewCount = require('../models/ViewCount'); // Make sure to import your User model

router.get('/', async (req, res) => {
  try {
    // Get the count of users in the database
    const userCount = await User.countDocuments();
    res.render('home/homepage.ejs', { userCount });
  } catch (err) {
    console.error('Error fetching user count:', err);
    // Fallback to showing "5,000+" if there's an error
    res.render('home/homepage.ejs', { userCount: 5000 });
  }
});




// In your routes file
router.get('/api/users/count', async (req, res) => {
  try {
    const count = await User.countDocuments();
    res.json({ count });
  } catch (err) {
    console.error('Error counting users:', err);
    res.status(500).json({ error: 'Could not get user count' });
  }
});
router.get('/api/views/increment', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    let viewRecord = await ViewCount.findOne({ date: today });
    
    if (!viewRecord) {
      viewRecord = new ViewCount({ date: today, count: 0 });
    }
    
    viewRecord.count += 1;
    await viewRecord.save();
    
    const totalViews = await ViewCount.aggregate([
      { $group: { _id: null, total: { $sum: "$count" } } }
    ]);
    
    res.json({ 
      success: true,
      total: totalViews[0]?.total || 0 
    });
  } catch (err) {
    console.error('Error tracking view:', err);
    res.status(500).json({ error: 'Could not track view' });
  }
});

// Get total views
router.get('/api/views/total', async (req, res) => {
  try {
    const totalViews = await ViewCount.aggregate([
      { $group: { _id: null, total: { $sum: "$count" } } }
    ]);
    
    res.json({ 
      total: totalViews[0]?.total || 0 
    });
  } catch (err) {
    console.error('Error getting total views:', err);
    res.status(500).json({ error: 'Could not get view count' });
  }
});


module.exports = router; // ✅ You forgot this
