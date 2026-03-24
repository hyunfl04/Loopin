const User = require('../models/User');
const Friendship = require('../models/Friendship');
const Habit = require('../models/Habit');

// @desc    Search users by username
exports.searchUsers = async (req, res) => {
  try {
    const { username } = req.query;
    
    // 1. Find the users
    const users = await User.find({
      username: { $regex: username, $options: 'i' },
      _id: { $ne: req.user._id }
    }).select('username _id');

    // 2. Check friendship status for each found user
    const usersWithStatus = await Promise.all(users.map(async (user) => {
      const friendship = await Friendship.findOne({
        users: { $all: [req.user._id, user._id] }
      });

      return {
        _id: user._id,
        username: user.username,
        friendshipStatus: friendship ? friendship.status : null,
        isRequester: friendship ? friendship.requester.toString() === req.user._id.toString() : false
      };
    }));

    res.status(200).json({ success: true, data: usersWithStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Send friend request
exports.sendRequest = async (req, res) => {
  try {
    const recipientId = req.params.recipientId;
    const existing = await Friendship.findOne({
      users: { $all: [req.user._id, recipientId] }
    });

    if (existing) return res.status(400).json({ message: 'Request already exists' });

    await Friendship.create({
      users: [req.user._id, recipientId],
      requester: req.user._id,
      status: 'pending'
    });

    res.status(201).json({ success: true, message: 'Request sent! 💌' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Handle (Accept/Reject) Request
exports.handleRequest = async (req, res) => {
  const { senderId, action } = req.body;
  try {
    if (action === 'accept') {
      await Friendship.findOneAndUpdate(
        { users: { $all: [req.user._id, senderId] } },
        { status: 'accepted' }
      );
      return res.json({ success: true, message: 'Friend added! 🌱' });
    }
    await Friendship.findOneAndDelete({ users: { $all: [req.user._id, senderId] } });
    res.json({ success: true, message: 'Request removed' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    List Friends & Update Streaks
exports.getFriends = async (req, res) => {
  try {
    const friendships = await Friendship.find({
      users: req.user._id,
      status: 'accepted'
    }).populate('users', 'username');

    const friendsWithStreaks = await Promise.all(friendships.map(async (f) => {
      const friend = f.users.find(u => u._id.toString() !== req.user._id.toString());
      
      const userHabit = await Habit.findOne({ userId: req.user._id, lastCheckin: { $gte: new Date().setHours(0,0,0,0) } });
      const friendHabit = await Habit.findOne({ userId: friend._id, lastCheckin: { $gte: new Date().setHours(0,0,0,0) } });

      if (userHabit && friendHabit) {
          const today = new Date().setHours(0,0,0,0);
          const lastUpdate = f.lastStreakUpdate ? new Date(f.lastStreakUpdate).setHours(0,0,0,0) : null;
          
          if (lastUpdate !== today) {
              f.streak += 1;
              f.lastStreakUpdate = new Date();
              await f.save();
          }
      }

      return {
        _id: friend._id,
        username: friend.username,
        streak: f.streak
      };
    }));

    res.json({ success: true, data: friendsWithStreaks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}; // Fixed closing brace here

// @desc    Remove a friend
exports.unfriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    const friendship = await Friendship.findOneAndDelete({
      users: { $all: [req.user._id, friendId] }
    });

    if (!friendship) {
      return res.status(404).json({ success: false, message: 'Friendship not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Friend removed. Shared streaks have been reset. 🗑️'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// @desc    Get my pending friend requests
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await Friendship.find({
      users: req.user._id, // Find friendships involving the user
      status: 'pending',
      requester: { $ne: req.user._id } // Where the user is NOT the one who sent it (meaning you are the recipient)
    }).populate('requester', 'username'); 

    const formattedRequests = requests.map(r => ({
      _id: r._id,
      sender: r.requester 
    }));

    res.json({ success: true, requests: formattedRequests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};