const fs = require('fs');
const path = require('path');

console.log("🇵🇹 Switching to Portugal Residency PRO configuration...");

// Read Portugal .env if it exists
if (fs.existsSync('.env.portugal')) {
  fs.copyFileSync('.env.portugal', '.env');
  console.log("✅ Restored .env from .env.portugal");
}

// Update package.json for Portugal Residency PRO
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.name = "portugal-residency-widget";
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log("✅ Updated package.json for Portugal Residency PRO");

// Update server.js for Portugal Residency PRO
let serverContent = fs.readFileSync('server.js', 'utf8');
serverContent = serverContent.replace(/FinctX/g, 'Portugal Residency PRO');
serverContent = serverContent.replace(/finctx\.com/g, 'portugalresidency.pro');
serverContent = serverContent.replace(/FinctX Assistant/g, 'Sofia');
serverContent = serverContent.replace(/support@finctx\.com/g, 'Herringtonconsulting@gmail.com');
serverContent = serverContent.replace(/\(555\) 123-4567/g, '(234) 109-6666');

fs.writeFileSync('server.js', serverContent);
console.log("✅ Updated server.js for Portugal Residency PRO");

// Update app.js for Portugal Residency PRO
let appContent = fs.readFileSync('app.js', 'utf8');
appContent = appContent.replace(/FinctX/g, 'Portugal Residency PRO');
appContent = appContent.replace(/finctx\.com/g, 'portugalresidency.pro');
appContent = appContent.replace(/FinctX Assistant/g, 'Sofia');
appContent = appContent.replace(/support@finctx\.com/g, 'Herringtonconsulting@gmail.com');
appContent = appContent.replace(/\(555\) 123-4567/g, '(234) 109-6666');

fs.writeFileSync('app.js', appContent);
console.log("✅ Updated app.js for Portugal Residency PRO");

// Update src/index.ts for Portugal Residency PRO
let indexContent = fs.readFileSync('src/index.ts', 'utf8');
indexContent = indexContent.replace(/finctx-widget/g, 'portugal-residency-widget');
indexContent = indexContent.replace(/FinctX/g, 'Portugal Residency PRO');
indexContent = indexContent.replace(/FinctX Assistant/g, 'Sofia');
indexContent = indexContent.replace(/finctx\.com/g, 'portugalresidency.pro');

fs.writeFileSync('src/index.ts', indexContent);
console.log("✅ Updated src/index.ts for Portugal Residency PRO");

// Update src/template.ts for Portugal Residency PRO
let templateContent = fs.readFileSync('src/template.ts', 'utf8');
templateContent = templateContent.replace(/#007bff/g, '#a60316'); // Portugal red
templateContent = templateContent.replace(/#0056b3/g, '#8a0212'); // Darker red
templateContent = templateContent.replace(/FinctX Assistant/g, 'Sofia');
templateContent = templateContent.replace(/finctx\.com/g, 'portugalresidency.pro');

fs.writeFileSync('src/template.ts', templateContent);
console.log("✅ Updated src/template.ts for Portugal Residency PRO");

// Update index.html for Portugal Residency PRO
let htmlContent = fs.readFileSync('index.html', 'utf8');
htmlContent = htmlContent.replace(/finctx-chatbot-widget/g, 'portugal-residency-chatbot-widget');
fs.writeFileSync('index.html', htmlContent);
console.log("✅ Updated index.html for Portugal Residency PRO");

console.log("\n🇵🇹 Portugal Residency PRO Configuration Complete!");
console.log("📋 Changes made:");
console.log("• Updated all branding from FinctX to Portugal Residency PRO");
console.log("• Changed theme colors to red (#a60316)");
console.log("• Updated contact information");
console.log("• Changed widget names and IDs");
console.log("• Restored Portugal .env configuration");

console.log("\n📋 Next Steps:");
console.log("1. Run: node create-new-portugal-assistant.js (if needed)");
console.log("2. Update .env with Portugal assistant ID");
console.log("3. Restart server: npm run start:ps");
console.log("4. Test at: http://localhost:5000");

console.log("\n💡 To switch back to FinctX:");
console.log("• Run: node switch-to-finctx.js");
