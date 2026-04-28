const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/auth');

router.get('/', (req, res) => {
  res.render('quizlet/quiz');
});

// Public SDG quiz — no login required
router.get('/sdg', (req, res) => {
  res.render('quizlet/sdg-quiz');
});

module.exports = router; // ✅ You forgot this
