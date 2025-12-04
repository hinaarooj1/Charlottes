const OpenAI = require("openai");
require("dotenv").config({ path: require('path').resolve(__dirname, '.env') });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Dynamic defaults so we don't hardcode any specific bot or company
const DEFAULT_ASSISTANT_NAME = process.env.ASSISTANT_NAME || "AI Assistant";
const DEFAULT_COMPANY_NAME = process.env.COMPANY_NAME || "Our Team";
const DEFAULT_WEBSITE = process.env.ASSISTANT_WEBSITE || process.env.COMPANY_WEBSITE || "";
const DEFAULT_CONTACT_PHONE = process.env.SUPPORT_PHONE || "";
const DEFAULT_CONTACT_EMAIL = process.env.SUPPORT_EMAIL || process.env.EMAIL_FROM || "";
const DEFAULT_CONTACT_ADDRESS = process.env.SUPPORT_ADDRESS || "";

// Basic fallback lists can be provided via env as comma‑separated strings
const DEFAULT_SERVICES = (process.env.ASSISTANT_SERVICES || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

const DEFAULT_GUIDELINES = (process.env.ASSISTANT_GUIDELINES || "")
  .split("|")
  .map(s => s.trim())
  .filter(Boolean);

// Cache for assistant configuration
let assistantConfigCache = null;
let cacheExpiry = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch assistant configuration from OpenAI API
 */
async function getAssistantConfig() {
  try {
    // Check cache first
    if (assistantConfigCache && Date.now() < cacheExpiry) {
      console.log("📋 Using cached assistant configuration");
      return assistantConfigCache;
    }

    console.log("🔍 Fetching assistant configuration from OpenAI...");
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Assistant config fetch timeout')), 10000);
    });
    
    const fetchPromise = openai.beta.assistants.retrieve(process.env.ASSISTANT_ID);
    const assistant = await Promise.race([fetchPromise, timeoutPromise]);
    
    // Parse the instructions to extract structured data
    const config = parseAssistantInstructions(assistant.instructions);
    
    // Cache the result
    assistantConfigCache = config;
    cacheExpiry = Date.now() + CACHE_DURATION;
    
    console.log("✅ Assistant configuration loaded and cached successfully");
    console.log("📋 Config details:", {
      name: config.name,
      services: config.services.length,
      contact: Object.keys(config.contact).length
    });
    
    return config;
  } catch (error) {
    console.error("❌ Error fetching assistant configuration:", error);
    console.log("🔄 Using fallback configuration");
    
    // Return fallback configuration if API fails
    return getFallbackConfig();
  }
}

/**
 * Parse assistant instructions to extract structured data
 */
function parseAssistantInstructions(instructions) {
  console.log("🔍 Parsing assistant instructions...");
  
  const config = {
    name: DEFAULT_ASSISTANT_NAME,
    website: DEFAULT_WEBSITE,
    services: [],
    contact: {},
    guidelines: []
  };

  try {
    // Extract contact information
    const contactMatch = instructions.match(/CONTACT INFORMATION:([\s\S]*?)(?=\n[A-Z]|$)/i);
    if (contactMatch) {
      const contactSection = contactMatch[1];
      const phoneMatch = contactSection.match(/- Phone: ([^\n]+)/i);
      const emailMatch = contactSection.match(/- Email: ([^\n]+)/i);
      const addressMatch = contactSection.match(/- Address: ([^\n]+)/i);
      const websiteMatch = contactSection.match(/- Website: ([^\n]+)/i);
      
      if (phoneMatch) config.contact.phone = phoneMatch[1].trim();
      if (emailMatch) config.contact.email = emailMatch[1].trim();
      if (addressMatch) config.contact.address = addressMatch[1].trim();
      if (websiteMatch) config.contact.website = websiteMatch[1].trim();
      
      console.log("📞 Extracted contact info:", Object.keys(config.contact));
    }

    // Extract services
    const servicesMatch = instructions.match(/SERVICES YOU PROVIDE:([\s\S]*?)(?=\n[A-Z]|$)/i);
    if (servicesMatch) {
      const servicesSection = servicesMatch[1];
      const serviceLines = servicesSection.split('\n').filter(line => line.trim().startsWith('-'));
      config.services = serviceLines.map(line => line.replace(/^-\s*/, '').trim());
      console.log("🛠️ Extracted services:", config.services.length);
    }

    // Extract guidelines
    const guidelinesMatch = instructions.match(/IMPORTANT INSTRUCTIONS:([\s\S]*?)(?=\n[A-Z]|$)/i);
    if (guidelinesMatch) {
      const guidelinesSection = guidelinesMatch[1];
      const guidelineLines = guidelinesSection.split('\n').filter(line => line.trim().startsWith('-'));
      config.guidelines = guidelineLines.map(line => line.replace(/^-\s*/, '').trim());
      console.log("📋 Extracted guidelines:", config.guidelines.length);
    }

    // Fallback to hardcoded values if parsing failed
    if (Object.keys(config.contact).length === 0) {
      console.log("⚠️ No contact info extracted, using dynamic fallback");
      config.contact = {
        phone: DEFAULT_CONTACT_PHONE,
        email: DEFAULT_CONTACT_EMAIL,
        address: DEFAULT_CONTACT_ADDRESS,
        website: DEFAULT_WEBSITE
      };
    }

    if (config.services.length === 0) {
      console.log("⚠️ No services extracted, using dynamic fallback list (if any)");
      config.services = DEFAULT_SERVICES;
    }

    if (config.guidelines.length === 0) {
      console.log("⚠️ No guidelines extracted, using dynamic fallback list (if any)");
      config.guidelines = DEFAULT_GUIDELINES;
    }

    console.log("✅ Assistant configuration parsed successfully");
    return config;
  } catch (error) {
    console.error("❌ Error parsing assistant instructions:", error);
    return getFallbackConfig();
  }
}

