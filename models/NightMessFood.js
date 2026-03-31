const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    itemName: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
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

const nightMessFoodSchema = new mongoose.Schema({
    vendorName: {
        type: String,
        required: true,
        trim: true
    },
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
    hostelType: {
        type: String,
        enum: ['men', 'women'],
        required: true,
        default: 'men'
    },
    menuItems: [menuItemSchema],
    images: [{
        url: String,
        public_id: String
    }],
    status: {
        type: String,
        enum: ['available', 'sold_out', 'unavailable', 'hidden', 'expired'],
        default: 'available'
    },
    // Deal confirmation fields
    dealStatus: {
        type: String,
        enum: ['pending', 'buyer_confirmed', 'vendor_confirmed', 'both_confirmed', 'sold', 'expired'],
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

// Indexes for deal monitoring
nightMessFoodSchema.index({ dealStatus: 1, createdAt: 1 });
nightMessFoodSchema.index({ interestCreatedAt: 1, status: 1 });
nightMessFoodSchema.index({ autoMarkSoldAt: 1 });

nightMessFoodSchema.index({ vendorName: 'text', category: 'text', 'menuItems.itemName': 'text', hostelBlock: 1, hostelType: 1 });

// Deal confirmation methods - FIXED with buyer-locking & queueing
nightMessFoodSchema.methods.addDealConfirmation = async function(userId, role, buyerId) {
    const userIdStr = userId.toString();
    const vendorStr = this.vendor.toString();

    if (this.dealConfirmations.some(conf => conf.user.toString() === userIdStr)) {
        return { success: false, message: 'You already confirmed this deal' };
    }

    // If a deal is locked with someone else and current user is a buyer
    if (this.pendingDealWith && role === 'buyer') {
        const pendingStr = this.pendingDealWith.toString();
        if (pendingStr !== userIdStr) {
            const alreadyQueued = this.queuedBuyers.some(q => q.user.toString() === userIdStr);
            if (!alreadyQueued) {
                this.queuedBuyers.push({ user: userId });
                await this.save();
            }
            return {
                success: false,
                queued: true,
                message: 'A deal is currently ongoing with another buyer. You have been added to the queue. Please contact the vendor directly to confirm availability.',
                sellerPhone: this.vendorPhone,
                sellerEmail: this.vendorEmail
            };
        }
    }

    this.dealConfirmations.push({ user: userId });

    if (this.dealConfirmations.length === 1) {
        if (role === 'buyer') {
            this.pendingDealWith = userId;
            this.dealStatus = 'buyer_confirmed';
        } else {
            if (buyerId) this.pendingDealWith = buyerId;
            this.dealStatus = 'vendor_confirmed';
        }
        this.autoMarkSoldAt = new Date(Date.now() + 3 * 60 * 60 * 1000);
    } else if (this.dealConfirmations.length === 2) {
        const confirmedUsers = this.dealConfirmations.map(c => c.user.toString());
        const vendorConfirmed = confirmedUsers.includes(vendorStr);
        const pendingBuyerConfirmed = this.pendingDealWith &&
            confirmedUsers.includes(this.pendingDealWith.toString());

        if (!vendorConfirmed || !pendingBuyerConfirmed) {
            this.dealConfirmations.pop();
            await this.save();
            return { success: false, message: 'Invalid deal confirmation. Deal is locked with a specific buyer.' };
        }

        this.dealStatus = 'both_confirmed';
        this.status = 'sold_out';
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

// Cancel a deal
nightMessFoodSchema.methods.cancelDeal = async function(userId) {
    const userIdStr = userId.toString();
    const vendorStr = this.vendor.toString();
    const pendingStr = this.pendingDealWith ? this.pendingDealWith.toString() : null;

    const isVendor = userIdStr === vendorStr;
    const isPendingBuyer = pendingStr && userIdStr === pendingStr;

    if (!isVendor && !isPendingBuyer) {
        return { success: false, message: 'You are not authorised to cancel this deal.' };
    }

    if (this.dealStatus === 'both_confirmed' || this.status === 'sold_out') {
        return { success: false, message: 'The deal is already completed and cannot be cancelled.' };
    }

    const cancelledWith = this.pendingDealWith;
    this.dealConfirmations = [];
    this.pendingDealWith = null;
    this.dealStatus = 'pending';
    this.autoMarkSoldAt = null;

    await this.save();

    return { success: true, cancelledWith, queuedBuyers: this.queuedBuyers };
};

// Method to check if deal is stale
nightMessFoodSchema.methods.isDealStale = function() {
    if (!this.interestCreatedAt) return false;
    const daysSinceInterest = (Date.now() - this.interestCreatedAt) / (1000 * 60 * 60 * 24);
    return daysSinceInterest >= 10;
};

module.exports = mongoose.model('NightMessFood', nightMessFoodSchema);