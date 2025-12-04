const OpenAI = require("openai");
require("dotenv").config({ path: require('path').resolve(__dirname, '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function backupCurrentAssistant() {
  try {
    console.log("💾 Backing up current assistant...");
    
    // Get current assistant details
    const assistant = await openai.beta.assistants.retrieve(process.env.ASSISTANT_ID);
    
    const backup = {
      id: assistant.id,
      name: assistant.name,
      instructions: assistant.instructions,
      model: assistant.model,
      tools: assistant.tools,
      file_ids: assistant.file_ids,
      created_at: assistant.created_at,
      updated_at: new Date().toISOString()
    };
    
    // Save backup to file
    const fs = require('fs');
    fs.writeFileSync('assistant-backup.json', JSON.stringify(backup, null, 2));
    
    console.log("✅ Assistant backup saved to assistant-backup.json");
    console.log("📋 Backup details:");
    console.log(`   ID: ${backup.id}`);
    console.log(`   Name: ${backup.name}`);
    console.log(`   Model: ${backup.model}`);
    console.log(`   Instructions length: ${backup.instructions.length} characters`);
    
    return backup;
    
  } catch (error) {
    console.error("❌ Backup failed:", error);
  }
}

backupCurrentAssistant();
