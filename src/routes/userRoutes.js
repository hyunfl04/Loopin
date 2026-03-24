const express = require('express');
const router = express.Router();
const User = require('../models/User');
const webpush = require('../config/webpush'); // Bug 4 fix: dùng shared instance
const { protect } = require('../middleware/authMiddleware');
router.get('/vapid-public-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});
// Save Push Subscription
router.post('/save-subscription', protect, async (req, res) => {
  try {
    const { userId, subscription } = req.body;
    
    if (!userId || !subscription) {
      return res.status(400).json({ success: false, message: 'User ID and subscription are required' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.subscription = subscription;
    await user.save();

    res.json({ success: true, message: 'Subscription saved successfully' });
  } catch (err) {
    console.error('Error saving subscription:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
// 2. Get User Profile (Fixes the 404 error)
router.get('/profile', async (req, res) => {
  try {
    const userId = req.query.userId; 
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 3. Update User Profile
router.put('/update-profile',  async (req, res) => {
  try {
    const { userId, username, email, avatar } = req.body;
    
    const user = await User.findByIdAndUpdate(
      userId, 
      { username, email, avatar },
      { new: true }
    ).select('-password');

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, message: 'Profile updated!', data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});
router.post('/test-notification', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || !user.subscription) {
      return res.status(404).json({ message: 'No subscription found for this user.' });
    }

    const payload = JSON.stringify({
      title: 'Test from Loopin! 🐥',
      body: 'Your notification system is officially working.',
      icon: '/images/logo.png'
    });

    await webpush.sendNotification(user.subscription, payload);
    res.json({ success: true, message: 'Test notification sent!' });
  } catch (err) {
    console.error('Error sending test notification:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;