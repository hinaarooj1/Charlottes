const nodemailer = require("nodemailer");

// Simple email service that works on most platforms
async function sendSimpleEmail(to, subject, text, html) {
  try {
    console.log(`📧 Sending email to: ${to}`);
    console.log(`📧 Subject: ${subject}`);

    // Try multiple email services
    const services = [
      {
        name: "Gmail",
        host: process.env.HOST,
        port: process.env.PORT,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        }
      },
      {
        name: "Outlook",
        host: "smtp-mail.outlook.com", 
        port: 587,
        secure: false,
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        }
      }
    ];

    for (const service of services) {
      try {
        console.log(`🔄 Trying ${service.name}...`);
        
        const transporter = nodemailer.createTransporter(service);

        const mailOptions = {
          from: {
            name: "Portugal Residency PRO",
            address: process.env.EMAIL_USER
          },
          to: to,
          subject: subject,
          text: text,
          html: html || text.replace(/\n/g, '<br>'),
          headers: {
            'X-Mailer': 'Portugal Residency PRO',
          }
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent successfully via ${service.name}`);
        console.log(`📬 Message ID: ${info.messageId}`);
        
        return { success: true, provider: service.name, messageId: info.messageId };

      } catch (serviceError) {
        console.log(`❌ ${service.name} failed: ${serviceError.message}`);
        continue;
      }
    }

    throw new Error("All email services failed");

  } catch (error) {
    console.error("❌ Email sending failed:", error.message);
    return { success: false, error: error.message };
  }
}

module.exports = sendSimpleEmail;
