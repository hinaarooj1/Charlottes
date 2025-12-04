#!/bin/bash

echo "🚀 Portugal Residency PRO Chatbot - Quick Deploy Script"
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Step 1: Checking files...${NC}"
if [ -f "themes/w/widget.min.js" ]; then
    echo -e "${GREEN}✅ Widget file found${NC}"
else
    echo -e "${RED}❌ Widget file missing. Run: npm run build${NC}"
    exit 1
fi

echo -e "${BLUE}Step 2: Production files ready:${NC}"
echo "📁 Files to upload:"
echo "   • themes/w/widget.min.js (59.2 KB)"
echo "   • server.js"
echo "   • package.json"
echo "   • .env (configure for production)"
echo "   • emailService.js"

echo -e "${BLUE}Step 3: Server setup commands:${NC}"
echo "📋 Run these commands on your server:"
echo ""
echo "   # Upload files"
echo "   scp -r themes/ server.js package.json .env user@server:/var/www/widget/"
echo ""
echo "   # SSH to server"
echo "   ssh user@your-server-ip"
echo ""
echo "   # Install dependencies"
echo "   cd /var/www/widget"
echo "   npm install"
echo ""
echo "   # Start with PM2"
echo "   npm install -g pm2"
echo "   pm2 start server.js --name 'portugal-widget'"
echo "   pm2 startup"
echo "   pm2 save"
echo ""
echo "   # Setup SSL (optional)"
echo "   sudo certbot --nginx -d chat.portugalresidency.pro"

echo -e "${BLUE}Step 4: Website integration code:${NC}"
echo "📝 Add this to portugalresidency.pro before </body> tag:"
echo ""
echo -e "${YELLOW}<script defer src=\"https://chat.portugalresidency.pro/themes/w/widget.min.js\"></script>${NC}"
echo -e "${YELLOW}<div id=\"portugal-residency-chatbot-widget\"></div>${NC}"
echo -e "${YELLOW}<script>${NC}"
echo -e "${YELLOW}  window.onload = () => {${NC}"
echo -e "${YELLOW}    widget = window.GreeterWidget(\"6347b4e595cf065c9388f4ab\");${NC}"
echo -e "${YELLOW}  };${NC}"
echo -e "${YELLOW}</script>${NC}"

echo ""
echo -e "${BLUE}Step 5: Production environment variables:${NC}"
echo "📋 Create .env file on server:"
echo ""
echo "NODE_PORT=5000"
echo "NODE_ENV=production"
echo "OPENAI_API_KEY=your_openai_key"
echo "ASSISTANT_ID=asst_jWyNBEdOI1ZD0bk2nGQZmxt9"
echo "EMAIL_SERVICE=gmail"
echo "EMAIL_USER=Herringtonconsulting@gmail.com"
echo "EMAIL_PASSWORD=your_gmail_app_password"
echo "EMAIL_FROM=Herringtonconsulting@gmail.com"
echo "EMAIL_TO=Herringtonconsulting@gmail.com"
echo "WEBHOOK_URL=your_webhook_url"
echo "SOCKET_CORS_ORIGIN=https://portugalresidency.pro"

echo ""
echo -e "${GREEN}✅ Deployment checklist:${NC}"
echo "□ Upload widget files to server"
echo "□ Configure production environment variables"
echo "□ Install dependencies on server"
echo "□ Start Node.js server with PM2"
echo "□ Add widget code to portugalresidency.pro"
echo "□ Test chat functionality"
echo "□ Verify email sending"
echo "□ Check mobile responsiveness"
echo "□ Setup SSL certificate"
echo "□ Configure domain and DNS"

echo ""
echo -e "${GREEN}🎯 Ready for production deployment!${NC}"
echo "Sofia will provide Portugal Golden Visa services with:"
echo "• Contact: (234) 109-6666"
echo "• Email: Herringtonconsulting@gmail.com"
echo "• Investment options: €500K, €1M, €350K"
echo "• Crypto investment guidance"
echo "• Professional responses"

echo ""
echo -e "${BLUE}📞 Support:${NC}"
echo "If you need help with deployment, contact:"
echo "• Email: Herringtonconsulting@gmail.com"
echo "• Phone: (234) 109-6666"
echo "• Website: https://portugalresidency.pro/"
