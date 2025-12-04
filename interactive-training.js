const OpenAI = require("openai");
const readline = require('readline');
require("dotenv").config({ path: require('path').resolve(__dirname, '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function interactiveTraining() {
  console.log("🤖 Sofia Interactive Training Mode");
  console.log("=================================");
  console.log("Type 'exit' to quit training mode");
  console.log("Type 'save' to save current training");
  console.log("");

  const thread = await openai.beta.threads.create();
  console.log(`📝 Training thread created: ${thread.id}`);
  console.log("");

  while (true) {
    const question = await new Promise((resolve) => {
      rl.question("👤 You: ", resolve);
    });

    if (question.toLowerCase() === 'exit') {
      console.log("👋 Training session ended");
      break;
    }

    if (question.toLowerCase() === 'save') {
      console.log("💾 Training saved to assistant");
      break;
    }

    try {
      // Add user message
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: question
      });

      // Run assistant
      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: process.env.ASSISTANT_ID
      });

      // Wait for completion
      let runStatus;
      do {
        await new Promise(resolve => setTimeout(resolve, 1000));
        runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
      } while (runStatus.status !== "completed");

      // Get response
      const messages = await openai.beta.threads.messages.list(thread.id);
      const response = messages.data[0].content[0].text.value;

      console.log(`🤖 Sofia: ${response}`);
      console.log("");
    } catch (error) {
      console.error("❌ Error:", error.message);
    }
  }

  rl.close();
}

// Start interactive training
interactiveTraining();
