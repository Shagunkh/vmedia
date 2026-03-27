const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    text: { 
        type: String, 
        required: true 
    },
    createdAt: { 
        type: Date, 
        default: Date.now 
    },
    likes: [{
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        }
    }],
    replies: [{
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        },
        text: String,
        createdAt: { 
            type: Date, 
            default: Date.now 
        },
        likes: [{
            user: { 
                type: mongoose.Schema.Types.ObjectId, 
                ref: 'User' 
            }
        }]
    }]
});
const postSchema = new mongoose.Schema({
    user: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    caption: {
        type: String,
        trim: true
    },
    imageUrl: {
        type: String
    },
    cloudinaryId: { type: String },
    likes: [{
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        }
    }],
    dislikes: [{
        user: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'User' 
        }
    }],
    comments: [commentSchema]
}, {
    timestamps: true 
});

module.exports = mongoose.model('Post', postSchema);
