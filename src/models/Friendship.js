const mongoose = require('mongoose');

const FriendshipSchema = new mongoose.Schema({
  users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  status: {
    type: String,
    enum: ['pending', 'accepted'],
    default: 'pending'
  },
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  streak: {
    type: Number,
    default: 0
  },
  lastStreakUpdate: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a user can't have duplicate friendships with the same person
FriendshipSchema.index({ users: 1 }, { unique: true });

module.exports = mongoose.model('Friendship', FriendshipSchema);