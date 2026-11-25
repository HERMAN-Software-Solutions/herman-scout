const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

// Initialize the NEW SDK
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generatePitch(lead) {
  const domain = lead.domain;
  const hooks = lead.pitch_hooks || [];
  
  if (hooks.length === 0) {
    return `Hi Team at ${domain},\n\nI came across your website and would love to connect to discuss how HERMAN Software Solutions can help improve your online presence.\n\nAre you open to a quick chat this week?\n\nBest,\nHERMAN Software Solutions`;
  }

  const topHooks = hooks.slice(0, 3).map(h => `- ${h}`).join('\n');

  const prompt = `
You are the Lead Consultant at HERMAN Software Solutions, a software agency based in Uganda.
Write a short, polite B2B cold email (under 100 words) to the team at "${domain}".

Here are specific issues we found on their website:
${topHooks}

Offer to fix these issues with custom software and web development.
Rules:
- Do not sound like a robot.
- Do not use placeholders like [Name] unless you have to.
- Keep it brief and direct.
- Do NOT include a subject line, just the body of the email.
- Sign off as "HERMAN Software Solutions".
  `;

  try {
    // The NEW way to call the model
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash', // The latest stable model
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error(`❌ Gemini AI Error for ${domain}:`, error.message);
    // Fallback template in case of rate limits or network issues
    return `Hi Team at ${domain},\n\nI was looking at your website and noticed a few things that might be costing you customers:\n\n${topHooks}\n\nAt HERMAN Software Solutions, we help fix these exact issues. Would you be open to a 5-minute chat?\n\nBest,\nHERMAN Software Solutions`;
  }
}

module.exports = { generatePitch };