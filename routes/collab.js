const express = require('express');
const router = express.Router();
const CollabProject = require('../models/CollabRequest');
const User = require('../models/user');

// Ensure login
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('users/login');
}

// GET: List with filtering and pagination
router.get('/', isLoggedIn, async (req, res) => {
  const { q, page = 1 } = req.query;
  const limit = 10;
  const skip = (page - 1) * limit;

  const query = q
    ? {
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { tags: { $regex: q, $options: 'i' } }
        ]
      }
    : {};

  const total = await CollabProject.countDocuments(query);
  const projects = await CollabProject.find(query)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('creator', 'username')
    .populate('joinRequests', 'username')
    .populate('teamMembers', 'username');

  res.render('collab/index', {
    projects,
    q,
    currentPage: parseInt(page),
    totalPages: Math.ceil(total / limit),
    user: req.user || null
  });
});

// POST: Submit new project
router.post('/submit', isLoggedIn, async (req, res) => {
  const { title, description, tags, teamSize } = req.body;
  const project = new CollabProject({
    title,
    description,
    tags: tags.split(',').map(t => t.trim()),
    teamSize,
    creator: req.user._id
  });
  await project.save();
  res.redirect('/collab');
});


// POST: Join request
router.post('/join/:id', isLoggedIn, async (req, res) => {
  const project = await CollabProject.findById(req.params.id);
  if (
    project.creator.toString() !== req.user._id.toString() &&
    !project.joinRequests.includes(req.user._id) &&
    !project.teamMembers.includes(req.user._id) &&
    project.teamMembers.length < project.teamSize
  ) {
    project.joinRequests.push(req.user._id);
    await project.save();
  }
  res.redirect('/collab');
});


// POST: Handle join request (accept/reject)
router.post('/handle-request/:projectId/:userId', isLoggedIn, async (req, res) => {
  const { action } = req.body;
  const { projectId, userId } = req.params;

  const project = await CollabProject.findById(projectId);
  if (!project.creator.equals(req.user._id)) return res.status(403).send('Forbidden');

  // Accept: move from joinRequests to teamMembers
  if (action === 'accept') {
    if (!project.teamMembers.includes(userId)) {
      project.teamMembers.push(userId);
    }
  }
  // Remove from joinRequests regardless
  project.joinRequests = project.joinRequests.filter(id => id.toString() !== userId);
  await project.save();

  res.redirect('/collab');
});

module.exports = router;
