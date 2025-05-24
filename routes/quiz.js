const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/auth');

router.get('/', isLoggedIn, (req, res) => {
  res.render('quizlet/quiz');
});

module.exports = router; // ✅ You forgot this
