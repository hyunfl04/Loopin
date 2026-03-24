const Habit = require('../models/Habit');
const User = require('../models/User');


// @desc    Get all habits for user
// @route   GET /api/habits
// @access  Private
exports.getHabits = async (req, res) => {
  try {
    const habits = await Habit.find({ 
      userId: req.user._id,
      isActive: true 
    }).sort({ createdAt: -1 });

    // CẬP NHẬT QUAN TRỌNG: 
    // Duyệt qua từng habit để kiểm tra và reset streak nếu người dùng bỏ lỡ ngày hôm qua
    const habitsWithStatus = await Promise.all(habits.map(async (habit) => {
      
      // Gọi hàm reset streak (đảm bảo hàm này trong Habit.js có lệnh this.save())
      await habit.resetStreakIfMissed(); 

      return {
        ...habit.toObject(),
        isCheckedInToday: habit.hasCheckedInToday()
      };
    }));

    res.status(200).json({
      success: true,
      count: habits.length,
      data: { habits: habitsWithStatus }
    });
  } catch (error) {
    console.error('Get habits error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching habits',
      error: error.message
    });
  }
};

// @desc    Create new habit
// @route   POST /api/habits
// @access  Private
exports.createHabit = async (req, res) => {
  try {
    const { name, goal, icon, color, reminderTime, motivation } = req.body;
    const goalUnit = goal?.unit || 'times';
    const goalValue = goal?.value || 1;
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a habit name'
      });
    }

    const habit = await Habit.create({
      userId: req.user._id,
      name,
      goal: { unit: goalUnit || 'times', value: goalValue || 1 },
      icon: icon || '✨',
      color: color || 'blue',
      reminderTime,
      motivation
    });

    res.status(201).json({
      success: true,
      message: 'Habit created! 🎉',
      data: { 
        habit: {
          ...habit.toObject(),
          isCheckedInToday: habit.hasCheckedInToday()
        }
      }
    });
  } catch (error) {
    console.error('Create habit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating habit',
      error: error.message
    });
  }
};

// @desc    Get single habit
// @route   GET /api/habits/:id
// @access  Private
exports.getHabit = async (req, res) => {
  try {
    // 1. Dùng findOne để lấy chính xác 1 đối tượng
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id,
      isActive: true
    });

    // 2. Kiểm tra nếu không tìm thấy habit
    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    // 3. Kích hoạt logic reset streak và lưu vào DB
    await habit.resetStreakIfMissed();

    // 4. Trả về dữ liệu đã cập nhật
    res.status(200).json({
      success: true,
      data: { 
        habit: {
          ...habit.toObject(),
          isCheckedInToday: habit.hasCheckedInToday()
        }
      }
    });
  } catch (error) {
    console.error('Get habit error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching habit detail',
      error: error.message
    });
  }
};

// @desc    Update habit
// @route   PUT /api/habits/:id
// @access  Private
exports.updateHabit = async (req, res) => {
  try {
    const { name, goal, icon, color, reminderTime, motivation } = req.body;

    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { name, goal, icon, color, reminderTime, motivation },
      { new: true, runValidators: true }
    );

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Habit updated! ✨',
      data: { 
        habit: {
          ...habit.toObject(),
          isCheckedInToday: habit.hasCheckedInToday()
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating habit',
      error: error.message
    });
  }
};

// @desc    Delete habit (hard delete)
// @route   DELETE /api/habits/:id
// @access  Private
exports.deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Habit deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting habit',
      error: error.message
    });
  }
};
// @desc    Check in to a habit
// @route   POST /api/habits/:id/checkin
// @access  Private
exports.checkinHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!habit) {
      return res.status(404).json({
        success: false,
        message: 'Habit not found'
      });
    }

    const result = habit.checkin();
   const todayStr = new Date().toISOString().split('T')[0];
if (!result.alreadyCheckedIn) {
    if (!habit.checkInDates) habit.checkInDates = [];
    if (!habit.checkInDates.includes(todayStr)) {
        habit.checkInDates.push(todayStr);
    }
}
await habit.save();
    let levelUp = false;
let xpGained = 0;

