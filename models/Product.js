const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    title: {
        type: String,
        trim: true,
        maxlength: 100
    },
    images: [{
        type: String
    }],
    isVerifiedPurchase: {
        type: Boolean,
        default: false
    },
    helpful: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    replies: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        comment: {
            type: String,
            required: true,
            maxlength: 500
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

const productSchema = new mongoose.Schema({
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
        required: true,
        min: 0
    },
    category: {
        type: String,
        required: true,
        enum: ['Books', 'Electronics', 'Furniture', 'Clothing', 'Stationery', 'Sports', 'Others']
    },
    tags: [{
        type: String,
        trim: true
    }],
    images: [{
        type: String
    }],
    condition: {
        type: String,
        enum: ['New', 'Like New', 'Good', 'Fair', 'Poor'],
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    sellerPhone: {
        type: String,
        required: true,
        trim: true
    },
    sellerEmail: {
        type: String,
        required: true
    },
    // ✅ FIX: Added 'hidden' to enum
    status: {
        type: String,
        enum: ['available', 'sold', 'reserved', 'hidden'],
        default: 'available'
    },
    buyer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    soldDate: {
        type: Date
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
    // Reviews Section
    reviews: [reviewSchema],
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    },
    ratingDistribution: {
        1: { type: Number, default: 0 },
        2: { type: Number, default: 0 },
        3: { type: Number, default: 0 },
        4: { type: Number, default: 0 },
        5: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

// Index for search
productSchema.index({ title: 'text', description: 'text', tags: 'text' });

// Method to update average rating and distribution
productSchema.methods.updateRatingStats = async function() {
    const totalRatings = this.reviews.length;
    if (totalRatings === 0) {
        this.averageRating = 0;
        this.totalReviews = 0;
        this.ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    } else {
        let sum = 0;
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        
        this.reviews.forEach(review => {
            sum += review.rating;
            distribution[review.rating]++;
        });
        
        this.averageRating = sum / totalRatings;
        this.totalReviews = totalRatings;
        this.ratingDistribution = distribution;
    }
    await this.save();
};

// Method to add a review
productSchema.methods.addReview = async function(userId, reviewData) {
    // Check if user already reviewed this product
    const existingReview = this.reviews.find(
        review => review.user.toString() === userId.toString()
    );
    
    if (existingReview) {
        throw new Error('You have already reviewed this product');
    }
    
    // Check if user purchased this product (optional)
    const Transaction = require('./Transaction');
    const hasPurchased = await Transaction.findOne({
        product: this._id,
        buyer: userId,
        status: 'completed'
    });
    
    const review = {
        user: userId,
        rating: reviewData.rating,
        review: reviewData.review,
        title: reviewData.title || '',
        images: reviewData.images || [],
        isVerifiedPurchase: !!hasPurchased,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    this.reviews.push(review);
    await this.updateRatingStats();
    
    return review;
};

// Method to update a review
productSchema.methods.updateReview = async function(userId, reviewData) {
    const review = this.reviews.find(
        review => review.user.toString() === userId.toString()
    );
    
    if (!review) {
        throw new Error('Review not found');
    }
    
    review.rating = reviewData.rating;
    review.review = reviewData.review;
    review.title = reviewData.title || review.title;
    review.updatedAt = new Date();
    
    await this.updateRatingStats();
    return review;
};

// Method to delete a review
productSchema.methods.deleteReview = async function(userId) {
    const reviewIndex = this.reviews.findIndex(
        review => review.user.toString() === userId.toString()
    );
    
    if (reviewIndex === -1) {
        throw new Error('Review not found');
    }
    
    this.reviews.splice(reviewIndex, 1);
    await this.updateRatingStats();
};

// Method to mark review as helpful
productSchema.methods.markReviewHelpful = async function(reviewId, userId) {
    const review = this.reviews.id(reviewId);
    if (!review) {
        throw new Error('Review not found');
    }
    
    const alreadyHelped = review.helpful.some(
        help => help.user.toString() === userId.toString()
    );
    
    if (alreadyHelped) {
        // Remove helpful mark
        review.helpful = review.helpful.filter(
            help => help.user.toString() !== userId.toString()
        );
    } else {
        // Add helpful mark
        review.helpful.push({ user: userId, createdAt: new Date() });
    }
    
    await this.save();
    return review;
};

// Method to add reply to review
productSchema.methods.addReviewReply = async function(reviewId, userId, comment) {
    const review = this.reviews.id(reviewId);
    if (!review) {
        throw new Error('Review not found');
    }
    
    review.replies.push({
        user: userId,
        comment: comment,
        createdAt: new Date()
    });
    
    await this.save();
    return review;
};

module.exports = mongoose.model('Product', productSchema);