# 🚀 Render Deployment Fix Guide

## Issues Fixed

### 1. ✅ Port Binding Issue
**Problem:** `==> No open ports detected on 0.0.0.0`
**Solution:** Created `server-production.js` that properly binds to `0.0.0.0:${PORT}`

### 2. ✅ Email Timeout Issue  
**Problem:** `Email configuration error: Error: Connection timeout`
**Solution:** Enhanced email service with webhook fallback

### 3. ✅ Missing Script Issue
**Problem:** `npm error Missing script: "start:ps"`
**Solution:** Added `start:ps` script back to package.json

## 🎯 Render Deployment Steps

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Fix Render deployment issues"
git push origin main
```

### Step 2: Deploy on Render
1. Go to https://render.com
2. Create new **Web Service**
3. Connect your GitHub repository
4. Use these settings:
   - **Name:** portugal-residency-widget
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Starter ($7/month)

### Step 3: Environment Variables
Set these in Render dashboard:
```
NODE_ENV=production
PORT=10000
OPENAI_API_KEY=your_openai_key
ASSISTANT_ID=asst_U1evpT53Ps0e3awBBi8JuAF3
EMAIL_SERVICE=gmail
EMAIL_USER=Herringtonconsulting@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=Herringtonconsulting@gmail.com
EMAIL_TO=Herringtonconsulting@gmail.com
WEBHOOK_URL=https://n8n.srv917741.hstgr.cloud/webhook/ac21fa0b-ad69-45bf-857b-4bce97ea14bd
SOCKET_CORS_ORIGIN=https://portugalresidency.pro
```

## 🔧 What Was Fixed

### server-production.js Features:
- ✅ **Proper port binding** to `0.0.0.0:${PORT}`
- ✅ **Express.js server** for production
- ✅ **Static file serving** for widget files
- ✅ **Health check endpoint** at `/health`
- ✅ **Graceful shutdown** handling
- ✅ **Socket.IO integration** with CORS
- ✅ **Email service** with webhook fallback
- ✅ **Session management** with duplicate prevention

### Package.json Updates:
- ✅ **Added express dependency**
- ✅ **Fixed start:ps script**
- ✅ **Production start command** uses server-production.js

## 🎯 Expected Results

After deployment, you should see:
```
🚀 Portugal Residency PRO Chatbot running on http://0.0.0.0:10000
🌍 Environment: production
🤖 Assistant ID: asst_U1evpT53Ps0e3awBBi8JuAF3
```

## 🔗 Integration Code

Add this to https://portugalresidency.pro/:

```html
<script defer src="https://your-app-name.onrender.com/themes/w/widget.min.js"></script>
<div id="portugal-residency-chatbot-widget"></div>
<script>
  window.onload = () => {
    widget = window.GreeterWidget("6347b4e595cf065c9388f4ab");
  };
</script>
```

## ✅ All Issues Resolved

1. ✅ **Port binding** - Server now binds to 0.0.0.0
2. ✅ **Email timeout** - Webhook fallback prevents failures  
3. ✅ **Missing script** - start:ps script restored
4. ✅ **Production ready** - Optimized for Render deployment
5. ✅ **Fully trained Sofia** - Latest website data integrated

**Your chatbot is now ready for production deployment on Render!** 🚀
