const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Portugal Residency PRO Chatbot for Render deployment...');

// Create render.yaml
const renderYaml = `services:
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
        value: https://portugalresidency.pro`;

fs.writeFileSync('render.yaml', renderYaml);
console.log('✅ Created render.yaml');

// Update package.json for Render
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.engines = { "node": "18.x" };
packageJson.scripts.start = "node server.js";

fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log('✅ Updated package.json for Render');

// Update server.js for Render
let serverContent = fs.readFileSync('server.js', 'utf8');

// Add PORT environment variable support
if (!serverContent.includes('process.env.PORT')) {
  serverContent = serverContent.replace(
    'const runServer = async () => {',
    'const PORT = process.env.PORT || 5000;\n\nconst runServer = async () => {'
  );
  
  serverContent = serverContent.replace(
    'console.log(`http://localhost:${process.env.NODE_PORT}`);',
    'console.log(`🚀 Server starting on port ${PORT}`);'
  );
}

fs.writeFileSync('server.js', serverContent);
console.log('✅ Updated server.js for Render');

// Create .env template for Render
const envTemplate = `# Render Environment Variables Template
# Copy these to Render dashboard

NODE_ENV=production
PORT=10000
OPENAI_API_KEY=your_openai_key_here
ASSISTANT_ID=asst_jWyNBEdOI1ZD0bk2nGQZmxt9
EMAIL_SERVICE=gmail
EMAIL_USER=Herringtonconsulting@gmail.com
EMAIL_PASSWORD=your_gmail_app_password_here
EMAIL_FROM=Herringtonconsulting@gmail.com
EMAIL_TO=Herringtonconsulting@gmail.com
WEBHOOK_URL=https://n8n.srv917741.hstgr.cloud/webhook/ac21fa0b-ad69-45bf-857b-4bce97ea14bd
SOCKET_CORS_ORIGIN=https://portugalresidency.pro`;

fs.writeFileSync('render-env-template.txt', envTemplate);
console.log('✅ Created render-env-template.txt');

console.log('\n🎯 Render Deployment Setup Complete!');
console.log('\n📋 Next Steps:');
console.log('1. Push to GitHub:');
console.log('   git add .');
console.log('   git commit -m "Deploy to Render"');
console.log('   git push origin main');
console.log('');
console.log('2. Go to https://render.com');
console.log('3. Create new Web Service');
console.log('4. Connect your GitHub repository');
console.log('5. Use these settings:');
console.log('   • Build Command: npm install && npm run build');
console.log('   • Start Command: npm start');
console.log('   • Plan: Starter ($7/month)');
console.log('');
console.log('6. Set environment variables from render-env-template.txt');
console.log('');
console.log('7. Add integration code to portugalresidency.pro:');
console.log('   <script defer src="https://your-app-name.onrender.com/themes/w/widget.min.js"></script>');
console.log('   <div id="portugal-residency-chatbot-widget"></div>');
console.log('   <script>');
console.log('     window.onload = () => {');
console.log('       widget = window.GreeterWidget("6347b4e595cf065c9388f4ab");');
console.log('     };');
console.log('   </script>');
console.log('');
console.log('✅ Sofia will be live on Render!');
