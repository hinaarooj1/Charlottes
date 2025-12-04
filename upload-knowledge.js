const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: require('path').resolve(__dirname, '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function uploadKnowledgeFiles() {
  try {
    console.log("📚 Uploading knowledge files for Portugal Residency PRO...");
    
    // List of knowledge files you can create and upload
    const knowledgeFiles = [
      "portugal-golden-visa-guide.pdf",
      "investment-options.pdf", 
      "application-process.pdf",
      "eligibility-criteria.pdf",
      "faq-portugal-residency.pdf"
    ];
    
    const uploadedFiles = [];
    
    for (const filename of knowledgeFiles) {
      const filePath = path.join(__dirname, "knowledge", filename);
      
      if (fs.existsSync(filePath)) {
        console.log(`📄 Uploading ${filename}...`);
        
        const file = await openai.files.create({
          file: fs.createReadStream(filePath),
          purpose: "assistants"
        });
        
        uploadedFiles.push(file.id);
        console.log(`✅ Uploaded ${filename} - ID: ${file.id}`);
      } else {
        console.log(`⚠️  File not found: ${filePath}`);
      }
    }
    
    if (uploadedFiles.length > 0) {
      // Update assistant with knowledge files
      const assistant = await openai.beta.assistants.update(process.env.ASSISTANT_ID, {
        file_ids: uploadedFiles
      });
      
      console.log(`✅ Assistant updated with ${uploadedFiles.length} knowledge files`);
      console.log("📋 File IDs:", uploadedFiles);
    } else {
      console.log("ℹ️  No knowledge files found to upload");
      console.log("💡 Create PDF files in the 'knowledge' folder and run this script again");
    }
    
  } catch (error) {
    console.error("❌ Error uploading knowledge files:", error);
  }
}

// Run the upload
uploadKnowledgeFiles();
