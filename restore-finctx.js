const OpenAI = require("openai");
require("dotenv").config({ path: require('path').resolve(__dirname, '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function restoreFinctXAssistant() {
  try {
    console.log("🔄 Restoring FinctX Assistant...");
    
    // Restore FinctX assistant configuration
    const assistant = await openai.beta.assistants.update(process.env.ASSISTANT_ID, {
      name: "FinctX AI Assistant",
      instructions: `You are an AI assistant for FinctX, a cryptocurrency trading and investment platform. You help users with:

SERVICES:
- Cryptocurrency trading guidance
- Investment portfolio management
- Trading strategies and analysis
- Market insights and trends
- Account management
- Trading education

RESPONSE STYLE:
- Professional and knowledgeable about crypto
- Provide trading insights and market analysis
- Help with investment decisions
- Educational about blockchain and cryptocurrencies
- Encourage responsible trading

IMPORTANT: Focus on cryptocurrency trading, blockchain technology, and investment services.`,
      model: "gpt-4o-mini",
      tools: [{"type": "code_interpreter"}],
    });

    console.log("✅ FinctX Assistant restored successfully!");
    console.log("📋 Restored details:");
    console.log(`   Name: ${assistant.name}`);
    console.log(`   ID: ${assistant.id}`);
    console.log(`   Model: ${assistant.model}`);
    
    // Update .env to reflect FinctX
    const fs = require('fs');
    let envContent = fs.readFileSync('.env', 'utf8');
    envContent = envContent.replace(/PORTUGAL_RESIDENCY_PRO/g, 'FINCTX');
    
    console.log("\n🎯 FinctX Assistant is now active!");
    console.log("The assistant will now provide cryptocurrency trading services.");
    
  } catch (error) {
    console.error("❌ Restoration failed:", error);
  }
}

restoreFinctXAssistant();
