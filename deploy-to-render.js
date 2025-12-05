const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing Portugal Residency PRO Chatbot for Render deployment...');

// Check if all required files exist
const requiredFiles = [
  'server-production.js',
  'package.json',
  'themes/w/widget.min.js',
  'emailService.js',
  '.env'
];

console.log('\n📋 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Found`);
  } else {
    console.error(`❌ ${file} - Missing`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.error('\n🚨 Missing required files. Please ensure all files exist before deployment.');
  process.exit(1);
}

// Check widget file size
const widgetStats = fs.statSync('themes/w/widget.min.js');
console.log(`\n📦 Widget file: themes/w/widget.min.js (${(widgetStats.size / 1024).toFixed(2)} KB)`);

// Display deployment information
console.log('\n🎯 Deployment Information:');
console.log('• Server: server-production.js');
console.log('• Widget: themes/w/widget.min.js');
console.log('• Assistant ID: asst_U1evpT53Ps0e3awBBi8JuAF3');
console.log('• Environment: Production');

console.log('\n📋 Next Steps:');
console.log('1. Commit and push changes to GitHub:');
console.log('   git add .');
console.log('   git commit -m "Update production server with widget demo page"');
console.log('   git push origin main');
console.log('');
console.log('2. Render will automatically redeploy with the new code');
console.log('');
console.log('3. After deployment, visit:');
console.log('   https://charlottes.onrender.com/');
console.log('');
console.log('4. You should now see:');
console.log('   • A beautiful demo page');
console.log('   • Working chat widget');
console.log('   • Integration code for your website');

console.log('\n🔗 Integration Code for https://portugalresidency.pro/:');
console.log(`
<script defer src="https://charlottes.onrender.com/themes/w/widget.min.js"></script>
<div id="portugal-residency-chatbot-widget"></div>
<script>
  window.onload = () => {
    widget = window.GreeterWidget("6347b4e595cf065c9388f4ab");
  };
</script>
`);

console.log('\n✅ Ready for deployment! Your chatbot will be live on Render with a working widget demo.');
