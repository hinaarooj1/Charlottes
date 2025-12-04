const fs = require('fs');
const path = require('path');

console.log("🔄 Switching to FinctX configuration...");

// Read current .env
let envContent = fs.readFileSync('.env', 'utf8');

// Create FinctX .env backup
fs.writeFileSync('.env.finctx', envContent);
console.log("✅ Created .env.finctx backup");

// Update package.json for FinctX
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
packageJson.name = "finctx-widget";
fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
console.log("✅ Updated package.json for FinctX");

// Update server.js for FinctX
let serverContent = fs.readFileSync('server.js', 'utf8');
serverContent = serverContent.replace(/Portugal Residency PRO/g, 'FinctX');
serverContent = serverContent.replace(/portugalresidency\.pro/g, 'finctx.com');
serverContent = serverContent.replace(/Sofia/g, 'FinctX Assistant');
serverContent = serverContent.replace(/Herringtonconsulting@gmail\.com/g, 'support@finctx.com');
serverContent = serverContent.replace(/\(234\) 109-6666/g, '(555) 123-4567');

fs.writeFileSync('server.js', serverContent);
console.log("✅ Updated server.js for FinctX");

// Update app.js for FinctX
let appContent = fs.readFileSync('app.js', 'utf8');
appContent = appContent.replace(/Portugal Residency PRO/g, 'FinctX');
appContent = appContent.replace(/portugalresidency\.pro/g, 'finctx.com');
appContent = appContent.replace(/Sofia/g, 'FinctX Assistant');
appContent = appContent.replace(/Herringtonconsulting@gmail\.com/g, 'support@finctx.com');
appContent = appContent.replace(/\(234\) 109-6666/g, '(555) 123-4567');

fs.writeFileSync('app.js', appContent);
console.log("✅ Updated app.js for FinctX");

// Update src/index.ts for FinctX
let indexContent = fs.readFileSync('src/index.ts', 'utf8');
indexContent = indexContent.replace(/portugal-residency-widget/g, 'finctx-widget');
indexContent = indexContent.replace(/Portugal Residency PRO/g, 'FinctX');
indexContent = indexContent.replace(/Sofia/g, 'FinctX Assistant');
indexContent = indexContent.replace(/portugalresidency\.pro/g, 'finctx.com');

fs.writeFileSync('src/index.ts', indexContent);
console.log("✅ Updated src/index.ts for FinctX");

// Update src/template.ts for FinctX
let templateContent = fs.readFileSync('src/template.ts', 'utf8');
templateContent = templateContent.replace(/#a60316/g, '#007bff'); // Blue theme
templateContent = templateContent.replace(/#8a0212/g, '#0056b3'); // Darker blue
templateContent = templateContent.replace(/Sofia/g, 'FinctX Assistant');
templateContent = templateContent.replace(/portugalresidency\.pro/g, 'finctx.com');

fs.writeFileSync('src/template.ts', templateContent);
console.log("✅ Updated src/template.ts for FinctX");

// Update index.html for FinctX
let htmlContent = fs.readFileSync('index.html', 'utf8');
htmlContent = htmlContent.replace(/portugal-residency-chatbot-widget/g, 'finctx-chatbot-widget');
fs.writeFileSync('index.html', htmlContent);
console.log("✅ Updated index.html for FinctX");

console.log("\n🎯 FinctX Configuration Complete!");
console.log("📋 Changes made:");
console.log("• Updated all branding from Portugal Residency PRO to FinctX");
console.log("• Changed theme colors to blue (#007bff)");
console.log("• Updated contact information");
console.log("• Changed widget names and IDs");
console.log("• Created .env.finctx backup");

console.log("\n📋 Next Steps:");
console.log("1. Run: node restore-finctx.js (to restore FinctX assistant)");
console.log("2. Update .env with FinctX assistant ID");
console.log("3. Restart server: npm run start:ps");
console.log("4. Test at: http://localhost:5000");

console.log("\n💡 To switch back to Portugal:");
console.log("• Run: node switch-to-portugal.js");