/**
 * Fallback configuration if API fails
 */
function getFallbackConfig() {
  return {
    name: DEFAULT_ASSISTANT_NAME,
    website: DEFAULT_WEBSITE,
    services: DEFAULT_SERVICES,
    contact: {
      phone: DEFAULT_CONTACT_PHONE,
      email: DEFAULT_CONTACT_EMAIL,
      address: DEFAULT_CONTACT_ADDRESS,
      website: DEFAULT_WEBSITE
    },
    guidelines: DEFAULT_GUIDELINES
  };
}

/**
 * Generate context message from assistant configuration
 */
function generateContextMessage(userMessage, config, conversationHistory = []) {
  const servicesList = config.services.map(service => `- ${service}`).join('\n');
  const guidelinesList = config.guidelines.map(guideline => `- ${guideline}`).join('\n');
  
  let contextMessage = `You are ${config.name} (${config.website}). 

SERVICES YOU PROVIDE:
${servicesList}

CONTACT INFORMATION:
- Phone: ${config.contact.phone}
- Email: ${config.contact.email}
- Address: ${config.contact.address}
- Website: ${config.contact.website}

IMPORTANT INSTRUCTIONS:
${guidelinesList}

CONVERSATION CONTEXT:
- You are having a conversation with a potential client
- Remember what has been discussed previously
- Do NOT ask for email address if it has already been provided
- Continue the conversation naturally based on previous messages
- If the user has already provided their email, acknowledge it and continue helping`;

  // Add conversation history if available
  if (conversationHistory && conversationHistory.length > 0) {
    contextMessage += `\n\nPREVIOUS CONVERSATION:\n`;
    conversationHistory.forEach((msg, index) => {
      const role = msg.isBot ? 'Assistant' : 'User';
      contextMessage += `${role}: ${msg.content}\n`;
    });
  }

  contextMessage += `\n\nCurrent user message: ${userMessage}`;
  
  return contextMessage;
}

/**
 * Generate email content with dynamic contact information
 */
function generateEmailContent(sessionData, config, sessionId = null) {
  const messages = sessionData.messages || [];
  const companyName =
    (config && config.name && config.name.split(' - ')[1]) ||
    DEFAULT_COMPANY_NAME;
  const assistantDisplayName =
    (config && config.name && config.name.split(' - ')[0]) ||
    DEFAULT_ASSISTANT_NAME;
  
  const textContent = `${companyName} - Chat Transcript
${sessionId ? `Session ID: ${sessionId}\n` : ''}Date: ${new Date().toLocaleString()}
Total Messages: ${messages.length}

Chat Transcript:
${messages.map(msg => {
    const sender = msg.isBot ? assistantDisplayName : 'You';
    const content = msg.content || '';
    // Preserve original user message content exactly as sent
    return `${sender}: ${content}`;
  }).join('\n')}`;

  const htmlContent = `<h2>${companyName} - Chat Transcript</h2>
<p>Thank you for chatting with ${companyName}!</p>
${sessionId ? `<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
  <p><strong>Session ID:</strong> ${sessionId}</p>
  <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
  <p><strong>Total Messages:</strong> ${messages.length}</p>
</div>` : ''}
<h3>Chat Transcript:</h3>
<div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
  ${messages.map(msg => {
    const sender = msg.isBot ? assistantDisplayName : 'You';
    const content = (msg.content || '').replace(/\n/g, '<br>');
    // Preserve original user message content exactly as sent
    return `
    <div style="margin-bottom: 10px;">
      <strong>${sender}:</strong> ${content}
    </div>
  `;
  }).join('')}
</div>`;

  return { textContent, htmlContent, subject: `${companyName} - Chat Transcript` };
}

module.exports = {
  getAssistantConfig,
  generateContextMessage,
  generateEmailContent,
  parseAssistantInstructions
};
