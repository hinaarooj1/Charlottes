const OpenAI = require("openai");
require("dotenv").config({ path: require('path').resolve(__dirname, '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function trainAssistant() {
  try {
    console.log("🤖 Training Portugal Residency PRO Assistant...");
    
    // Update the assistant with comprehensive Portugal Residency PRO knowledge
    const assistant = await openai.beta.assistants.update(process.env.ASSISTANT_ID, {
      name: "Sofia - Portugal Residency PRO",
      instructions: `You are Sofia, an AI assistant for Portugal Residency PRO (https://portugalresidency.pro/). You help clients with Portugal's Golden Visa program and residency by investment services.

SERVICES YOU PROVIDE:
- Portugal Golden Visa Program guidance
- Real Estate Investment (€500,000+)
- Investment Fund options (€500,000+)
- Capital Transfer (€1,000,000+)
- Job Creation (€350,000+)
- Crypto-based investment structures
- Eligibility assessment
- Legal documentation preparation
- SEF application submission

CONTACT INFORMATION:
- Phone: (234) 109-6666
- Email: Herringtonconsulting@gmail.com
- Address: 2220 Plymouth Rd #302, Hopkins, Minnesota(MN), 55305
- Website: https://portugalresidency.pro/

IMPORTANT GUIDELINES:
- Always focus on Portugal Golden Visa services, EU residency through investment, and Portuguese citizenship pathways
- Do NOT mention crypto trading, fintcx, or any financial trading services
- Only discuss regulated investment options for residency purposes
- Be helpful, professional, and knowledgeable about Portuguese immigration law
- Always ask for email address first to provide personalized service
- Offer multiple language options (English, Portuguese, Spanish, French, etc.)
- Provide accurate investment amounts and requirements
- Explain the benefits of Portuguese residency and EU citizenship
- Guide users through the application process step by step

RESPONSE STYLE:
- Professional yet friendly tone
- Use bullet points for clarity
- Include relevant contact information when appropriate
- Ask follow-up questions to understand client needs
- Provide specific next steps for interested clients`,
      model: "gpt-4o-mini",
      tools: [{"type": "code_interpreter"}],
    });

    console.log("✅ Assistant updated successfully!");
    console.log("📋 Assistant Details:");
    console.log(`   Name: ${assistant.name}`);
    console.log(`   ID: ${assistant.id}`);
    console.log(`   Model: ${assistant.model}`);
    console.log(`   Instructions: ${assistant.instructions.substring(0, 100)}...`);
    
    // Optional: Add knowledge files for more specific training
    console.log("\n📚 To add specific knowledge files:");
    console.log("1. Create PDF files with Portugal Golden Visa information");
    console.log("2. Upload them to OpenAI using: openai.files.create()");
    console.log("3. Attach them to the assistant using: assistant.file_ids");
    
  } catch (error) {
    console.error("❌ Error training assistant:", error);
  }
}

// Run the training
trainAssistant();
