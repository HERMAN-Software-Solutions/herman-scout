const { neon } = require('@neondatabase/serverless');
const { generatePitch } = require('../src/ai/pitch');
const { sendEmail } = require('../src/pipeline/sender');
require('dotenv').config();

async function testSend() {
  // 1. Create a fake lead so we don't email a real person yet
  const fakeLead = {
    domain: 'example.com',
    email: process.env.BREVO_SENDER_EMAIL, // Send it to yourself!
    pitch_hooks: [
      "Your site is missing a mobile viewport tag — it looks broken on phones.",
      "Your homepage took 4.2s to respond — Google penalizes this."
    ]
  };

  console.log(`Testing AI Pitch Generator...`);
  const body = generatePitch(fakeLead);
  console.log('--- EMAIL PREVIEW ---');
  console.log(body);
  console.log('---------------------');

  console.log(`\n📧 Sending test email to ${fakeLead.email}...`);
  
  try {
    const result = await sendEmail(fakeLead.email, "Testing HERMAN Scout", body);
    console.log(`✅ Test email sent! Message ID: ${result.messageId}`);
    console.log('Check your inbox!');
  } catch (error) {
    console.error(`❌ Failed to send:`, error.message);
  }
}

testSend();