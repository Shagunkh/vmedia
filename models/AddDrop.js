const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const addDropSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    currentSubject: {
        type: String,
        required: true
    },
    currentTeacher: {
        type: String,
        required: true
    },
    currentSlot: {
        type: String,
        required: true
    },
    desiredSubject: {
        type: String,
        required: true
    },
    desiredTeacher: {
        type: String,
        required: true
    },
    desiredSlot: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['open', 'in-progress', 'closed'],
        default: 'open'
    },
    chatRoomId: {
        type: String,
        default: null
    },
    interestedUser: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Add text index for search functionality
addDropSchema.index({
    currentSubject: 'text',
    currentTeacher: 'text',
    currentSlot: 'text',
    desiredSubject: 'text',
    desiredTeacher: 'text',
    desiredSlot: 'text'
});

module.exports = mongoose.model('AddDrop', addDropSchema);
