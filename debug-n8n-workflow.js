const axios = require("axios");

async function debugN8nWorkflow() {
  const webhookUrl = "https://n8n.srv917741.hstgr.cloud/webhook/ac21fa0b-ad69-45bf-857b-4bce97ea14bd";
  
  console.log("🔍 DEBUGGING N8N WORKFLOW");
  console.log("=" * 50);
  
  // Test 1: Simple webhook test
  console.log("\n🧪 Test 1: Basic webhook connectivity");
  try {
    const response = await axios.post(webhookUrl, {
      test: "basic connectivity test",
      timestamp: new Date().toISOString()
    }, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000
    });
    console.log("✅ Basic webhook works:", response.data);
  } catch (error) {
    console.log("❌ Basic webhook failed:", error.message);
  }

  // Test 2: Email format test
  console.log("\n🧪 Test 2: Email format test");
  try {
    const emailData = {
      from: "ahmarjabbar7@gmail.com",
      to: "ahmarjabbar7@gmail.com",
      subject: "🧪 N8N Workflow Test - " + new Date().toISOString(),
      text: "This is a test email to verify the n8n workflow can send emails.",
      html: `
        <h2>🧪 N8N Workflow Test</h2>
        <p>This is a test email to verify the n8n workflow can send emails.</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>From:</strong> ahmarjabbar7@gmail.com</p>
        <p><strong>To:</strong> ahmarjabbar7@gmail.com</p>
      `
    };

    console.log("📤 Sending email test data:");
    console.log(JSON.stringify(emailData, null, 2));

    const response = await axios.post(webhookUrl, emailData, {
      headers: { "Content-Type": "application/json" },
      timeout: 15000
    });

    console.log("✅ Email test webhook response:", response.data);
    console.log("📧 Check your email inbox for the test email!");
    
  } catch (error) {
    console.log("❌ Email test failed:", error.message);
    if (error.response) {
      console.log("📬 Response status:", error.response.status);
      console.log("📬 Response data:", error.response.data);
    }
  }

  // Test 3: Different email formats
  console.log("\n🧪 Test 3: Alternative email formats");
  
  const alternativeFormats = [
    {
      name: "Format 1: Standard",
      data: {
        from: "ahmarjabbar7@gmail.com",
        to: "ahmarjabbar7@gmail.com",
        subject: "Test Email Format 1",
        body: "Test email body"
      }
    },
    {
      name: "Format 2: With email field",
      data: {
        email: "ahmarjabbar7@gmail.com",
        from: "ahmarjabbar7@gmail.com",
        to: "ahmarjabbar7@gmail.com",
        subject: "Test Email Format 2",
        message: "Test email message"
      }
    },
    {
      name: "Format 3: Minimal",
      data: {
        to: "ahmarjabbar7@gmail.com",
        subject: "Test Email Format 3",
        text: "Test email text"
      }
    }
  ];

  for (const format of alternativeFormats) {
    try {
      console.log(`\n📤 Testing ${format.name}:`);
      console.log(JSON.stringify(format.data, null, 2));
      
      const response = await axios.post(webhookUrl, format.data, {
        headers: { "Content-Type": "application/json" },
        timeout: 10000
      });
      
      console.log(`✅ ${format.name} response:`, response.data);
      
    } catch (error) {
      console.log(`❌ ${format.name} failed:`, error.message);
    }
  }

  console.log("\n" + "=" * 50);
  console.log("🏁 Debugging complete!");
  console.log("📧 Check your email inbox for any test emails");
  console.log("🔍 If no emails received, the n8n workflow needs configuration");
}

// Run the debug
debugN8nWorkflow();
