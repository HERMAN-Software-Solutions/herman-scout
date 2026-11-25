const fetch = require('node-fetch'); // We will install this
const db = require('../db/queries');
const { generatePitch } = require('../ai/pitch');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const sql = neon(process.env.DATABASE_URL);
const DAILY_BATCH = parseInt(process.env.DAILY_BATCH || '20', 10);
const BREVO_API_KEY = process.env.BREVO_API_KEY;
const SENDER_EMAIL = process.env.BREVO_SENDER_EMAIL;
const SENDER_NAME = process.env.BREVO_SENDER_NAME;

// Get top leads that haven't been emailed
async function selectBatch(limit) {
  return await sql`
    SELECT * FROM leads
    WHERE status = 'ready'
      AND email IS NOT NULL
      AND domain NOT IN (SELECT domain FROM blacklist)
    ORDER BY score DESC
    LIMIT ${limit}
  `;
}

// Send a single email via Brevo
async function sendEmail(toEmail, subject, body) {
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'api-key': BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: { name: SENDER_NAME, email: SENDER_EMAIL },
      to: [{ email: toEmail }],
      subject: subject,
      htmlContent: `<p>${body.replace(/\n/g, '<br>')}</p>`,
      // We MUST include this to be compliant
      headers: {
        'List-Unsubscribe': `<mailto:unsubscribe@herman.ug?subject=Unsubscribe>`
      }
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(JSON.stringify(errorData));
  }
  return response.json();
}

async function runSendBatch() {
  console.log('📧 Starting batch send...');
  
  const batch = await selectBatch(DAILY_BATCH);
  console.log(`Found ${batch.length} leads to email today.`);

  if (batch.length === 0) {
    console.log('No leads ready to send. Exiting.');
    return;
  }

  const batchId = crypto.randomUUID(); // Unique ID for this run

  for (const lead of batch) {
    try {
      const subject = `Quick question about ${lead.domain}`;
      const body = await generatePitch(lead);
      
      console.log(`Sending to ${lead.email}...`);
      const result = await sendEmail(lead.email, subject, body);
      
      // Mark as emailed in DB
      await sql`
        UPDATE leads SET status = 'emailed', emailed_at = NOW() WHERE id = ${lead.id}
      `;
      
      // Log it
      await sql`
        INSERT INTO send_log (lead_id, domain, email, batch_id, brevo_message_id)
        VALUES (${lead.id}, ${lead.domain}, ${lead.email}, ${batchId}, ${result.messageId})
      `;
      
      console.log(`✅ Sent successfully to ${lead.email}`);
      
      // Wait 3 seconds between emails (rate limiting)
      await new Promise(r => setTimeout(r, 3000));
      
    } catch (error) {
      console.error(`❌ Failed to send to ${lead.email}:`, error.message);
      
      // Log the failure
      await sql`
        INSERT INTO send_log (lead_id, domain, email, batch_id, status, error)
        VALUES (${lead.id}, ${lead.domain}, ${lead.email}, ${batchId}, 'failed', ${error.message})
      `;
    }
  }

  console.log(`\n🎉 Batch send complete. Processed ${batch.length} emails.`);
}

module.exports = { runSendBatch, sendEmail };