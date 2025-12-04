const OpenAI = require("openai");
require("dotenv").config({ path: require('path').resolve(__dirname, '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function testConversation() {
  try {
    console.log("🧪 Testing Portugal Residency PRO Assistant...");
    
    // Create a test thread
    const thread = await openai.beta.threads.create();
    console.log(`📝 Created test thread: ${thread.id}`);
    
    // Test questions to validate training
    const testQuestions = [
      "What services do you offer?",
      "What are the investment requirements for Portugal Golden Visa?",
      "How much does real estate investment cost?",
      "What is your contact information?",
      "Do you help with crypto investments?",
      "What is the application process?",
      "Can you help with EU citizenship?"
    ];
    
    for (const question of testQuestions) {
      console.log(`\n❓ Question: ${question}`);
      
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
      
      console.log(`✅ Response: ${response.substring(0, 200)}...`);
    }
    
    console.log("\n🎉 Conversation testing completed!");
    
  } catch (error) {
    console.error("❌ Error testing conversation:", error);
  }
}

// Run the test
testConversation();
