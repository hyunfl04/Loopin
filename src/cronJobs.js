const cron = require('node-cron');
const Habit = require('./models/Habit');

function startCronJobs() {
  // Reset streak mỗi ngày lúc 00:00
  cron.schedule('0 0 * * *', async () => {
    const habits = await Habit.find({});
    for (let habit of habits) {
      const reset = habit.resetStreakIfMissed();
      await habit.save();

      if (reset) {
        console.log(`Habit "${habit.name}" streak reset!`);
        // TODO: gửi thông báo push hoặc email cho user
      }
    }
  });
}

module.exports = startCronJobs;