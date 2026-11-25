const { processUrls } = require('./waterTank');
const { runSendBatch } = require('./sender');
const { discoverUrls } = require('../crawler/discover'); // IMPORT THIS
require('dotenv').config();

const SEND_DAYS = process.env.SEND_DAYS.split(',').map(Number); 

async function runDailyCycle() {
  console.log('\n========================================');
  console.log(`⏰ Starting Daily Cycle: ${new Date().toLocaleString()}`);
  console.log('========================================\n');

  // 1. Automatically discover URLs! 
  // You can change this search query to anything: "Restaurants in Kampala", "Law firms in Uganda", etc.
  const targetUrls = await discoverUrls('Hotels in Kampala Uganda', 10);

  // 2. Check the Water Tank & Scan
  if (targetUrls.length > 0) {
    await processUrls(targetUrls);
  } else {
    console.log('⚠️ No URLs found to scan today.');
  }

  // 3. Check if today is a Send Day
  const today = new Date().getDay(); 
  
  if (SEND_DAYS.includes(today)) {
    console.log(`\n📅 Today is a Send Day. Triggering batch sender...`);
    await runSendBatch();
  } else {
    console.log(`\n💤 Today is not a Send Day. Skipping emails.`);
  }

  console.log('\n✅ Daily Cycle Complete.\n');
}

module.exports = { runDailyCycle };