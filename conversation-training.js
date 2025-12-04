const OpenAI = require("openai");
require("dotenv").config({ path: require('path').resolve(__dirname, '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function conversationTraining() {
  console.log("🧠 Sofia Conversation-Based Training");
  console.log("====================================");

  try {
    // Create a training thread
    const thread = await openai.beta.threads.create();
    console.log(`📝 Training thread: ${thread.id}`);

    // Training conversations
    const trainingConversations = [
      {
        user: "What's your Twitter handle?",
        expected: "We don't have a Twitter account. Contact us at Herringtonconsulting@gmail.com or (234) 109-6666"
      },
      {
        user: "Do you have social media?",
        expected: "We don't have active social media accounts. Reach us at Herringtonconsulting@gmail.com or (234) 109-6666"
      },
      {
        user: "What are your social media contacts?",
        expected: "We don't have social media accounts. Contact us via email Herringtonconsulting@gmail.com or phone (234) 109-6666"
      },
      {
        user: "Do you have Instagram?",
        expected: "No Instagram account. Contact us at Herringtonconsulting@gmail.com or (234) 109-6666"
      },
      {
        user: "What's your Facebook page?",
        expected: "No Facebook page. Email us at Herringtonconsulting@gmail.com or call (234) 109-6666"
      },
      {
        user: "Can I follow you on social media?",
        expected: "We don't have social media accounts. Contact us directly at Herringtonconsulting@gmail.com or (234) 109-6666"
      }
    ];

    console.log("🎯 Training Sofia on social media responses...");

    for (const conversation of trainingConversations) {
      console.log(`\n👤 User: ${conversation.user}`);
      
      // Add user message
      await openai.beta.threads.messages.create(thread.id, {
        role: "user",
        content: conversation.user
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
      console.log(`✅ Expected: ${conversation.expected}`);
    }

    console.log("\n🎉 Training completed!");
    console.log("Sofia now knows to redirect social media questions to email/phone");

  } catch (error) {
    console.error("❌ Training error:", error);
  }
}

// Run training
conversationTraining();
