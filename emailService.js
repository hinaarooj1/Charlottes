const nodemailer = require("nodemailer");
const axios = require("axios");

// Load environment variables
require("dotenv").config({ path: require('path').resolve(__dirname, '.env') });

module.exports = async (email, subject, text, html) => {
  try {
    // ✅ INPUT VALIDATION
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new Error(`Invalid email address: ${email}`);
    }

    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      throw new Error('Email subject is required and cannot be empty');
    }

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Email text/body is required and cannot be empty');
    }

    console.log(`📧 Attempting to send email to: ${email}`);
    console.log(`📧 Subject: ${subject.substring(0, 50)}${subject.length > 50 ? '...' : ''}`);

    // 📊 CHECK AVAILABLE EMAIL SERVICES
    const availableServices = {
      smtp: !!(process.env.EMAIL_USER && process.env.EMAIL_PASSWORD && process.env.EMAIL_FROM),
      resend: !!(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim()),
      emailjs: !!(process.env.EMAILJS_SERVICE_ID && process.env.EMAILJS_TEMPLATE_ID && process.env.EMAILJS_PUBLIC_KEY),
      webhook: !!(process.env.WEBHOOK_URL && process.env.WEBHOOK_URL.trim())
    };

    console.log('📊 Available email services:', {
      smtp: availableServices.smtp ? '✅ Configured' : '❌ Missing SMTP config',
      resend: availableServices.resend ? '✅ Configured' : '❌ Missing RESEND_API_KEY',
      emailjs: availableServices.emailjs ? '✅ Configured' : '❌ Missing EMAILJS config',
      webhook: availableServices.webhook ? '✅ Configured' : '❌ Missing WEBHOOK_URL'
    });

    const totalServices = Object.values(availableServices).filter(Boolean).length;
    console.log(`🎯 Will try ${totalServices} available service(s) in order`);

    let attemptedServices = [];
    let lastError = null;

    // ✅ OPTION 1: SMTP First (nodemailer)
    if (availableServices.smtp) {
      console.log('\n📨 [1/4] Trying SMTP via nodemailer');
      attemptedServices.push('smtp');

      try {
        const transporter = nodemailer.createTransport({
          host:process.env.HOST,
          port: process.env.PORT,
          secure: false,
          service: process.env.EMAIL_SERVICE,
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD,
          },
          connectionTimeout: 10000,
          greetingTimeout: 10000,
          socketTimeout: 10000,
          tls: {
            rejectUnauthorized: false,
            minVersion: 'TLSv1.2'
          }
        });

        console.log(`📧 SMTP Config: ${process.env.HOST}:${process.env.PORT}`);

        // Quick SMTP verification
        console.log('🔌 Verifying SMTP connection (10s timeout)...');
        await transporter.verify();
        console.log('✅ SMTP connection verified');

        // Send via SMTP
        const mailOptions = {
          from: {
            name: "Portugal Residency PRO",
            address: process.env.EMAIL_FROM || process.env.EMAIL_USER
          },
          to: email,
          subject: subject,
          text: text,
          html: html || text.replace(/\n/g, '<br>'),
          headers: {
            'X-Mailer': 'Portugal Residency PRO Email Service',
            'X-Priority': '1',
            'Importance': 'high'
          }
        };

        const info = await transporter.sendMail(mailOptions);

        console.log(`✅ SUCCESS! Email sent via SMTP to: ${email}`);
        console.log(`📬 Message ID: ${info.messageId}`);

        return {
          success: true,
          messageId: info.messageId,
          provider: 'smtp',
          method: 'nodemailer',
          attemptedServices
        };

      } catch (smtpError) {
        lastError = smtpError;
        console.error(`❌ SMTP failed: ${smtpError.message}`);
        
        if (smtpError.code === 'ETIMEDOUT' || smtpError.message.includes('timeout')) {
          console.log('🚨 SMTP timeout detected - likely blocked by cloud platform');
        }
        console.log('⚠️ Moving to Resend fallback...');
      }
    } else {
      console.log('\n⏭️ [1/4] Skipping SMTP - not configured');
    }

    // ✅ OPTION 2: Try Resend API (FREE fallback - 3000 emails/month, no phone verification!)
    if (availableServices.resend) {
      console.log('\n🚀 [2/4] Trying Resend API (fallback)');
      attemptedServices.push('resend');

      try {
        const { Resend } = require('resend');
        const resend = new Resend(process.env.RESEND_API_KEY);

        const { data, error } = await resend.emails.send({
          from: process.env.RESEND_FROM || `Portugal Residency PRO <onboarding@resend.dev>`,
          to: email,
          subject: subject,
          text: text,
          html: html || text.replace(/\n/g, '<br>')
        });

        if (error) {
          throw new Error(`Resend API error: ${error.message}`);
        }

        console.log(`✅ SUCCESS! Email sent via Resend to: ${email}`);
        console.log(`📬 Message ID: ${data.id}`);
        return {
          success: true,
          messageId: data.id,
          provider: 'resend',
          method: 'api',
          attemptedServices
        };
      } catch (resendError) {
        lastError = resendError;
        console.error(`❌ Resend failed: ${resendError.message}`);
        console.log('⚠️ Continuing to next service...');
      }
    } else {
      console.log('\n⏭️ [2/4] Skipping Resend API - not configured');
    }

    // ✅ OPTION 3: Try EmailJS API (200 emails/month free)
    if (availableServices.emailjs) {
      console.log('\n📧 [3/4] Trying EmailJS API');
      attemptedServices.push('emailjs');

      try {
        const emailjs = require('@emailjs/nodejs');
        
        const templateParams = {
          to_email: email,
          to_name: email.split('@')[0],
          subject: subject,
          message: text,
          from_name: 'Portugal Residency PRO',
          reply_to: process.env.EMAILJS_REPLY_TO || process.env.EMAIL_USER
        };

        const response = await emailjs.send(
          process.env.EMAILJS_SERVICE_ID,
          process.env.EMAILJS_TEMPLATE_ID,
          templateParams,
          {
            publicKey: process.env.EMAILJS_PUBLIC_KEY,
            privateKey: process.env.EMAILJS_PRIVATE_KEY,
          }
        );

        console.log(`✅ SUCCESS! Email sent via EmailJS to: ${email}`);
        console.log(`📬 Response: ${response.status} ${response.text}`);
        return {
          success: true,
          messageId: response.text,
          provider: 'emailjs',
          method: 'api',
          attemptedServices
        };
      } catch (emailjsError) {
        lastError = emailjsError;
        console.error(`❌ EmailJS failed: ${emailjsError.message}`);
        console.log('⚠️ Continuing to next service...');
      }
    } else {
      console.log('\n⏭️ [3/4] Skipping EmailJS - not configured');
    }

    // ✅ OPTION 4: Try Webhook (Final fallback)
    if (availableServices.webhook) {
      console.log('\n🔗 [4/4] Trying Webhook fallback');
      console.log(`🔗 Webhook URL: ${process.env.WEBHOOK_URL}`);
      attemptedServices.push('webhook');

      try {
        const mailOptions = {
          from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
          to: email,
          subject: subject,
          text: text,
          html: html || text.replace(/\n/g, '<br>')
        };

        console.log(`📤 Sending webhook request with data:`, JSON.stringify(mailOptions, null, 2));

        const response = await axios.post(process.env.WEBHOOK_URL, mailOptions, {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 15000
        });

        const result = response.data || {};
        console.log(`✅ SUCCESS! Email sent via Webhook to: ${email}`);
        console.log(`📬 Webhook response:`, result);

        return {
          success: true,
          provider: 'webhook',
          method: 'http',
          attemptedServices,
          webhookResponse: result
        };
      } catch (webhookError) {
        lastError = webhookError;
        console.error(`❌ Webhook failed: ${webhookError.message}`);
        if (webhookError.response) {
          console.error(`📬 Webhook response status: ${webhookError.response.status}`);
          console.error(`📬 Webhook response data:`, webhookError.response.data);
        }
      }
    } else {
      console.log('\n⏭️ [4/4] Skipping Webhook - not configured');
    }

    // 🚨 ALL SERVICES FAILED
    console.error('\n❌ ALL EMAIL SERVICES FAILED!');
    console.error(`📊 Services attempted: ${attemptedServices.join(' → ')}`);

    // Create comprehensive error message
    let errorMsg = `❌ FAILED to send email to ${email}\n\n`;
    errorMsg += `🔥 ATTEMPTED SERVICES: ${attemptedServices.length > 0 ? attemptedServices.join(' → ') : 'NONE'}\n`;

    if (attemptedServices.length === 0) {
      errorMsg += `\n🚨 NO EMAIL SERVICES CONFIGURED!\n`;
      errorMsg += `✅ QUICK SETUP:\n`;
      errorMsg += `   Option 1 - SMTP (tried first):\n`;
      errorMsg += `     EMAIL_USER=your@gmail.com\n`;
      errorMsg += `     EMAIL_PASSWORD=your-app-password\n`;
      errorMsg += `     EMAIL_FROM=your@gmail.com\n`;
      errorMsg += `\n`;
      errorMsg += `   Option 2 - Resend API (FREE fallback - 3000 emails/month):\n`;
      errorMsg += `     1. Sign up: https://resend.com/ (No phone verification!)\n`;
      errorMsg += `     2. Get API key: Dashboard > API Keys\n`;
      errorMsg += `     3. Add to env: RESEND_API_KEY=re_xxxxx\n`;
      errorMsg += `     4. Restart server\n`;
      errorMsg += `\n`;
      errorMsg += `   Option 3 - Configure WEBHOOK_URL for n8n fallback\n`;
    } else {
      errorMsg += `\n📝 LAST ERROR: ${lastError?.message || 'Unknown error'}\n`;
    }

    throw new Error(errorMsg);

  } catch (error) {
    console.error('❌ Email FAILED to send to:', email);
    console.error('📧 Email error details:', error);

    // ✅ STRUCTURED ERROR OBJECT
    const errorObj = {
      email,
      subject,
      text,
      errorType: 'unknown',
      errorMessage: error.message,
      timestamp: new Date().toISOString(),
      retryable: true
    };

    // ✅ ERROR CLASSIFICATION
    const errorMessage = error.message.toLowerCase();

    if (errorMessage.includes('timeout') || errorMessage.includes('etimedout')) {
      errorObj.errorType = 'timeout';
      errorObj.errorCode = 'TIMEOUT';
      errorObj.errorMessage = 'Connection timeout - server not responding';
      errorObj.retryable = true;
    } else if (errorMessage.includes('econnrefused')) {
      errorObj.errorType = 'connection_refused';
      errorObj.errorCode = 'REFUSED';
      errorObj.errorMessage = 'Server refused connection';
      errorObj.retryable = true;
    } else if (errorMessage.includes('enotfound')) {
      errorObj.errorType = 'dns_error';
      errorObj.errorCode = 'DNS_ERROR';
      errorObj.errorMessage = 'Server not found - DNS resolution failed';
      errorObj.retryable = false;
    } else if (errorMessage.includes('eauth') || error.responseCode === 535) {
      errorObj.errorType = 'authentication';
      errorObj.errorCode = 'AUTH_FAILED';
      errorObj.errorMessage = 'Authentication failed - invalid credentials';
      errorObj.retryable = false;
    } else if (error.responseCode >= 500) {
      errorObj.errorType = 'server_error';
      errorObj.errorCode = 'SERVER_ERROR';
      errorObj.errorMessage = 'Server error';
      errorObj.retryable = true;
    } else if (error.responseCode === 550) {
      errorObj.errorType = 'recipient_error';
      errorObj.errorCode = 'INVALID_RECIPIENT';
      errorObj.errorMessage = 'Recipient email rejected by server';
      errorObj.retryable = false;
    }

    // ✅ DETAILED ERROR LOGGING
    console.log('🚨 EMAIL FAILURE ANALYSIS:');
    console.log(`   📧 Recipient: ${email}`);
    console.log(`   🏷️  Subject: ${subject}`);
    console.log(`   ❌ Error Code: ${errorObj.errorCode}`);
    console.log(`   📝 Error Message: ${errorObj.errorMessage}`);
    console.log(`   🔄 Retryable: ${errorObj.retryable}`);

    throw errorObj;
  }
};
