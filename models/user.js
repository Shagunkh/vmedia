const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const passportLocalMongoose = require("passport-local-mongoose");

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  profilePhoto: {
    type: String
  },
  timetableManual: {
    type: Object,
    default: {}
  },
  gender: {
  type: String,
  enum: ['Male', 'male', 'Female', 'female', 'Other', 'other', 'Prefer not to say']
},
  collegeYear: {
    type: Number,
    min: 1,
    max: 4
   
  },

  // New fields added here
  linkedinId: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        // Simple validation for LinkedIn ID format (5-30 alphanumeric chars)
        return /^[a-zA-Z0-9-]{5,30}$/.test(v);
      },
      message: props => `${props.value} is not a valid LinkedIn ID!`
    }
  },
  bio: {
    type: String,
    maxlength: 250,
    trim: true
  },
  // Existing fields below
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  followRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  sentFollowRequests: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  privacy: {
    showTimetable: { type: Boolean, default: true },
    showPosts: { type: Boolean, default: true },
    followApprovalRequired: { type: Boolean, default: true }
  },
  isAvailableForRandomChat: {
    type: Boolean,
    default: false
  },
  currentRandomChat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RandomChat'
  },
  randomChatHistory: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RandomChat'
  }],
  roomsCreated: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
   timetableManual: Object,
  timetableScreenshot: String,
  roomsJoined: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room'
  }],
  groupChats: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GroupChat'
  }]
}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

userSchema.index({ followers: 1 });
userSchema.index({ following: 1 });
userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', userSchema);
