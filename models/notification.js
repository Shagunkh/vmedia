const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: [
            'like', 
            'comment', 
            'reply', 
            'follow', 
            'follow-request', 
            'follow-accepted',
            'collab-request',
            'collab-accepted',
            'collab-message',
            'system'
        ]
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    relatedPost: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Post'
    },
    relatedComment: {
        type: mongoose.Schema.Types.ObjectId
    },
    relatedReply: {
        type: mongoose.Schema.Types.ObjectId
    }
}, { timestamps: true });

// Indexes for better performance
notificationSchema.index({ recipient: 1, isRead: 1 });
notificationSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);