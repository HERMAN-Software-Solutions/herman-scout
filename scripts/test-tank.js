const { processUrls } = require('../src/pipeline/waterTank');

// We will test with a few URLs
const testUrls = [
  'https://www.kampalahotels.com', // This one will likely get added
  'https://www.sheratonkampala.com', // Test a second one
  'https://www.google.com' // This will be skipped (score will be too low)
];

async function run() {
  // Run 1: Tank is empty, should process
  await processUrls(testUrls);
  
  console.log('\n--- Running again to test Dedupe ---\n');
  
  // Run 2: Tank should now skip them because they are in the DB
  await processUrls(testUrls);
}

run();