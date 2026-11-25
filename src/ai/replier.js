const { GoogleGenAI } = require('@google/genai');
require('dotenv').config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateReply(inboundEmailText) {
  const prompt = `
You are the CEO of HERMAN Software Solutions. 
A prospect just replied to our cold email. Read their reply and draft a professional, helpful response. 
Keep it under 100 words. Offer a 15-minute discovery call to discuss their needs.

Their reply:
"${inboundEmailText}"

Draft your response:
  `;

  // Try the Flash model first (fastest)
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.log(`⚠️ Flash model busy. Trying Pro model...`);
  }

  // If Flash fails, try the Pro model
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-pro',
      contents: prompt,
    });
    return response.text.trim();
  } catch (error) {
    console.error(`❌ Both AI models failed. Using fallback.`);
  }

  // Absolute fallback if both fail
  return "Fallback: Hi, thanks for getting back to us. Are you free for a 15-minute call tomorrow to discuss this?";
}

module.exports = { generateReply };