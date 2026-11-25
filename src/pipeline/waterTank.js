const { runAutopsy } = require('../crawler/autopsy');
const db = require('../db/queries');
require('dotenv').config();

const BUFFER_THRESHOLD = parseInt(process.env.BUFFER_THRESHOLD || '20', 10);
const MIN_SCORE = parseInt(process.env.MIN_SCORE || '60', 10);

function getDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch (e) {
    return null;
  }
}

// This function takes a list of URLs, checks the tank, and processes them
async function processUrls(urls) {
  console.log(`💧 Checking Water Tank...`);
  
  // 1. Check the tank
  const currentReady = await db.getReadyCount();
  console.log(`📊 Current ready leads in tank: ${currentReady}`);

  if (currentReady > BUFFER_THRESHOLD) {
    console.log(`🛑 Tank is full (${currentReady} > ${BUFFER_THRESHOLD}). Skipping scan to save API calls.`);
    return;
  }

  console.log(`🚰 Tank is low. Starting scan...`);
  let addedCount = 0;

  // 2. Process URLs
  for (const url of urls) {
    const domain = getDomain(url);
    if (!domain) continue;

    // Dedupe Lock 1
    if (await db.domainExists(domain)) {
      console.log(`⏭️  Skipping ${domain} - already in database.`);
      continue;
    }

    // Run the crawler
    const result = await runAutopsy(url);
    if (!result || result.emails.length === 0) {
      console.log(`⏭️  Skipping ${domain} - no emails found.`);
      continue;
    }

    const primaryEmail = result.emails[0];

    // Dedupe Lock 2
    if (await db.emailExists(primaryEmail)) {
      console.log(`⏭️  Skipping ${domain} - email ${primaryEmail} already exists.`);
      continue;
    }

    // Quality check
    if (result.score < MIN_SCORE) {
      console.log(`⏭️  Skipping ${domain} - score ${result.score} is below minimum ${MIN_SCORE}.`);
      continue;
    }

    // Save to DB!
    await db.insertLead({
      domain,
      email: primaryEmail,
      score: result.score,
      tech_stack: result.tech_stack,
      pain_points: result.pain_points,
      pitch_hooks: result.pitch_hooks
    });

    addedCount++;
    console.log(`✅ Added: ${domain} (Score: ${result.score}) - Email: ${primaryEmail}`);
  }

  // 3. Log the scan
  const finalReady = await db.getReadyCount();
  await db.logScan(addedCount, finalReady);

  console.log(`\n🎉 Scan complete. Added ${addedCount} new leads. Tank now has ${finalReady} ready leads.`);
}

module.exports = { processUrls };