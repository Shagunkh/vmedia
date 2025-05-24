const express = require('express');
const router = express.Router();
const multer = require('multer');
const { storage, cloudinary } = require("../cloudConfig");
const upload = multer({ storage });
const PYQ = require('../models/pyq');
const fs = require('fs');

// Get all PYQs with optional search
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        
        if (search) {
            query = {
                $or: [
                    { subject: { $regex: search, $options: 'i' } },
                    { examType: { $regex: search, $options: 'i' } },
                    { slots: { $regex: search, $options: 'i' } }
                ]
            };
        }

        const pyqs = await PYQ.find(query).sort({ uploadedAt: -1 });
        res.render('./paper/pyq.ejs', { pyqs, search: search || '' });
    } catch (error) {
        console.error('Error fetching PYQs:', error);
        res.status(500).render('error', { error: 'Failed to fetch PYQs' });
    }
});

// Upload new PYQ with multiple pages (API endpoint)
router.post('/upload', upload.array('pages'), async (req, res) => {
    try {
        const { subject, examType, slots, pageCount } = req.body;
        
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'No files uploaded' });
        }

        const pages = req.files.map((file, index) => ({
            pageNumber: index + 1,
            fileUrl: file.path
        }));

        const newPYQ = new PYQ({ subject, examType, slots, pages });
        await newPYQ.save();
        
        res.json({ success: true, redirect: '/api/pyq' });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;