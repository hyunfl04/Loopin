const User = require('../models/User');
const Habit = require('../models/Habit');

// @desc    Get system-wide stats and all users
// @route   GET /api/admin/dashboard
exports.getAdminDashboard = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalHabits = await Habit.countDocuments();
        const users = await User.find().select('-password').sort({ createdAt: -1 });

        res.json({
            success: true,
            stats: { totalUsers, totalHabits },
            users
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error fetching admin data" });
    }
};

// @desc    Delete a user and their associated habits
// @route   DELETE /api/admin/user/:id
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        
        // Don't let an admin delete themselves by accident
        if (userId === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: "You cannot delete your own admin account." });
        }

        await User.findByIdAndDelete(userId);
        await Habit.deleteMany({ userId: userId });

        res.json({ success: true, message: "User and all their habits deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: "Failed to delete user" });
    }
};