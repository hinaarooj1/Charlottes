const sendEmail = require("./emailService");

async function testAdvancedEmailService() {
  console.log("🧪 Testing Advanced Email Service");
  console.log("=" * 50);
  
  try {
    const result = await sendEmail(
      "ahmarjabbar7@gmail.com",
      "🧪 Advanced Email Service Test - Portugal Residency PRO",
      `This is a test of the advanced email service with multiple fallback options.

Features tested:
✅ SMTP (Gmail) - Primary method
✅ Resend API - Cloud-friendly alternative  
✅ EmailJS - Free tier option
✅ SendGrid - Enterprise option
✅ Webhook - Final fallback

Time: ${new Date().toISOString()}
Service: Portugal Residency PRO Chatbot`,
      `
      <h2>🧪 Advanced Email Service Test</h2>
      <p>This is a test of the advanced email service with multiple fallback options.</p>
      
      <h3>Features tested:</h3>
      <ul>
        <li>✅ <strong>SMTP (Gmail)</strong> - Primary method</li>
        <li>✅ <strong>Resend API</strong> - Cloud-friendly alternative</li>
        <li>✅ <strong>EmailJS</strong> - Free tier option</li>
        <li>✅ <strong>SendGrid</strong> - Enterprise option</li>
        <li>✅ <strong>Webhook</strong> - Final fallback</li>
      </ul>
      
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p><strong>Service:</strong> Portugal Residency PRO Chatbot</p>
      
      <div style="background-color: #a60316; color: white; padding: 20px; border-radius: 8px; text-align: center; margin-top: 20px;">
        <h3 style="margin: 0 0 10px 0; color: white;">🇵🇹 Portugal Residency PRO</h3>
        <p style="margin: 5px 0; color: white;"><strong>Phone:</strong> (234) 109-6666</p>
        <p style="margin: 5px 0; color: white;"><strong>Email:</strong> Herringtonconsulting@gmail.com</p>
        <p style="margin: 5px 0; color: white;"><strong>Website:</strong> <a href="https://portugalresidency.pro/" style="color: white;">https://portugalresidency.pro/</a></p>
      </div>
      `
    );

    console.log("\n✅ Email service test completed successfully!");
    console.log("📬 Result:", result);
    console.log("📧 Check your email inbox for the test email!");
    
    return result;

  } catch (error) {
    console.error("\n❌ Email service test failed:");
    console.error("📧 Error:", error);
    return { success: false, error };
  }
}

// Run the test
testAdvancedEmailService().then(result => {
  console.log("\n🏁 Test Result:", result);
  process.exit(result.success ? 0 : 1);
});
