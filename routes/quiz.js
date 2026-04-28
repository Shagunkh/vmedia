const express = require('express');
const router = express.Router();
const { isLoggedIn } = require('../middleware/auth');

router.get('/', (req, res) => {
  res.render('quizlet/quiz');
});

const SdgQuizStat = require('../models/SdgQuizStats');

// Public SDG quiz — no login required
router.get('/sdg', async (req, res) => {
  try {
    let stat = await SdgQuizStat.findOne({ page: 'sdg-quiz' });
    if (!stat) {
      stat = new SdgQuizStat({ page: 'sdg-quiz', views: 0 });
    }
    stat.views += 1;
    await stat.save();
    
    res.render('quizlet/sdg-quiz', { viewCount: stat.views });
  } catch (err) {
    console.error('Error tracking SDG quiz views:', err);
    res.render('quizlet/sdg-quiz', { viewCount: '100+' }); // fallback
  }
});

module.exports = router; // ✅ You forgot this
