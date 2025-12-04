const axios = require("axios");

async function testWebhookWithEmailFields() {
  const webhookUrl = "https://n8n.srv917741.hstgr.cloud/webhook/ac21fa0b-ad69-45bf-857b-4bce97ea14bd";
  
  // CORRECTED data format with FROM and TO fields
  const mailOptions = {
    from: "ahmarjabbar7@gmail.com",  // ← ADDED: From email
    to: "ahmarjabbar7@gmail.com",    // ← ADDED: To email
    subject: "🧪 Test Email with FROM/TO - Portugal Residency PRO",
    text: "This is a test email with proper FROM and TO fields to verify email delivery works.",
    html: `
      <h2>🧪 Test Email with FROM/TO Fields</h2>
      <p>This is a test email with proper FROM and TO fields to verify email delivery works.</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p><strong>From:</strong> ahmarjabbar7@gmail.com</p>
      <p><strong>To:</strong> ahmarjabbar7@gmail.com</p>
    `
  };

  console.log("🔍 TESTING WEBHOOK WITH EMAIL FIELDS:");
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

    console.log("\n📧 Check your email inbox for the test email!");

  } catch (error) {
    console.error("❌ Webhook failed:");
    console.error("📬 Error:", error.message);
    if (error.response) {
      console.error("📬 Status:", error.response.status);
      console.error("📬 Data:", error.response.data);
    }
  }
}

// Run test
testWebhookWithEmailFields();
