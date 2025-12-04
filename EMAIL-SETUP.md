# Email Service Setup Guide

This application uses a **multi-provider email system** with automatic fallback.

## 🔄 Email Service Priority Order

1. **SMTP (nodemailer)** - Primary method
2. **Resend API** - Automatic fallback (FREE - 3000 emails/month)
3. **EmailJS** - Additional fallback
4. **Webhook** - Final fallback (n8n integration)

---

## ⚡ Quick Setup (Recommended)

### Option 1: SMTP with Gmail (Primary)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to: https://myaccount.google.com/apppasswords
   - Create a new app password for "Mail"
   - Copy the 16-character password

3. **Add to your `.env` file**:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
```

### Option 2: Resend API (Fallback - Easiest!)

If SMTP fails (blocked ports on cloud platforms), Resend will automatically take over.

1. **Sign up**: https://resend.com/ (No phone verification required!)
2. **Get API Key**: Dashboard > API Keys > Create API Key
3. **Add to your `.env` file**:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM=Portugal Residency PRO <onboarding@resend.dev>
```

**Note**: Free tier includes 3,000 emails/month. You can use their default sender or add your own domain.

---

## 📦 Installation

Run this command to install dependencies:

```bash
npm install
```

The following packages are used:
- `nodemailer` - SMTP email sending
- `resend` - Resend API client
- `@emailjs/nodejs` - EmailJS API client
- `axios` - HTTP client for webhook fallback

---

## 🔧 Environment Variables

### Required (Choose at least one):

**SMTP (Recommended for local, may fail on cloud):**
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
```

**Resend (Recommended for cloud/production):**
```env
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM=Your Name <yourdomain@resend.dev>
```

### Optional (Additional fallbacks):

**EmailJS:**
```env
EMAILJS_SERVICE_ID=service_xxxxxxx
EMAILJS_TEMPLATE_ID=template_xxxxxxx
EMAILJS_PUBLIC_KEY=xxxxxxxxxxxxxxxx
EMAILJS_PRIVATE_KEY=xxxxxxxxxxxxxxxx
EMAILJS_REPLY_TO=your-email@gmail.com
```

**Webhook (n8n or custom):**
```env
WEBHOOK_URL=https://your-n8n-instance.com/webhook/email
```

---

## ✅ How It Works

The email service automatically tries each provider in order:

1. **SMTP** - Fast, free, works locally
   - ✅ Works great on local machines
   - ❌ May be blocked on Render/Heroku (ports 587/465)
   
2. **Resend** - If SMTP fails, switches automatically
   - ✅ Works on all platforms (API-based)
   - ✅ 3,000 free emails/month
   - ✅ No phone verification required

3. **EmailJS** - Additional fallback
   - ✅ 200 free emails/month
   - Requires template setup

4. **Webhook** - Last resort
   - ✅ Custom n8n workflows
   - Requires external webhook setup

---

## 🚀 Testing Your Setup

After configuration, restart your server:

```bash
npm start
```

The console will show:
```
📊 Available email services:
  smtp: ✅ Configured
  resend: ✅ Configured
  emailjs: ❌ Missing EMAILJS config
  webhook: ❌ Missing WEBHOOK_URL
```

When an email is sent, you'll see:
```
📨 [1/4] Trying SMTP via nodemailer
✅ SUCCESS! Email sent via SMTP to: user@example.com
```

Or if SMTP fails:
```
❌ SMTP failed: Connection timeout
⚠️ Moving to Resend fallback...
🚀 [2/4] Trying Resend API (fallback)
✅ SUCCESS! Email sent via Resend to: user@example.com
```

---

## 🐛 Troubleshooting

### SMTP Authentication Failed
- Make sure you're using an **App Password**, not your regular Gmail password
- Enable 2-Factor Authentication first
- Check that EMAIL_USER and EMAIL_FROM match

### SMTP Timeout on Render/Heroku
- This is normal! Cloud platforms often block SMTP ports
- The system will automatically use Resend as fallback
- Solution: Configure RESEND_API_KEY

### All Services Failing
- Check that at least one service is properly configured
- Verify environment variables are loaded (check server logs)
- Ensure no typos in API keys

---

## 📊 Service Comparison

| Service | Free Tier | Setup Difficulty | Cloud Compatible |
|---------|-----------|------------------|------------------|
| **SMTP** | Unlimited* | Easy | ❌ (ports blocked) |
| **Resend** | 3000/month | Very Easy | ✅ |
| **EmailJS** | 200/month | Medium | ✅ |
| **Webhook** | Custom | Hard | ✅ |

*Gmail has daily sending limits (500/day)

---

## 💡 Recommended Setup

**For Production (Cloud Hosting):**
```env
# Primary - will try first but likely blocked
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=app-password
EMAIL_FROM=your@gmail.com

# Fallback - will work when SMTP is blocked
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM=Portugal Residency PRO <onboarding@resend.dev>
```

**For Local Development:**
```env
# SMTP works great locally
EMAIL_USER=your@gmail.com
EMAIL_PASSWORD=app-password
EMAIL_FROM=your@gmail.com
```

This way you get the best of both worlds! 🎉

