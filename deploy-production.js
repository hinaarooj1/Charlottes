const fs = require('fs');
const path = require('path');

console.log('🚀 Portugal Residency PRO - Production Deployment Script');
console.log('=======================================================\n');

// Check if production files exist
const requiredFiles = [
  'themes/w/widget.min.js',
  'server.js',
  'package.json',
  'start.ps1'
];

console.log('📋 Checking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Found`);
  } else {
    console.log(`❌ ${file} - Missing`);
  }
});

console.log('\n📦 Production Build Information:');
const widgetPath = 'themes/w/widget.min.js';
if (fs.existsSync(widgetPath)) {
  const stats = fs.statSync(widgetPath);
  console.log(`• Widget file: ${widgetPath}`);
  console.log(`• File size: ${(stats.size / 1024).toFixed(2)} KB`);
  console.log(`• Last modified: ${stats.mtime.toISOString()}`);
}

console.log('\n🌐 Deployment Steps:');
console.log('1. Upload files to your server');
console.log('2. Install Node.js dependencies: npm install');
console.log('3. Configure environment variables');
console.log('4. Start the server: npm run start:ps');
console.log('5. Add widget code to portugalresidency.pro');

console.log('\n📝 Environment Variables for Production:');
console.log('NODE_PORT=5000');
console.log('NODE_ENV=production');
console.log('OPENAI_API_KEY=your_openai_key');
console.log('ASSISTANT_ID=asst_jWyNBEdOI1ZD0bk2nGQZmxt9');
console.log('EMAIL_SERVICE=gmail');
console.log('EMAIL_USER=Herringtonconsulting@gmail.com');
console.log('EMAIL_PASSWORD=your_app_password');
console.log('EMAIL_FROM=Herringtonconsulting@gmail.com');
console.log('EMAIL_TO=Herringtonconsulting@gmail.com');
console.log('WEBHOOK_URL=your_webhook_url');
console.log('SOCKET_CORS_ORIGIN=https://portugalresidency.pro');

console.log('\n🔗 Widget Integration Code:');
console.log('<script defer src="https://your-server-domain.com/themes/w/widget.min.js"></script>');
console.log('<div id="portugal-residency-chatbot-widget"></div>');
console.log('<script>');
console.log('  window.onload = () => {');
console.log('    widget = window.GreeterWidget("6347b4e595cf065c9388f4ab");');
console.log('  };');
console.log('</script>');

console.log('\n✅ Deployment checklist:');
console.log('□ Upload widget.min.js to server');
console.log('□ Configure production environment variables');
console.log('□ Install dependencies on server');
console.log('□ Start Node.js server');
console.log('□ Add widget code to website');
console.log('□ Test chat functionality');
console.log('□ Verify email sending');
console.log('□ Check mobile responsiveness');
console.log('□ Set up SSL certificate');
console.log('□ Configure domain and DNS');

console.log('\n🎯 Ready for production deployment!');
