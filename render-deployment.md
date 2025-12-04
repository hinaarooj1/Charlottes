# Deploy Portugal Residency PRO Chatbot on Render

## 🚀 Render Deployment Guide

### Step 1: Prepare Files for Render

#### Required files:
```
📁 Your Repository
├── server.js (main server file)
├── package.json
├── themes/w/widget.min.js (59.2 KB)
├── .env (environment variables)
├── emailService.js
├── src/ (source files)
├── public/
└── README.md
```

### Step 2: Update package.json for Render

```json
{
  "name": "portugal-residency-widget",
  "version": "1.0.0",
  "description": "Portugal Residency PRO Chat Widget",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "build": "cross-env NODE_ENV=production webpack --config webpack.config.js",
    "dev": "node server.js"
  },
  "engines": {
    "node": "18.x"
  },
  "dependencies": {
    "@types/socket.io-client": "^3.0.0",
    "autoprefixer": "10.4.5",
    "axios": "^0.27.2",
    "bootstrap": "^5.1.3",
    "cookie-parser": "^1.4.6",
    "cors": "^2.8.5",
    "cross-env": "^7.0.3",
    "css-loader": "^6.7.1",
    "cssnano": "^5.1.9",
    "dotenv": "^16.0.1",
    "dotenv-webpack": "^7.1.0",
    "drizzle-zod": "^0.7.0",
    "file-loader": "^6.2.0",
    "html-webpack-plugin": "^5.5.0",
    "http": "^0.0.1-security",
    "nodemailer": "^6.10.0",
    "openai": "^4.86.1",
    "postcss-loader": "^7.0.0",
    "recordrtc": "^5.6.2",
    "socket.io": "^4.8.1",
    "socket.io-client": "^4.8.1",
    "style-loader": "^3.3.1",
    "ts-loader": "^9.3.0",
    "typescript": "^4.7.2",
    "webpack": "^5.72.1",
    "webpack-cli": "^4.9.2",
    "webpack-dev-server": "^4.9.0",
    "ws": "^8.18.1",
    "zod": "^3.24.2"
  }
}
```

### Step 3: Create render.yaml

```yaml
services:
  - type: web
    name: portugal-residency-widget
    env: node
    plan: starter
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 10000
      - key: OPENAI_API_KEY
        sync: false
      - key: ASSISTANT_ID
        value: asst_jWyNBEdOI1ZD0bk2nGQZmxt9
      - key: EMAIL_SERVICE
        value: gmail
      - key: EMAIL_USER
        value: Herringtonconsulting@gmail.com
      - key: EMAIL_PASSWORD
        sync: false
      - key: EMAIL_FROM
        value: Herringtonconsulting@gmail.com
      - key: EMAIL_TO
        value: Herringtonconsulting@gmail.com
      - key: WEBHOOK_URL
        value: https://n8n.srv917741.hstgr.cloud/webhook/ac21fa0b-ad69-45bf-857b-4bce97ea14bd
      - key: SOCKET_CORS_ORIGIN
        value: https://portugalresidency.pro
```

### Step 4: Update server.js for Render

```javascript
// Add at the top of server.js
const PORT = process.env.PORT || 5000;

// Update the server start
const runServer = async () => {
  console.log(`🚀 Server starting on port ${PORT}`);
  await server.start();
  // ... rest of your code
};

// Start server
runServer().catch(console.error);
```

### Step 5: Deploy to Render

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy to Render"
   git push origin main
   ```

2. **Connect to Render:**
   - Go to https://render.com
   - Sign up/Login
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select your repository

3. **Configure deployment:**
   - **Name:** portugal-residency-widget
   - **Environment:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
   - **Plan:** Starter ($7/month)

4. **Set Environment Variables:**
   - `OPENAI_API_KEY`: your_openai_key
   - `EMAIL_PASSWORD`: your_gmail_app_password
   - `NODE_ENV`: production
   - `PORT`: 10000 (Render default)

### Step 6: Custom Domain (Optional)

1. In Render dashboard, go to your service
2. Click "Settings" → "Custom Domains"
3. Add: `chat.portugalresidency.pro`
4. Update DNS records as shown

### Step 7: Integration Code

```html
<!-- Add to portugalresidency.pro -->
<script defer src="https://your-app-name.onrender.com/themes/w/widget.min.js"></script>
<div id="portugal-residency-chatbot-widget"></div>
<script>
  window.onload = () => {
    widget = window.GreeterWidget("6347b4e595cf065c9388f4ab");
  };
</script>
```

## 💰 Render Pricing

- **Starter Plan:** $7/month
- **Professional:** $25/month
- **Custom Domain:** Free
- **SSL:** Free (automatic)

## ✅ Render Advantages

- ✅ Easy deployment from GitHub
- ✅ Automatic SSL certificates
- ✅ Custom domains
- ✅ Environment variable management
- ✅ Automatic deployments
- ✅ Built-in monitoring
- ✅ Free tier available (with limitations)

## 🎯 Result

Your chatbot will be available at:
- Render URL: `https://your-app-name.onrender.com`
- Custom domain: `https://chat.portugalresidency.pro`

Sofia will provide Portugal Golden Visa services with full functionality!
