const axios = require("axios");

async function testWebhook() {
  const webhookUrl = "https://n8n.srv917741.hstgr.cloud/webhook/ac21fa0b-ad69-45bf-857b-4bce97ea14bd";
  
  const testData = {
    from: "ahmarjabbar7@gmail.com",
    to: "ahmarjabbar7@gmail.com",
    subject: "🧪 Webhook Test - Portugal Residency PRO",
    text: "This is a test email sent via webhook to verify the system is working correctly.",
    html: "<h2>🧪 Webhook Test</h2><p>This is a test email sent via webhook to verify the system is working correctly.</p><p><strong>Time:</strong> " + new Date().toISOString() + "</p>"
  };

  try {
    console.log("🔗 Testing webhook...");
    console.log("📤 URL:", webhookUrl);
    console.log("📤 Data:", JSON.stringify(testData, null, 2));

    const response = await axios.post(webhookUrl, testData, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000
    });

    console.log("✅ SUCCESS! Webhook test completed");
    console.log("📬 Response Status:", response.status);
    console.log("📬 Response Data:", response.data);

    return {
      success: true,
      status: response.status,
      data: response.data
    };

  } catch (error) {
    console.error("❌ Webhook test failed:");
    console.error("📬 Error:", error.message);
    
    if (error.response) {
      console.error("📬 Status:", error.response.status);
      console.error("📬 Data:", error.response.data);
    }

    return {
      success: false,
      error: error.message,
      status: error.response?.status,
      data: error.response?.data
    };
  }
}

// Run the test
testWebhook().then(result => {
  console.log("\n🏁 Test Result:", result);
  process.exit(result.success ? 0 : 1);
});
