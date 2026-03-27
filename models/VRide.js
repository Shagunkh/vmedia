const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VRideSchema = new Schema({
    creator: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    from: {
        type: String,
        required: [true, 'From location is required'],
        trim: true
    },
    to: {
        type: String,
        required: [true, 'To location is required'],
        trim: true
    },
    date: {
        type: Date,
        required: [true, 'Date is required']
    },
    time: {
        type: String,
        required: [true, 'Time is required']
    },
    totalSeats: {
        type: Number,
        required: [true, 'Total seats is required'],
        min: [1, 'Minimum 1 seat required'],
        max: [4, 'Maximum 4 seats allowed']
    },
    seatsAvailable: {
        type: Number,
        default: function() {
            return this.totalSeats; // Default to totalSeats value
        }
    },
    totalFare: {
        type: Number,
        required: [true, 'Total fare is required'],
        min: [0, 'Fare cannot be negative']
    },
    perPersonFare: {
        type: Number,
        default: function() {
            return Math.ceil(this.totalFare / this.totalSeats);
        }
    },
    mobileNumber: {
        type: String,
        required: [true, 'Mobile number is required'],
        validate: {
            validator: function(v) {
                return /^[0-9]{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    whatsappNumber: {
        type: String,
        required: [true, 'WhatsApp number is required'],
        validate: {
            validator: function(v) {
                return /^[0-9]{10}$/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        }
    },
    joinedUsers: [{
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User'
        },
        mobileNumber: String,
        joinedAt: {
            type: Date,
            default: Date.now
        }
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Remove the pre-save hook since we're using defaults
// VRideSchema.pre('save', function(next) {
//     this.perPersonFare = Math.ceil(this.totalFare / this.totalSeats);
//     this.seatsAvailable = this.totalSeats;
//     next();
// });

module.exports = mongoose.model('VRide', VRideSchema);