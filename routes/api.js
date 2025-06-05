const express = require('express');
const router = express.Router();


// Auth status endpoint
router.get('/auth/status', (req, res) => {
  res.json({ 
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    user: req.user || null
  });
});
router.get('/', (req, res) => {
  // If user is already logged in, redirect to main page
  if (req.isAuthenticated()) {
    return res.redirect('/');
  }
  // Otherwise render the home page
  res.render('homepage'); // Assuming you have a home.ejs view
});

module.exports = router;
