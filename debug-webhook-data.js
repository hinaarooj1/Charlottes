// Debug script to see exactly what data is being sent to webhook
const axios = require("axios");

async function debugWebhookData() {
  const webhookUrl = "https://n8n.srv917741.hstgr.cloud/webhook/ac21fa0b-ad69-45bf-857b-4bce97ea14bd";
  
  // This is the EXACT data format being sent from your current code
  const mailOptions = {
    subject: `Chat Transcript - Session test123`,
    text: `Chat Transcript\n\nSession ID: test123\nStarted: 2024-01-01 10:00:00\nEnded: 2024-01-01 10:05:00\nURL: https://example.com\nReferrer: N/A\nUser Agent: Mozilla/5.0...`,
    html: `
      <h2>Chat Transcript</h2>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p><strong>Session ID:</strong> test123</p>
        <p><strong>Started:</strong> 2024-01-01 10:00:00</p>
        <p><strong>Ended:</strong> 2024-01-01 10:05:00</p>
        <p><strong>URL:</strong> https://example.com</p>
        <p><strong>Referrer:</strong> N/A</p>
        <p><strong>User Agent:</strong> Mozilla/5.0...</p>
        <p><strong>IP Address:</strong> 192.168.1.1</p>
        <p><strong>Country:</strong> US</p>
      </div>
      <div style="line-height: 1.6;">
        <div style="margin-bottom: 15px; text-align: right;">
          <small style="color: #666;">2024-01-01 10:00:00 - User</small>
          <div style="background-color: #FFBB8E; padding: 10px; border-radius: 8px; display: inline-block; max-width: 80%; text-align: left;">
            Hello, I'm interested in Portugal Golden Visa
          </div>
        </div>
        <div style="margin-bottom: 15px; text-align: left;">
          <small style="color: #666;">2024-01-01 10:01:00 - Assistant</small>
          <div style="background-color: #f0f0f0; padding: 10px; border-radius: 8px; display: inline-block; max-width: 80%; text-align: left;">
            Hello! I'm Sofia from Portugal Residency PRO. I'd be happy to help you with the Portugal Golden Visa program.
          </div>
        </div>
      </div>
    `
  };

  console.log("🔍 DEBUGGING WEBHOOK DATA:");
  console.log("📤 Webhook URL:", webhookUrl);
  console.log("📤 Data being sent:");
  console.log(JSON.stringify(mailOptions, null, 2));

  try {
    console.log("\n🔗 Sending to webhook...");
    const response = await axios.post(webhookUrl, mailOptions, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 15000
    });

    console.log("✅ Webhook response:");
    console.log("📬 Status:", response.status);
    console.log("📬 Data:", response.data);

  } catch (error) {
    console.error("❌ Webhook failed:");
    console.error("📬 Error:", error.message);
    if (error.response) {
      console.error("📬 Status:", error.response.status);
      console.error("📬 Data:", error.response.data);
    }
  }
}

// Run debug
debugWebhookData();
