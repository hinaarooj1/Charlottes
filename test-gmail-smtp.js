const nodemailer = require("nodemailer");

async function testGmailSMTP() {
  try {
    console.log("🧪 Testing Gmail SMTP locally...");
    
    // Load environment variables
    require("dotenv").config({ path: require('path').resolve(__dirname, '.env') });
    
    const transporter = nodemailer.createTransport({
      host: process.env.HOST,
      port: process.env.PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false,
      }
    });

    console.log("🔌 Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified!");

    const mailOptions = {
      from: {
        name: "Portugal Residency PRO Test",
        address: process.env.EMAIL_USER
      },
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      subject: "🧪 SMTP Test - Portugal Residency PRO",
      text: "This is a test email to verify SMTP is working locally.",
      html: `
        <h2>🧪 SMTP Test</h2>
        <p>This is a test email to verify SMTP is working locally.</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>From:</strong> Portugal Residency PRO</p>
      `
    };

    console.log("📤 Sending test email...");
    const info = await transporter.sendMail(mailOptions);
    
    console.log("✅ Email sent successfully!");
    console.log("📬 Message ID:", info.messageId);
    console.log("📬 Response:", info.response);
    
    return { success: true, messageId: info.messageId };

  } catch (error) {
    console.error("❌ SMTP test failed:");
    console.error("📬 Error:", error.message);
    console.error("📬 Code:", error.code);
    
    return { success: false, error: error.message };
  }
}

// Run the test
testGmailSMTP().then(result => {
  console.log("\n🏁 Test Result:", result);
  process.exit(result.success ? 0 : 1);
});
