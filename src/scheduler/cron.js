const cron = require('node-cron');
const { runDailyCycle } = require('../pipeline/runner');

console.log('🚀 HERMAN Scout Scheduler Started.');
console.log('⏳ Waiting for the next scheduled run (9:00 AM daily)...');

// Runs every day at 9:00 AM
// Format: minute hour day-of-month month day-of-week
cron.schedule('0 9 * * *', async () => {
  try {
    await runDailyCycle();
  } catch (error) {
    console.error('❌ Cron Job Failed:', error);
  }
});

// BONUS: For testing right now, let's also run it immediately when you start the script
console.log('▶️  Running an immediate test cycle...\n');
runDailyCycle();