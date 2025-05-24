const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const GroupChat = require('./GroupChat');

const roomSchema = new Schema({
  creator: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true,
    min: 2,
    max: 4
  },
  course: {
    type: String,
    required: true
  },
  year: {
    type: String,
    required: true
  },
   hostel: {
    type: String,
    enum: ['Male', 'Female'],
    required: true
  },
  interests: {
    type: [String],
    default: []
  },
  whatsappNumber: {
    type: String,
    required: true
  },
  members: [{
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted'],
      default: 'pending'
    }
  }],
  isFull: {
    type: Boolean,
    default: false
  },
  groupChat: {
    type: Schema.Types.ObjectId,
    ref: 'GroupChat'
  }
}, { timestamps: true });

// Add member to room
roomSchema.methods.addMember = async function(userId) {
  if (this.isFull) throw new Error('Room is full');
  if (this.members.some(m => m.user.equals(userId))) throw new Error('Already in room');
  
  this.members.push({ user: userId, status: 'pending' });
  await this.save();
};

// Accept member
roomSchema.methods.acceptMember = async function(userId) {
  const member = this.members.find(m => m.user.equals(userId));
  if (!member) throw new Error('Member not found');
  
  member.status = 'accepted';
  this.isFull = this.members.filter(m => m.status === 'accepted').length + 1 >= this.size;
  
  if (this.isFull && !this.groupChat) {
    const groupChat = new GroupChat({
      room: this._id,
      members: [this.creator, ...this.members
        .filter(m => m.status === 'accepted')
        .map(m => m.user)]
    });
    
    await groupChat.save();
    this.groupChat = groupChat._id;
  }
  
  await this.save();
};

module.exports = mongoose.model('Room', roomSchema);