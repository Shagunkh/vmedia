const express = require('express');
const router = express.Router();
const Notification = require('../models/notification');
const { isLoggedIn } = require('../middleware/auth');

// Get all notifications for a user
router.get('/', isLoggedIn, async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipient: req.user._id
        })
        .sort({ createdAt: -1 })
        .populate('sender', 'username profilePhoto')
        .populate('relatedPost', 'imageUrl')
        .lean();

        // Mark all as read when user visits the page
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );

        res.render('notifications/index', { 
            notifications,
            pageTitle: 'Notifications'
        });
    } catch (err) {
        console.error('Error fetching notifications:', err);
        res.status(500).render('error', { error: 'Failed to load notifications' });
    }
});

// Mark all notifications as read
router.post('/mark-all-read', isLoggedIn, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );
        
        res.json({ success: true });
    } catch (err) {
        console.error('Error marking notifications as read:', err);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

// Delete a notification
router.delete('/:id', isLoggedIn, async (req, res) => {
    try {
        await Notification.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error('Error deleting notification:', err);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

module.exports = router;