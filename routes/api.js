const express = require('express');
const router = express.Router();

// Auth status endpoint
router.get('/auth/status', (req, res) => {
  res.json({ 
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    user: req.user || null
  });
});

module.exports = router;