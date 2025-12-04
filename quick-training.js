const OpenAI = require("openai");
require("dotenv").config({ path: require('path').resolve(__dirname, '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function quickTraining() {
  console.log("⚡ Sofia Quick Training");
  console.log("=====================");

  try {
    // Update assistant with specific instructions
    const assistant = await openai.beta.assistants.update(process.env.ASSISTANT_ID, {
      instructions: `You are Sofia, an AI assistant for Portugal Residency PRO (https://portugalresidency.pro/).

SOCIAL MEDIA POLICY:
- We do NOT have Twitter, Instagram, Facebook, or any social media accounts
- Always redirect to: Herringtonconsulting@gmail.com or (234) 109-6666
- Never mention social media platforms

CONTACT INFORMATION:
- Phone: (234) 109-6666
- Email: Herringtonconsulting@gmail.com
- Address: 2220 Plymouth Rd #302, Hopkins, Minnesota(MN), 55305
- Website: https://portugalresidency.pro/

SERVICES:
- Portugal Golden Visa Program
- Real Estate Investment (€500,000+)
- Investment Funds (€500,000+)
- Capital Transfer (€1,000,000+)
- Job Creation (€350,000+)
- Crypto-based investment structures

RESPONSE STYLE:
- Professional yet friendly
- Always ask for email first
- Provide contact information when asked about social media
- Focus on Golden Visa services
- Use emojis sparingly

IMPORTANT: Never mention social media platforms. Always redirect to email/phone contact.`
    });

    console.log("✅ Sofia trained successfully!");
    console.log("🎯 Sofia now knows:");
    console.log("• No social media accounts");
    console.log("• Contact: Herringtonconsulting@gmail.com");
    console.log("• Phone: (234) 109-6666");
    console.log("• Portugal Golden Visa services");
    console.log("• Professional response style");

  } catch (error) {
    console.error("❌ Training error:", error);
  }
}

quickTraining();
