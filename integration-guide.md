# Portugal Residency PRO Chatbot Integration Guide

## 🚀 Complete Deployment Steps

### Step 1: Production Server Setup

#### Option A: VPS/Cloud Server (Recommended)
```bash
# Server Requirements
- Ubuntu 20.04+ or CentOS 7+
- Node.js 18+
- 2GB RAM minimum
- 20GB storage
- SSL certificate
```

#### Option B: Platform-as-a-Service
- **Heroku**: Easy deployment, $7-25/month
- **Railway**: Modern platform, $5-20/month  
- **Render**: Free tier available, $7+/month
- **Vercel**: Good for static + serverless, $20+/month

### Step 2: Upload Files to Server

#### Files to upload:
```
📁 Your Server
├── themes/
│   └── w/
│       └── widget.min.js (59.2 KB)
├── server.js
├── package.json
├── .env (production config)
├── emailService.js
└── start.ps1
```

#### Upload methods:
```bash
# Method 1: SCP/SFTP
scp -r . user@your-server-ip:/var/www/portugal-widget/

# Method 2: Git deployment
git clone your-repo
cd portugal-widget
npm install
```

### Step 3: Production Environment Setup

#### Create production .env file:
```bash
NODE_PORT=5000
NODE_ENV=production
OPENAI_API_KEY=your_openai_key
ASSISTANT_ID=asst_jWyNBEdOI1ZD0bk2nGQZmxt9
EMAIL_SERVICE=gmail
EMAIL_USER=Herringtonconsulting@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=Herringtonconsulting@gmail.com
EMAIL_TO=Herringtonconsulting@gmail.com
WEBHOOK_URL=your_webhook_url
SOCKET_CORS_ORIGIN=https://portugalresidency.pro
```

#### Install dependencies:
```bash
npm install
```

#### Start server:
```bash
# Using PM2 for production
npm install -g pm2
pm2 start server.js --name "portugal-residency-widget"
pm2 startup
pm2 save
```

### Step 4: Domain Configuration

#### Recommended setup:
```
chat.portugalresidency.pro → Your server IP
```

#### DNS Records:
```
Type: A
Name: chat
Value: YOUR_SERVER_IP
TTL: 300
```

### Step 5: SSL Certificate

#### Let's Encrypt (Free):
```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d chat.portugalresidency.pro
```

#### Or use Cloudflare (Free SSL):
1. Add domain to Cloudflare
2. Enable SSL/TLS encryption
3. Update nameservers

### Step 6: Website Integration

#### Add to portugalresidency.pro HTML:

```html
<!-- Add before </body> tag in all pages -->
<script defer src="https://chat.portugalresidency.pro/themes/w/widget.min.js"></script>
<div id="portugal-residency-chatbot-widget"></div>
<script>
  window.onload = () => {
    widget = window.GreeterWidget("6347b4e595cf065c9388f4ab");
  };
</script>
```

#### WordPress Integration:
```php
// Add to functions.php or use a plugin
function add_portugal_chatbot() {
    ?>
    <script defer src="https://chat.portugalresidency.pro/themes/w/widget.min.js"></script>
    <div id="portugal-residency-chatbot-widget"></div>
    <script>
        window.onload = () => {
            widget = window.GreeterWidget("6347b4e595cf065c9388f4ab");
        };
    </script>
    <?php
}
add_action('wp_footer', 'add_portugal_chatbot');
```

### Step 7: Testing

#### Test checklist:
- [ ] Chatbot loads on website
- [ ] Sofia introduces herself correctly
- [ ] Golden Visa services mentioned
- [ ] Contact info displayed: (234) 109-6666
- [ ] Email sending works
- [ ] Mobile responsive
- [ ] SSL certificate active
- [ ] WebSocket connections stable

### Step 8: Monitoring

#### Server monitoring:
```bash
# Check server status
pm2 status
pm2 logs portugal-residency-widget

# Monitor resources
htop
df -h
```

#### Uptime monitoring:
- UptimeRobot (Free)
- Pingdom
- StatusCake

## 🎯 Quick Deployment Commands

```bash
# 1. Upload files to server
scp -r themes/ server.js package.json .env user@server:/var/www/widget/

# 2. SSH to server
ssh user@your-server-ip

# 3. Install dependencies
cd /var/www/widget
npm install

# 4. Start with PM2
npm install -g pm2
pm2 start server.js --name "portugal-widget"
pm2 startup
pm2 save

# 5. Setup SSL
sudo certbot --nginx -d chat.portugalresidency.pro
```

## 📱 Mobile Optimization

The widget is already mobile-responsive with:
- Touch-friendly buttons
- Responsive design
- Mobile-optimized chat interface
- Fast loading on mobile networks

## 🔧 Troubleshooting

### Common issues:
1. **Port 5000 blocked**: Change to port 80/443 or use reverse proxy
2. **CORS errors**: Check SOCKET_CORS_ORIGIN in .env
3. **SSL issues**: Verify certificate installation
4. **Widget not loading**: Check file paths and permissions

### Debug commands:
```bash
# Check if server is running
pm2 status

# View logs
pm2 logs portugal-residency-widget

# Restart if needed
pm2 restart portugal-residency-widget
```

## 💰 Cost Breakdown

### Monthly costs:
- VPS Server: $5-20
- Domain: $1-2 (if using subdomain)
- SSL Certificate: Free (Let's Encrypt)
- **Total: $6-22/month**

### One-time costs:
- Domain setup: $0-15
- Initial setup time: 2-4 hours

## ✅ Final Integration Code

```html
<!-- Add this to portugalresidency.pro before </body> -->
<script defer src="https://chat.portugalresidency.pro/themes/w/widget.min.js"></script>
<div id="portugal-residency-chatbot-widget"></div>
<script>
  window.onload = () => {
    widget = window.GreeterWidget("6347b4e595cf065c9388f4ab");
  };
</script>
```

## 🎉 Result

After deployment, visitors to https://portugalresidency.pro/ will see:
- Red chat widget button (Portugal Residency PRO colors)
- Sofia introducing herself as Portugal Residency PRO expert
- Golden Visa services information
- Contact details: (234) 109-6666, Herringtonconsulting@gmail.com
- Email collection for lead generation
- Professional, trained responses about Portuguese residency

The chatbot will be fully functional and ready to convert visitors into leads for Portugal Residency PRO services.
