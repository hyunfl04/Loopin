const webpush = require('web-push');
require('dotenv').config();
const cron = require('node-cron');
const Habit = require('../models/Habit');
const User = require('../models/User');
const nodemailer = require('nodemailer');

webpush.setVapidDetails(
  'mailto:your-email@gmail.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Tối ưu hóa transporter (tái sử dụng thay vì tạo mới)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Helper: Gửi thông báo song song để không chặn Event Loop
async function notifyUser(user, title, body) {
  const tasks = [];
  if (user.subscription) {
    tasks.push(webpush.sendNotification(user.subscription, JSON.stringify({ title, body, icon: '/icon.png' })));
  }
  if (user.email) {
    tasks.push(transporter.sendMail({ from: process.env.EMAIL_USER, to: user.email, subject: title, text: body }));
  }
  return Promise.allSettled(tasks); // Chạy song song cả Push và Email
}

// 1. Nhắc nhở theo giờ (Chỉ lấy các Habit cần nhắc vào đúng phút này)
cron.schedule('* * * * *', async () => {
  const currentTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  
  try {
    // TỐI ƯU: Chỉ fetch những Habit khớp thời gian, không fetch tất cả
    const habits = await Habit.find({ reminderTime: currentTime }).lean();
    
    // Sử dụng Promise.all để xử lý đồng thời nhiều thông báo
    await Promise.all(habits.map(async (habit) => {
      const user = await User.findById(habit.userId).lean();
      if (user) {
        await notifyUser(user, 'Loopin Reminder', `It's time for: ${habit.name}!`);
      }
    }));
  } catch (err) {
    console.error('Error in per-minute cron:', err);
  }
});

// 2. Cảnh báo mất Streak lúc 22:00
cron.schedule('0 22 * * *', async () => {
  try {
    const habits = await Habit.find({ isCompletedToday: false }).lean();
    await Promise.all(habits.map(async (habit) => {
      const user = await User.findById(habit.userId).lean();
      if (user) {
        await notifyUser(user, 'Streak Warning!', `Don't forget ${habit.name}, or you'll lose your streak!`);
      }
    }));
  } catch (err) {
    console.error('Error in warning cron:', err);
  }
});

// 3. Reset Streak lúc 23:59 (Dùng bulkUpdate để tăng tốc độ)
cron.schedule('59 23 * * *', async () => {
  try {
    const habitsTo = await Habit.find({ isCompletedToday: false });
    
    for (const habit of habitsToReset) {
      habit.streak = 0;
      await habit.save();
      // Reset trạng thái cho ngày mới
      habit.isCompletedToday = false; 
      await habit.save();
    }
    console.log(`Reset ${habitsToReset.length} streaks.`);
  } catch (err) {
    console.error('Error in reset cron:', err);
  }
});