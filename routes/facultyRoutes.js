const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();
const Faculty = require('../models/Faculty');
const FacultyReview = require('../models/FacultyReview');
const { isLoggedIn } = require('../middleware/auth');

// Ensure text index exists (run once)
Faculty.createIndexes().catch(err => console.error('Index creation error:', err));

router.get('/', async (req, res) => {
  res.render('./faculty/review.ejs');
});

// Search faculty
router.get('/search',async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }

        const results = await Faculty.find(
            { $text: { $search: query } },
            { score: { $meta: "textScore" } }
        )
        .sort({ score: { $meta: "textScore" } })
        .limit(5);
        
        res.json(results);
    } catch (err) {
        console.error('Faculty search error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get faculty reviews
router.get('/:id/reviews',isLoggedIn, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ error: 'Invalid faculty ID' });
        }

        const reviews = await FacultyReview.find({ facultyId: req.params.id })
            .sort({ createdAt: -1 });
            
        res.json(reviews);
    } catch (err) {
        console.error('Get reviews error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Submit review
router.post('/facultyReviews',isLoggedIn, async (req, res) => {
    try {
        const { facultyId, rating, reviewText } = req.body;
        
        // Validate input
        if (!facultyId || !rating || !reviewText) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!mongoose.Types.ObjectId.isValid(facultyId)) {
            return res.status(400).json({ error: 'Invalid faculty ID' });
        }

        const ratingNum = parseInt(rating);
        if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
            return res.status(400).json({ error: 'Invalid rating value' });
        }

        // Check if faculty exists
        const facultyExists = await Faculty.findById(facultyId);
        if (!facultyExists) {
            return res.status(404).json({ error: 'Faculty not found' });
        }

        const review = new FacultyReview({
            facultyId,
            rating: ratingNum,
            reviewText,
            reviewerId: req.user?._id || null // Add if you have user auth
        });

        await review.save();
        res.status(201).json(review);
    } catch (err) {
        console.error('Review submission error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Register new faculty
router.post('/', isLoggedIn,async (req, res) => {
    try {
        const { name, department, email } = req.body;
        
        if (!name || !department) {
            return res.status(400).json({ error: 'Name and department are required' });
        }

        // Check if faculty already exists
        const existingFaculty = await Faculty.findOne({ name });
        if (existingFaculty) {
            return res.status(400).json({ error: 'Faculty with this name already exists' });
        }

        const faculty = new Faculty({ 
            name, 
            department,
            email: email || undefined
        });

        await faculty.save();
        res.status(201).json(faculty);
    } catch (err) {
        console.error('Faculty registration error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;