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

const dealConfirmationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    confirmedAt: {
        type: Date,
        default: Date.now
    }
});

const queuedBuyerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    queuedAt: {
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
    status: {
        type: String,
        enum: ['available', 'sold', 'reserved', 'hidden', 'expired'],
        default: 'available'
    },
    // Deal confirmation fields
    dealStatus: {
        type: String,
        enum: ['pending', 'buyer_confirmed', 'seller_confirmed', 'both_confirmed', 'sold', 'expired'],
        default: 'pending'
    },
    dealConfirmations: [dealConfirmationSchema],
    // The specific buyer the active deal is locked to
    pendingDealWith: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    // Buyers who tried to confirm while a deal is locked with someone else
    queuedBuyers: [queuedBuyerSchema],
    interestCreatedAt: {
        type: Date,
        default: null
    },
    lastReminderSent: {
        type: Date,
        default: null
    },
    reminderCount: {
        type: Number,
        default: 0
    },
    autoMarkSoldAt: {
        type: Date,
        default: null
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

// Indexes for deal monitoring
productSchema.index({ dealStatus: 1, createdAt: 1 });
productSchema.index({ interestCreatedAt: 1, status: 1 });
productSchema.index({ autoMarkSoldAt: 1 });

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
    const existingReview = this.reviews.find(
        review => review.user.toString() === userId.toString()
    );
    
    if (existingReview) {
        throw new Error('You have already reviewed this product');
    }
    
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
        review.helpful = review.helpful.filter(
            help => help.user.toString() !== userId.toString()
        );
    } else {
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

// Deal confirmation methods - FIXED with buyer-locking & queueing
productSchema.methods.addDealConfirmation = async function(userId, role, buyerId) {
    const userIdStr = userId.toString();
    const sellerStr = this.seller.toString();

    // Already confirmed?
    if (this.dealConfirmations.some(conf => conf.user.toString() === userIdStr)) {
        return { success: false, message: 'You already confirmed this deal' };
    }

    // If a deal is already locked with someone else and current user is a buyer...
    if (this.pendingDealWith && role === 'buyer') {
        const pendingStr = this.pendingDealWith.toString();
        if (pendingStr !== userIdStr) {
            // Add to queue if not already there
            const alreadyQueued = this.queuedBuyers.some(q => q.user.toString() === userIdStr);
            if (!alreadyQueued) {
                this.queuedBuyers.push({ user: userId });
                await this.save();
            }
            return {
                success: false,
                queued: true,
                message: 'A deal is currently ongoing with another buyer. You have been added to the queue. Please contact the seller directly to confirm availability.',
                sellerPhone: this.sellerPhone,
                sellerEmail: this.sellerEmail
            };
        }
    }

    // Push this confirmation
    this.dealConfirmations.push({ user: userId });

    if (this.dealConfirmations.length === 1) {
        // First confirmation — lock the deal to the buyer
        if (role === 'buyer') {
            this.pendingDealWith = userId;
            this.dealStatus = 'buyer_confirmed';
        } else {
            // Seller confirming first: lock to the specified buyerId
            if (buyerId) {
                this.pendingDealWith = buyerId;
            }
            this.dealStatus = 'seller_confirmed';
        }
        this.autoMarkSoldAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
    } else if (this.dealConfirmations.length === 2) {
        // Second confirmation — verify it's the locked-in buyer OR the seller
        const confirmedUsers = this.dealConfirmations.map(c => c.user.toString());
        const sellerConfirmed = confirmedUsers.includes(sellerStr);
        const pendingBuyerConfirmed = this.pendingDealWith &&
            confirmedUsers.includes(this.pendingDealWith.toString());

        if (!sellerConfirmed || !pendingBuyerConfirmed) {
            // Someone unexpected snuck a confirmation — reject it
            this.dealConfirmations.pop();
            await this.save();
            return { success: false, message: 'Invalid deal confirmation. Deal is locked with a specific buyer.' };
        }

        this.dealStatus = 'both_confirmed';
        this.status = 'sold';
        this.soldDate = new Date();
        this.buyer = this.pendingDealWith;
        this.autoMarkSoldAt = null;
    }

    await this.save();

    return {
        success: true,
        dealStatus: this.dealStatus,
        bothConfirmed: this.dealStatus === 'both_confirmed'
    };
};

// Cancel a deal — can be triggered by seller or pending buyer
productSchema.methods.cancelDeal = async function(userId) {
    const userIdStr = userId.toString();
    const sellerStr = this.seller.toString();
    const pendingStr = this.pendingDealWith ? this.pendingDealWith.toString() : null;

    const isSeller = userIdStr === sellerStr;
    const isPendingBuyer = pendingStr && userIdStr === pendingStr;

    if (!isSeller && !isPendingBuyer) {
        return { success: false, message: 'You are not authorised to cancel this deal.' };
    }

    if (this.dealStatus === 'both_confirmed' || this.status === 'sold') {
        return { success: false, message: 'The deal is already completed and cannot be cancelled.' };
    }

    const cancelledWith = this.pendingDealWith;
    // Reset deal state
    this.dealConfirmations = [];
    this.pendingDealWith = null;
    this.dealStatus = 'pending';
    this.autoMarkSoldAt = null;

    await this.save();

    return { success: true, cancelledWith, queuedBuyers: this.queuedBuyers };
};

// Method to check if deal is stale
productSchema.methods.isDealStale = function() {
    if (!this.interestCreatedAt) return false;
    const daysSinceInterest = (Date.now() - this.interestCreatedAt) / (1000 * 60 * 60 * 24);
    return daysSinceInterest >= 10; // 10 days
};

module.exports = mongoose.model('Product', productSchema);