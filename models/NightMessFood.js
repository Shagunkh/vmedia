const mongoose = require('mongoose');

const nightMessFoodSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        default: 0,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['Snacks', 'Beverages', 'Meals', 'Desserts', 'Burgers', 'Pizza', 'Others']
    },
    hostelBlock: {
        type: String,
        required: true,
        enum: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T']
    },
    tags: [{
        type: String,
        trim: true
    }],
    images: [{
        type: String
    }],
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    vendorPhone: {
        type: String,
        required: true,
        trim: true
    },
    vendorEmail: {
        type: String,
        required: true
    },
    // ✅ FIX: Added 'hidden' to enum
    status: {
        type: String,
        enum: ['available', 'sold_out', 'unavailable', 'hidden'],
        default: 'available'
    },
    views: {
        type: Number,
        default: 0
    },
    interestedBuyers: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        initiatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    chatRooms: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        roomId: String,
        lastMessage: String,
        lastMessageTime: Date,
        unreadCount: {
            type: Number,
            default: 0
        }
    }],
    reviews: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        },
        review: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    averageRating: {
        type: Number,
        default: 0
    },
    totalReviews: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

nightMessFoodSchema.index({ title: 'text', description: 'text', tags: 'text', hostelBlock: 1 });

module.exports = mongoose.model('NightMessFood', nightMessFoodSchema);