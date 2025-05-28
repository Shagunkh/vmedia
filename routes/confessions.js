const express = require('express');
const router = express.Router();
const Confession = require('../models/Confession');
const { isLoggedIn } = require('../middleware/auth');

// GET: Main confession wall
router.get('/',async (req, res) => {
  const confessions = await Confession.find({})
    .sort({ createdAt: -1 })
    .limit(20);
  res.render('index', { confessions });
});

router.post('/submit',isLoggedIn, async (req, res) => {
  const { text, category } = req.body;
  console.log('Received:', text, category);  // Debug line

  if (!text || text.length < 10 || text.length > 500) {
    console.log('Validation failed');
    return res.redirect('/');
  }

  try {
    await new Confession({ text, category }).save();
    console.log('Confession saved successfully');
  } catch (err) {
    console.error('Save error:', err);
  }

  res.redirect('/');
});

router.post('/react/:id',isLoggedIn, async (req, res) => {
  const { reaction } = req.body;
  const confession = await Confession.findById(req.params.id);
  const sessionId = req.sessionID;

  if (!confession) return res.redirect('/confessions');

  const userReactions = confession.reactedBy.get(sessionId) || [];

  if (!userReactions.includes(reaction)) {
    if (confession.reactions[reaction] !== undefined) {
      confession.reactions[reaction]++;
    }
    userReactions.push(reaction);
    confession.reactedBy.set(sessionId, userReactions);
    await confession.save();
  }

  res.redirect('/confessions');
});

// Add this new route for comments
router.post('/:id/comment', async (req, res) => {
  const { text } = req.body;
  
  if (!text || text.length < 3 || text.length > 200) {
    return res.redirect('/confessions');
  }

  try {
    await Confession.findByIdAndUpdate(
      req.params.id,
      { $push: { comments: { text } } },
      { new: true }
    );
  } catch (err) {
    console.error('Comment error:', err);
  }

  res.redirect('/confessions');
});
module.exports = router;