if (!result.alreadyCheckedIn) {
    const user = await User.findById(req.user._id);
    if (user) {
        xpGained = 10; 
        user.xp = (user.xp || 0) + xpGained;
        const xpToLevelUp = (user.level || 1) * 100;

        if (user.xp >= xpToLevelUp) {
            user.level = (user.level || 1) + 1;
            user.xp -= xpToLevelUp;
            levelUp = true;
            // Cập nhật giai đoạn thú cưng
            if (user.level >= 20) user.petType = 'adult';
            else if (user.level >= 10) user.petType = 'teen';
            else if (user.level >= 3) user.petType = 'baby';
        }
        await user.save();
    }
}

    if (result.alreadyCheckedIn) {
      return res.status(200).json({
        success: true,
        message: 'Already checked in today! 👍',
        data: { 
          habit: {
            ...habit.toObject(),
            isCheckedInToday: true
          },
          alreadyCheckedIn: true
        }
      });
    }

    res.status(200).json({
      success: true,
      message: result.streak > 1 
        ? `🔥 ${result.streak} day streak! Keep it up!` 
        : 'Checked in! Great start! ✨',
      data: { 
        habit: {
          ...habit.toObject(),
          isCheckedInToday: true
        },
        streak: result.streak
      }
    });
  } catch (error) {
    console.error('Checkin error:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking in',
      error: error.message
    });
  }
};

// @desc    Get habit statistics
// @route   GET /api/habits/stats
// @access  Private
exports.getStats = async (req, res) => {
  try {
    const habits = await Habit.find({ 
      userId: req.user._id,
      isActive: true 
    });

    // --- BỔ SUNG: Lấy danh sách các ngày đã check-in duy nhất ---
    let allCheckInDates = [];
    habits.forEach(h => {
      // Giả sử Model Habit của bạn có mảng logs hoặc checkInDates lưu chuỗi "YYYY-MM-DD"
      if (h.checkInDates && Array.isArray(h.checkInDates)) {
        allCheckInDates = [...allCheckInDates, ...h.checkInDates];
      }
    });
    // Loại bỏ các ngày trùng (nếu 1 ngày làm nhiều habits)
    const uniqueDates = [...new Set(allCheckInDates)]; 

    const totalHabits = habits.length;
    const checkedInToday = habits.filter(h => h.hasCheckedInToday()).length;
    const totalStreak = habits.reduce((sum, h) => sum + h.streak, 0);
    const longestStreak = habits.length > 0 
      ? Math.max(...habits.map(h => h.streak)) 
      : 0;
    
    const user = await User.findById(req.user._id).select('xp level petType');

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalHabits,
          checkedInToday,
          completionRate: totalHabits > 0 
            ? Math.round((checkedInToday / totalHabits) * 100) 
            : 0,
          totalStreak,
          longestStreak,
          checkInDays: uniqueDates // <--- GỬI DỮ LIỆU NÀY VỀ FRONTEND
        },
        user: {
          xp: user ? user.xp : 0,
          level: user ? user.level : 1,
          petType: user ? user.petType : 'egg'
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stats',
      error: error.message
    });
  }
};
// Giả định trong habitController.js khi user nhấn checkin
const checkinHabit = async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);
        const user = await User.findById(req.user._id);

        if (!habit) return res.status(404).json({ message: "Không tìm thấy habit" });

        if (!habit.isCompletedToday) {
            habit.isCompletedToday = true;
            habit.streak = (habit.streak || 0) + 1;
            
            // 1. Tính toán XP
            let xpGained = 10;
            if (habit.difficulty === 'hard') xpGained = 40;
            
            // Đảm bảo user.xp không bị undefined trước khi cộng
            user.xp = (user.xp || 0) + xpGained;
            user.level = user.level || 1;

            // 2. Logic Level Up
            const xpNeeded = user.level * 100;
            if (user.xp >= xpNeeded) {
                user.level += 1;
                user.xp -= xpNeeded;
            }

            // 3. LƯU THAY ĐỔI (Cực kỳ quan trọng)
            await habit.save();
            await user.save();

            // 4. TRẢ VỀ KẾT QUẢ CHO FRONTEND (Đây là bước bạn đang thiếu)
            return res.json({ 
                success: true, 
                xp: user.xp, 
                level: user.level,
                streak: habit.streak,
                message: `Checked in! Gained ${xpGained} XP${user.level > 1 ? ` and leveled up to ${user.level}!` : ''}`,
                levelUp: user.level > 1
            });
        } else {
            return res.status(400).json({ message: "Hôm nay đã check-in rồi!" });
        }
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Lỗi server" });
    }
};