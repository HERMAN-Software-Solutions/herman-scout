const express = require('express');
const { generateReply } = require('./ai/replier');
const { neon } = require('@neondatabase/serverless');
require('dotenv').config();

const app = express();
app.use(express.json());

// Initialize Neon
const sql = neon(process.env.DATABASE_URL);

// Brevo will send a POST request to this endpoint
app.post('/webhook/reply', async (req, res) => {
  try {
    const inboundEmail = req.body;
    console.log('\n📥 Received new reply from:', inboundEmail.From);

    // 1. Get the text of the reply
    const replyText = inboundEmail.textContent || inboundEmail.htmlContent;
    
    // 2. Ask Gemini to draft a response
    console.log('🤖 Drafting AI response...');
    const draft = await generateReply(replyText);

    console.log('\n--- DRAFT PREVIEW ---');
    console.log(draft);
    console.log('---------------------\n');

    // 3. Try to save the draft to your Neon database
    try {
      console.log('💾 Saving draft to database...');
      await sql`
        INSERT INTO send_log (domain, email, status, error) 
        VALUES ('inbound_reply', ${inboundEmail.From}, 'draft_ready', ${draft})
      `;
      console.log('✅ Draft saved to database!');
    } catch (dbError) {
      console.error('⚠️ Could not save to database (Network issue):', dbError.message);
      console.log('Draft is printed above, but not saved.');
    }

    // Always return 200 OK to Brevo so they don't retry and spam us
    res.status(200).send('Webhook received');
  } catch (error) {
    console.error('❌ Webhook failed completely:', error);
    res.status(500).send('Webhook failed');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Webhook server listening on port ${PORT}`);
});