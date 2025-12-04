# Deploy Portugal Residency PRO Chatbot on Vercel

## 🚀 Vercel Deployment Guide

### Step 1: Prepare for Vercel

#### Create vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/themes/w/widget.min.js",
      "dest": "/themes/w/widget.min.js"
    },
    {
      "src": "/(.*)",
      "dest": "server.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### Update package.json for Vercel
```json
{
  "name": "portugal-residency-widget",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "build": "cross-env NODE_ENV=production webpack --config webpack.config.js",
    "start": "node server.js",
    "vercel-build": "npm run build"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### Step 2: Create Vercel Server Handler

#### Create api/index.js (for API routes)
```javascript
const { createServer } = require('http');
const socketIo = require('socket.io');
const OpenAI = require('openai');
const sendEmail = require('../emailService');

// Your existing server logic here
module.exports = (req, res) => {
  // Handle API requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  // Your API logic here
  res.status(200).json({ message: 'Portugal Residency PRO API' });
};
```

### Step 3: Deploy to Vercel

#### Method 1: Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Set environment variables
vercel env add OPENAI_API_KEY
vercel env add EMAIL_PASSWORD
vercel env add ASSISTANT_ID
vercel env add EMAIL_USER
vercel env add EMAIL_FROM
vercel env add EMAIL_TO
vercel env add WEBHOOK_URL
vercel env add SOCKET_CORS_ORIGIN
```

#### Method 2: GitHub Integration
1. Go to https://vercel.com
2. Sign up/Login with GitHub
3. Click "New Project"
4. Import your repository
5. Configure:
   - **Framework Preset:** Other
   - **Build Command:** `npm run build`
   - **Output Directory:** `public`
   - **Install Command:** `npm install`

### Step 4: Environment Variables

Set these in Vercel dashboard:
```
OPENAI_API_KEY=your_openai_key
ASSISTANT_ID=asst_jWyNBEdOI1ZD0bk2nGQZmxt9
EMAIL_SERVICE=gmail
EMAIL_USER=Herringtonconsulting@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=Herringtonconsulting@gmail.com
EMAIL_TO=Herringtonconsulting@gmail.com
WEBHOOK_URL=https://n8n.srv917741.hstgr.cloud/webhook/ac21fa0b-ad69-45bf-857b-4bce97ea14bd
SOCKET_CORS_ORIGIN=https://portugalresidency.pro
NODE_ENV=production
```

### Step 5: Custom Domain Setup

1. In Vercel dashboard, go to your project
2. Click "Settings" → "Domains"
3. Add: `chat.portugalresidency.pro`
4. Update DNS records:
   ```
   Type: CNAME
   Name: chat
   Value: cname.vercel-dns.com
   ```

### Step 6: Integration Code

```html
<!-- Add to portugalresidency.pro -->
<script defer src="https://your-app.vercel.app/themes/w/widget.min.js"></script>
<div id="portugal-residency-chatbot-widget"></div>
<script>
  window.onload = () => {
    widget = window.GreeterWidget("6347b4e595cf065c9388f4ab");
  };
</script>
```

## ⚠️ Vercel Limitations

### WebSocket Issues:
- Vercel has limited WebSocket support on serverless functions
- May need to use Socket.IO with polling fallback
- Consider using Pusher or similar service for real-time features

### Alternative: Hybrid Approach
1. Host static files on Vercel
2. Use external WebSocket service (Pusher, Ably)
3. Keep email service on Vercel

## 💰 Vercel Pricing

- **Hobby:** Free (limited)
- **Pro:** $20/month
- **Team:** $20/month per member
- **Custom Domain:** Free
- **SSL:** Free (automatic)

## ✅ Vercel Advantages

- ✅ Excellent for static sites
- ✅ Automatic deployments from GitHub
- ✅ Global CDN
- ✅ Free SSL certificates
- ✅ Custom domains
- ✅ Environment variables
- ✅ Serverless functions

## ❌ Vercel Limitations for Chatbots

- ❌ Limited WebSocket support
- ❌ Serverless function timeouts
- ❌ Cold starts can affect real-time chat
- ❌ More complex setup for real-time features

## 🎯 Recommendation

**For Portugal Residency PRO chatbot:**
- **Use Render** for full functionality (WebSocket support)
- **Use Vercel** only if you implement alternative real-time solution

## 🚀 Quick Vercel Deploy

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel

# 4. Set environment variables
vercel env add OPENAI_API_KEY
vercel env add EMAIL_PASSWORD

# 5. Redeploy
vercel --prod
```

Your chatbot will be available at:
- Vercel URL: `https://your-app.vercel.app`
- Custom domain: `https://chat.portugalresidency.pro`
