require("dotenv").config({ path: require('path').resolve(__dirname, '.env') });
const express = require("express");
const http = require("http");
const path = require("path");
const socketIo = require("socket.io");
const OpenAI = require("openai");
const nodemailer = require("nodemailer");
const sendEmail = require("./emailService");
const { insertMessageSchema } = require("./shared/schema.js");
const { storage } = require("./storage.js");
const database = require("./database.js");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Initialize Socket.IO with enhanced configuration
const io = socketIo(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "*",
    methods: ["GET", "POST"],
  },
  transports: ['polling', 'websocket'], // Polling first, then WebSocket
  allowUpgrades: true, // Allow upgrades from polling to WebSocket
  pingTimeout: 60000,
  pingInterval: 25000,
  upgradeTimeout: 10000,
  maxHttpBufferSize: 1e6, // 1MB
  allowEIO3: true, // Allow Engine.IO v3 clients
  allowEIO4: true, // Allow Engine.IO v4 clients
  serveClient: false, // Don't serve the client files
});

// Add error handling for Socket.IO server
io.engine.on("connection_error", (err) => {
  if (err.message === "Transport unknown") {
    console.warn("⚠️  Socket.IO transport unknown - this is usually a client version issue");
    console.warn("⚠️  Client is using:", err.context?.transport || "unknown transport");
    console.warn("⚠️  Server supports: polling, websocket");
  } else {
    console.error("🔌 Socket.IO connection error:", err.message);
    console.error("🔌 Error details:", err);
  }
});

// Add error handling for server errors
server.on('error', (err) => {
  console.error('🚨 Server error:', err);
});

// Add error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('🚨 Uncaught Exception:', err);
  // Don't exit the process, just log the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, just log the error
});

// Session management
const sessionThreads = new Map();
const processedSessions = new Set();
const activeSessions = new Map();
const sessionSockets = new Map();
const userConnections = new Map();

// Connection management
let connectionCount = 0;
const MAX_CONNECTIONS = 200;
const connectionRateLimit = new Map();

// Bot detection function
function isBot(userAgent) {
  if (!userAgent) return false;
  const botPatterns = [
    'bot', 'crawler', 'spider', 'crawling', 'scraper',
    'cron-job.org', 'Applebot', 'monitoring', 'health',
    'uptime', 'pingdom', 'status', 'check'
  ];
  const userAgentLower = userAgent.toLowerCase();
  return botPatterns.some(pattern => userAgentLower.includes(pattern));
}

// Get real client IP from headers (not proxy IP)
function getClientIP(socket) {
  return socket.handshake.headers['cf-connecting-ip'] ||
         socket.handshake.headers['true-client-ip'] ||
         (socket.handshake.headers['x-forwarded-for'] || '').split(',')[0].trim() ||
         socket.handshake.address;
}

function cleanResponse(response) {
  return response
    .replace(/【.*?】/g, "") // Remove unwanted characters
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") // Replace **bold** with <b> tags
    .replace(/###/g, "") // Remove ###
    .replace(/\n{2,}/g, "<br /><br />") // Preserve paragraph breaks
    .replace(/\n/g, "<br />") // Replace single newlines with <br />
    .trim();
}

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/themes', express.static('themes'));

// Routes
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Portugal Residency PRO Chatbot</title>
        <style>
            body { 
                font-family: Arial, sans-serif; 
                margin: 40px; 
                background-color: #f5f5f5;
                display: flex;
                flex-direction: column;
                align-items: center;
                min-height: 100vh;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                text-align: center;
                max-width: 600px;
            }
            h1 { color: #a60316; margin-bottom: 20px; }
            .status { 
                background: #d4edda; 
                color: #155724; 
                padding: 15px; 
                border-radius: 5px; 
                margin: 20px 0;
                border: 1px solid #c3e6cb;
            }
            .widget-demo {
                margin-top: 30px;
                padding: 20px;
                border: 2px dashed #a60316;
                border-radius: 10px;
                background: #fff5f5;
            }
            .integration-code {
                background: #f8f9fa;
                padding: 15px;
                border-radius: 5px;
                font-family: monospace;
                text-align: left;
                margin: 20px 0;
                border-left: 4px solid #a60316;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🇵🇹 Portugal Residency PRO Chatbot</h1>
            <div class="status">
                ✅ <strong>Server Status:</strong> Live and Running
            </div>
            <p>Welcome to Sofia, your AI assistant for Portugal Golden Visa services!</p>
            
            <div class="widget-demo">
                <h3>Chat Widget Demo</h3>
                <p>The chat widget will appear here:</p>
                <div id="portugal-residency-chatbot-widget"></div>
            </div>
            
            <div class="integration-code">
                <strong>Integration Code for your website:</strong><br><br>
                &lt;script defer src="https://charlottes.onrender.com/themes/w/widget.min.js"&gt;&lt;/script&gt;<br>
                &lt;div id="portugal-residency-chatbot-widget"&gt;&lt;/div&gt;<br>
                &lt;script&gt;<br>
                &nbsp;&nbsp;window.onload = () => {<br>
                &nbsp;&nbsp;&nbsp;&nbsp;widget = window.GreeterWidget("6347b4e595cf065c9388f4ab");<br>
                &nbsp;&nbsp;};<br>
                &lt;/script&gt;
            </div>
        </div>
        
        <!-- Load the widget -->
        <script defer src="/themes/w/widget.min.js"></script>
        <script>
            window.onload = () => {
                widget = window.GreeterWidget("6347b4e595cf065c9388f4ab");
            };
        </script>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: database.isConnected ? 'connected' : 'disconnected',
    connections: connectionCount,
    uptime: process.uptime()
  });
});

// Widget endpoint
app.get('/widget', (req, res) => {
  res.sendFile(path.join(__dirname, 'themes/w/widget.min.js'));
});

// Email validation function
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Extract user email from messages (check both user and bot messages)
function extractUserEmailFromMessages(messages) {
  for (const msg of messages) {
    if (msg.content) {
      const emailMatch = msg.content.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch && isValidEmail(emailMatch[0])) {
        return emailMatch[0];
      }
    }
  }
  return null;
}

// Function to send email with chat transcript
async function sendChatTranscriptEmail(sessionData) {
  console.log("📧 sendChatTranscriptEmail called with:", sessionData);
  
  const { sessionId, messages, timestamp, userAgent, referrer, url } = sessionData;
  
  // Extract user email from chat messages
  const userEmail = extractUserEmailFromMessages(messages);
  const recipientEmail = userEmail || process.env.EMAIL_TO || "Herringtonconsulting@gmail.com";
  
  console.log(`📧 Sending email to: ${recipientEmail} ${userEmail ? '(from chat)' : '(default)'}`);
  console.log(`📧 User email extracted: ${userEmail}`);
  console.log(`📧 Total messages to process: ${messages?.length || 0}`);

  const response = await fetch("https://api.ipify.org/?format=json");
  const data = await response.json();
  const ipAddress = data.ip;

  // Format chat transcript
  let formattedMessages = messages.map((msg) => {
    const date = new Date(msg.timestamp).toLocaleString();
    const role = msg.isBot ? "Assistant" : "User";
    return `${date} - ${role}:\n${msg.content}\n`;
  });

  // Add session metadata
  const metadata = `
Session ID: ${sessionId}
Started: ${new Date(messages[0].timestamp).toLocaleString()}
Ended: ${new Date(timestamp).toLocaleString()}
URL: ${url || "N/A"}
Referrer: ${referrer || "N/A"}
User Agent: ${userAgent || "N/A"}
`;

  const detailsResponse = await fetch(`http://ip-api.com/json/${ipAddress}`);
  const ipData = await detailsResponse.json();
  console.log("🚀 ~ sendChatTranscriptEmail ~ ipData:", ipData);

  // Email options
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: recipientEmail,
    subject: `Chat Transcript - Session ${sessionId.substring(0, 8)}`,
    text: `Chat Transcript\n\n${metadata}\n\n${formattedMessages}`,
    html: `
      <h2>Chat Transcript</h2>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p><strong>Session ID:</strong> ${sessionId}</p>
        <p><strong>Started:</strong> ${new Date(messages[0].timestamp).toLocaleString()}</p>
        <p><strong>Ended:</strong> ${new Date(timestamp).toLocaleString()}</p>
        <p><strong>URL:</strong> ${url || "N/A"}</p>
        <p><strong>Referrer:</strong> ${referrer || "N/A"}</p>
        <p><strong>User Agent:</strong> ${userAgent || "N/A"}</p>
        <p><strong>IP Address:</strong> ${ipAddress || "N/A"}</p>
        <p><strong>lon:</strong> ${ipData.lon || "N/A"}</p>
        <p><strong>Country:</strong> ${ipData.country || "N/A"}</p>
        <p><strong>timezone:</strong> ${ipData.timezone || "N/A"}</p>
        <p><strong>lat:</strong> ${ipData.lat || "N/A"}</p>
      </div>
      <div style="line-height: 1.6;">
        ${messages
        .map((msg) => {
          const date = new Date(msg.timestamp).toLocaleString();
          const role = msg.isBot ? "Assistant" : "User";
          const bgColor = msg.isBot ? "#f0f0f0" : "#FFBB8E";
          const align = msg.isBot ? "left" : "right";
          return `
            <div style="margin-bottom: 15px; text-align: ${align};">
              <small style="color: #666;">${date} - ${role}</small>
              <div style="background-color: ${bgColor}; padding: 10px; border-radius: 8px; display: inline-block; max-width: 80%; text-align: left;">
                ${msg.content.replace(/\n/g, "<br>")}
              </div>
            </div>
          `;
        })
        .join("")}
      </div>
    `,
  };
  
  try {
    console.log("mailOptions :>> ", mailOptions);

    // Use the advanced email service with multiple fallbacks
    const result = await sendEmail(
      recipientEmail,
      mailOptions.subject,
      mailOptions.text,
      mailOptions.html
    );

    console.log("✅ Email sent successfully:", result);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return false;
  }
}

// Socket.IO connection handling
io.on("connection", async (socket) => {
  const clientIP = getClientIP(socket);
  const userAgent = socket.handshake.headers['user-agent'];
  const referrer = socket.handshake.headers.referer || socket.handshake.headers.referrer;
  const origin = socket.handshake.headers.origin;
  
  console.log("🔌 New connection attempt - Socket ID:", socket.id);
  console.log("🔌 Real Client IP:", clientIP);
  console.log("🔌 User Agent:", userAgent);
  console.log("🔌 Referrer:", referrer);
  console.log("🔌 Origin:", origin);
  
  // Bot detection and blocking
  if (isBot(userAgent)) {
    console.log("🤖 Bot detected, blocking connection:", userAgent);
    socket.disconnect();
    return;
  }
  
  // Check connection limit BEFORE incrementing
  if (connectionCount >= MAX_CONNECTIONS) {
    console.log("🚨 Too many connections, disconnecting:", socket.id, "- Current count:", connectionCount);
    socket.disconnect();
    return;
  }
  
  // Check for duplicate connections from same IP
  if (!userConnections.has(clientIP)) {
    userConnections.set(clientIP, new Set());
  }
  
  const existingConnections = userConnections.get(clientIP);
  if (existingConnections.size >= 50) {
    console.log("🚨 Too many connections from same IP, disconnecting:", socket.id, "- IP:", clientIP, "- Existing:", existingConnections.size);
    socket.disconnect();
    return;
  }
  
  // Add this connection to the user's connections
  existingConnections.add(socket.id);
  
  // Only increment after all validations pass
  connectionCount++;
  
  console.log("🔌 New WebSocket connection established - Socket ID:", socket.id);
  console.log("🔌 Total active connections:", io.engine.clientsCount);
  console.log("🔌 Connection count:", connectionCount);
  
  let currentSessionId = null;
  let messageCount = 0;
  const connectionStartTime = Date.now();

  // Handle session restoration
  socket.on("restoreSession", async (data) => {
    try {
      console.log("🔄 Session restoration requested:", data);
      const { sessionId } = data;
      
      if (sessionId) {
        // Get session from in-memory storage first
        let session = activeSessions.get(sessionId);
        
        if (session) {
          console.log("📱 Restoring session from memory:", sessionId);
          console.log("📜 Found", session.messages.length, "messages for session:", sessionId);
        } else {
          // Try to restore from storage
          console.log("🔍 Session not in memory, checking storage:", sessionId);
          try {
            const storedMessages = await storage.getMessagesBySession(sessionId);
            console.log("🔍 Messages found:", storedMessages ? storedMessages.length : 0);
            
            if (storedMessages && storedMessages.length > 0) {
              console.log("📱 Restoring session from storage:", sessionId);
              console.log("📜 Found", storedMessages.length, "messages in storage for session:", sessionId);
              
              // Store in memory for future use
              activeSessions.set(sessionId, {
                sessionId: sessionId,
                messages: storedMessages,
                timestamp: Date.now(),
                socketId: socket.id,
                messageCount: storedMessages.length
              });
              
              session = activeSessions.get(sessionId);
            } else {
              console.log("❌ No messages found in storage for session:", sessionId);
            }
          } catch (storageError) {
            console.error("❌ Storage error during session restoration:", storageError);
          }
        }
        
        if (session) {
          // Send session data to client
          socket.emit("sessionRestored", {
            sessionId: sessionId,
            messages: session.messages,
            sessionData: session
          });
          
          // Restore OpenAI thread context if it exists
          if (session.threadId && !sessionThreads.has(sessionId)) {
            sessionThreads.set(sessionId, session.threadId);
            console.log(`🧵 Restored OpenAI thread for session: ${sessionId} -> ${session.threadId}`);
          }
          
          // Track socket for this session
          if (!sessionSockets.has(sessionId)) {
            sessionSockets.set(sessionId, new Set());
          }
          sessionSockets.get(sessionId).add(socket.id);
          console.log(`📱 Session ${sessionId} restored with ${sessionSockets.get(sessionId).size} connection(s)`);
        } else {
          console.log("❌ Session not found in memory or database:", sessionId);
          socket.emit("sessionNotFound", { sessionId });
        }
      } else {
        console.log("❌ No session ID provided");
        socket.emit("sessionNotFound", { sessionId: null });
      }
    } catch (error) {
      console.error("❌ Error restoring session:", error);
      socket.emit("sessionError", { error: error.message });
    }
  });

  // Handle clear chat
  socket.on("clearChat", async (data) => {
    try {
      console.log("🗑️ Clear chat requested:", data);
      const { sessionId } = data;
      
      if (sessionId) {
        // Clear in-memory cache
        if (activeSessions.has(sessionId)) {
          activeSessions.get(sessionId).messages = [];
          activeSessions.get(sessionId).messageCount = 0;
          activeSessions.get(sessionId).timestamp = Date.now();
        }
        
        // Clear session threads
        if (sessionThreads.has(sessionId)) {
          sessionThreads.delete(sessionId);
          console.log("🗑️ Cleared thread for session:", sessionId);
        }
        
        console.log("✅ Chat cleared for session:", sessionId);
        socket.emit("chatCleared", { sessionId: sessionId });
      }
    } catch (error) {
      console.error("❌ Error clearing chat:", error);
      socket.emit("clearChatError", { error: error.message });
    }
  });

  // Handle email sending
  socket.on("sendEmail", async (data) => {
    try {
      console.log("📧 Email sending requested:", data);
      const { sessionId, email } = data;
      
      if (sessionId && email) {
        const sessionData = activeSessions.get(sessionId);
        
        if (sessionData && sessionData.messages && sessionData.messages.length > 0) {
          // Send email with chat transcript
          const emailSent = await sendChatTranscriptEmail({
            sessionId: sessionId,
            messages: sessionData.messages,
            userEmail: email,
            userIP: clientIP,
            userAgent: socket.handshake.headers['user-agent'],
            referrer: socket.handshake.headers.referer || socket.handshake.headers.referrer,
            url: socket.handshake.headers.origin
          });
          
          console.log("📧 Email sent:", emailSent ? "✅ Success" : "❌ Failed");
          socket.emit("emailSent", { 
            success: emailSent, 
            email: email,
            message: emailSent ? "Email sent successfully!" : "Failed to send email. Please try again."
          });
        } else {
          console.log("❌ No messages found for session:", sessionId);
          socket.emit("emailError", { 
            success: false, 
            message: "No messages found to send." 
          });
        }
      } else {
        console.log("❌ Missing session ID or email");
        socket.emit("emailError", { 
          success: false, 
          message: "Session ID and email are required." 
        });
      }
    } catch (error) {
      console.error("❌ Error sending email:", error);
      socket.emit("emailError", { 
        success: false, 
        message: "Error sending email: " + error.message 
      });
    }
  });

  socket.on("message", async (data) => {
    try {
      console.log("💬 Received message:", data.toString());
      const message = JSON.parse(data.toString());
      const validatedMessage = insertMessageSchema.parse(message);

      // Track current session for this socket
      currentSessionId = validatedMessage.sessionId;
      messageCount++;
      
      // Track session sockets for multi-tab support
      if (!sessionSockets.has(currentSessionId)) {
        sessionSockets.set(currentSessionId, new Set());
      }
      sessionSockets.get(currentSessionId).add(socket.id);
      console.log(`📱 Session ${currentSessionId} now has ${sessionSockets.get(currentSessionId).size} tab(s)`);
      
      // Update active session data
      if (!activeSessions.has(currentSessionId)) {
        // Create initial bot greeting message for new sessions
        const initialGreeting = {
          id: Date.now(),
          content: "Hello! I'm Sofia from Portugal Residency PRO. Welcome! I'm here to help you secure EU residency through Portugal's Golden Visa program. We offer expert guidance on real estate investment (€500,000+), investment funds, capital transfer (€1,000,000+), and job creation (€350,000+) pathways. How can I assist you with your Golden Visa journey today?",
          isBot: "true",
          sessionId: currentSessionId,
          timestamp: new Date()
        };
        
        // Store the initial greeting in storage
        await storage.createMessage(initialGreeting);
        
        activeSessions.set(currentSessionId, {
          sessionId: currentSessionId,
          messages: [initialGreeting],
          timestamp: Date.now(),
          socketId: socket.id,
          messageCount: 1
        });
        
        console.log("📝 Created new session with initial greeting:", currentSessionId);
        
        // Send initial greeting to client
        console.log("📤 Sending initial greeting to client:", initialGreeting.content);
        socket.send(JSON.stringify({
          type: "message",
          message: {
            content: initialGreeting.content,
            isBot: true,
            timestamp: initialGreeting.timestamp.getTime()
          }
        }));
      }

      // Store user message
      const savedUserMessage = await storage.createMessage(validatedMessage);
      
      // Add to active session
      const sessionData = activeSessions.get(currentSessionId);
      sessionData.messages.push(savedUserMessage);
      sessionData.timestamp = Date.now();
      sessionData.messageCount = messageCount;

      // Send typing indicator
      socket.send(JSON.stringify({ type: "typing", isTyping: true }));

      // Add timeout to prevent hanging
      const apiTimeout = setTimeout(() => {
        console.error("⏰ OpenAI API call timed out after 30 seconds");
        socket.send(JSON.stringify({ type: "typing", isTyping: false }));
        socket.send(JSON.stringify({ 
          type: "message", 
          message: { 
            content: "I apologize, but I'm taking too long to respond. Please try again.", 
            isBot: true, 
            timestamp: Date.now() 
          } 
        }));
      }, 30000);

      try {
        console.log("🤖 Starting OpenAI API call for session:", currentSessionId);
        console.log("🔑 Assistant ID:", process.env.ASSISTANT_ID);
        console.log("🔑 OpenAI API Key:", process.env.OPENAI_API_KEY ? "Set" : "Not set");
        
        // Get or create thread for this session
        let threadId = sessionThreads.get(validatedMessage.sessionId);
        if (!threadId) {
          console.log("🧵 Creating new thread for session:", currentSessionId);
          const thread = await openai.beta.threads.create();
          threadId = thread.id;
          sessionThreads.set(validatedMessage.sessionId, threadId);
          console.log("🧵 Created thread:", threadId);
          
          // Store thread ID in database
          if (database.isConnected) {
            try {
              await database.updateSession(currentSessionId, { threadId: threadId });
              console.log(`🧵 Stored thread ID in database: ${threadId}`);
            } catch (error) {
              console.error("Error storing thread ID:", error);
            }
          }
        } else {
          console.log("🧵 Using existing thread:", threadId);
        }

        // Add the user's message to the thread with Portugal Residency PRO context
        console.log("📝 Adding user message to thread:", threadId);
        await openai.beta.threads.messages.create(threadId, {
          role: "user",
          content: `Context: You are Sofia from Portugal Residency PRO (https://portugalresidency.pro/). 

SERVICES YOU PROVIDE:
- Portugal Golden Visa Program guidance
- Real Estate Investment (€500,000+)
- Investment Fund options (€500,000+)
- Capital Transfer (€1,000,000+)
- Job Creation (€350,000+)
- Crypto-based investment structures
- Eligibility assessment
- Legal documentation preparation
- SEF application submission

CONTACT INFORMATION:
- Phone: (234) 109-6666
- Email: Herringtonconsulting@gmail.com
- Address: 2220 Plymouth Rd #302, Hopkins, Minnesota(MN), 55305
- Website: https://portugalresidency.pro/

IMPORTANT INSTRUCTIONS:
- Always focus on Portugal Golden Visa services, EU residency through investment, and Portuguese citizenship pathways
- Do NOT mention crypto trading, fintcx, or any financial trading services
- Only discuss regulated investment options for residency purposes
- When users provide their email address, simply acknowledge it and continue the conversation
- DO NOT automatically send chat transcripts or mention sending emails
- The system will handle email sending automatically when the session ends
- Just thank them for providing their email and continue helping with their questions

User message: ${validatedMessage.content}`,
        });
        console.log("✅ User message added to thread successfully");
        
        // Run the Assistant
        console.log("🚀 Creating OpenAI run for thread:", threadId, "with assistant:", process.env.ASSISTANT_ID);
        const run = await openai.beta.threads.runs.create(threadId, {
          assistant_id: process.env.ASSISTANT_ID,
        });
        console.log("✅ Run created successfully:", run.id);

        // Poll the run status until it completes
        let runStatus;
        console.log("🔄 Polling run status for thread:", threadId);
        do {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
          console.log("🔄 Run status:", runStatus.status);
          if (runStatus.status === "failed") {
            console.error("❌ Run failed:", runStatus.last_error);
            
            // Handle rate limit specifically
            if (runStatus.last_error?.code === 'rate_limit_exceeded') {
              console.error("🚨 OpenAI rate limit exceeded - check billing and quota");
              throw new Error("OpenAI rate limit exceeded. Please check your OpenAI billing and quota.");
            }
            
            throw new Error("Run failed: " + (runStatus.last_error?.message || "Unknown error"));
          }
        } while (runStatus.status !== "completed");
        console.log("✅ Run completed successfully");

        // Retrieve the latest assistant message
        console.log("📥 Retrieving messages from thread:", threadId);
        const messages = await openai.beta.threads.messages.list(threadId);
        console.log("📥 Retrieved", messages.data.length, "messages");
        
        const responseMessage = messages.data.find((msg) => msg.role === "assistant");
        console.log("🤖 Found assistant message:", !!responseMessage);

        let botResponse = "I apologize, but I'm having trouble processing your request at the moment.";

        if (responseMessage && responseMessage.content.length > 0) {
          const firstContent = responseMessage.content[0];
          if ("text" in firstContent) {
            botResponse = cleanResponse(firstContent.text.value);
            console.log("🤖 Bot response generated:", botResponse.substring(0, 100) + "...");
          } else {
            console.log("⚠️ Assistant message content is not text:", firstContent);
          }
        } else {
          console.log("⚠️ No assistant message found or empty content");
        }

        // Store and send bot response
        const botMessage = await storage.createMessage({
          content: botResponse,
          isBot: "true",
          sessionId: validatedMessage.sessionId,
        });
        console.log(botMessage);
        
        // Add bot message to active session
        const sessionData = activeSessions.get(currentSessionId);
        if (sessionData) {
          sessionData.messages.push(botMessage);
          sessionData.timestamp = Date.now();
        }

        // Send typing end and message
        socket.send(JSON.stringify({ type: "typing", isTyping: false }));
        
        // Clear the timeout since we got a response
        clearTimeout(apiTimeout);
        
        // Send response to current socket
        const responseData = { type: "message", message: botMessage };
        socket.send(JSON.stringify(responseData));
        console.log(`📤 Sending response to client:`, JSON.stringify(responseData));
      } catch (error) {
        console.error("❌ OpenAI API error:", error);
        console.error("❌ Error details:", error.message);
        console.error("❌ Error stack:", error.stack);
        
        // Clear the timeout since we got an error
        clearTimeout(apiTimeout);
        
        // Handle rate limit errors specifically
        let errorMessage = "I apologize, but I'm having trouble processing your request at the moment.";
        
        if (error.message.includes("rate limit exceeded")) {
          errorMessage = "I'm currently experiencing high demand. Please try again in a few minutes, or contact us directly at Herringtonconsulting@gmail.com or (234) 109-6666 for immediate assistance.";
        }
        
        socket.send(JSON.stringify({ type: "typing", isTyping: false }));
        socket.send(
          JSON.stringify({
            type: "message",
            message: await storage.createMessage({
              content: errorMessage,
              isBot: "true",
              sessionId: validatedMessage.sessionId,
            }),
          })
        );
      }
    } catch (error) {
      console.error("Error processing message:", error);
      socket.send(
        JSON.stringify({
          error: "Failed to process message",
        })
      );
    }
  });

  // Handle session end and email transcript
  socket.on("endSession", async (data) => {
    try {
      const sessionData = JSON.parse(data.toString());
      
      // Check if this session has already been processed
      if (processedSessions.has(sessionData.sessionId)) {
        console.log("📧 Session already processed, skipping duplicate email:", sessionData.sessionId);
        socket.emit("sessionEnded", { success: true, message: "Session already processed" });
        return;
      }
      
      // Mark session as processed
      processedSessions.add(sessionData.sessionId);
      
      console.log("📧 Session ended - processing email:", sessionData.sessionId);
      console.log("📧 Messages count:", sessionData.messages?.length || 0);

      // Extract user email from messages
      const userEmail = extractUserEmailFromMessages(sessionData.messages || []);

      // Skip email if no user email provided
      if (!userEmail) {
        console.log("⏭️ Skipping email - no email address provided by user");
        socket.emit("sessionEnded", { success: true, message: "Session ended" });
        activeSessions.delete(sessionData.sessionId);
        return;
      }

      console.log("📧 Sending transcript to user email:", userEmail);

      // Send email with chat transcript
      const emailSent = await sendChatTranscriptEmail(sessionData);
      console.log("📧 Email sending result:", emailSent);

      // Clean up the OpenAI thread if it exists
      const threadId = sessionThreads.get(sessionData.sessionId);
      if (threadId) {
        try {
          console.log(`Thread ${threadId} for session ${sessionData.sessionId} will be cleaned up`);
          sessionThreads.delete(sessionData.sessionId);
        } catch (error) {
          console.error("Error cleaning up thread:", error);
        }
      }
      
      // Clean up active session
      activeSessions.delete(sessionData.sessionId);

      // Acknowledge receipt
      socket.send(
        JSON.stringify({
          type: "sessionEnd",
          status: "success",
          emailSent,
        })
      );
    } catch (error) {
      console.error("Error processing session end:", error);
      socket.send(
        JSON.stringify({
          type: "sessionEnd",
          status: "error",
          message: "Failed to process session end",
        })
      );
    }
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });

  // Handle socket disconnect - Only send email for meaningful conversations
  socket.on("disconnect", async (reason) => {
    connectionCount--;
    const connectionDuration = Date.now() - connectionStartTime;
    
    console.log("🔌 WebSocket connection closed - Socket ID:", socket.id);
    console.log("🔌 Disconnect reason:", reason);
    console.log("🔌 Connection duration:", Math.round(connectionDuration / 1000), "seconds");
    console.log("🔌 Remaining active connections:", io.engine.clientsCount);
    console.log("🔌 Connection count:", connectionCount);
    
    // Remove from session sockets
    if (currentSessionId && sessionSockets.has(currentSessionId)) {
      sessionSockets.get(currentSessionId).delete(socket.id);
      const remainingSockets = sessionSockets.get(currentSessionId).size;
      
      if (remainingSockets === 0) {
        sessionSockets.delete(currentSessionId);
        console.log(`🔒 All tabs closed for session ${currentSessionId}`);
      } else {
        console.log(`📱 Session ${currentSessionId} still has ${remainingSockets} tab(s) open`);
      }
    }
    
    // Remove from user connections tracking
    if (userConnections.has(clientIP)) {
      userConnections.get(clientIP).delete(socket.id);
      if (userConnections.get(clientIP).size === 0) {
        userConnections.delete(clientIP);
        console.log(`🔒 All connections closed for IP: ${clientIP}`);
      } else {
        console.log(`📱 IP ${clientIP} still has ${userConnections.get(clientIP).size} connection(s) open`);
      }
    }
    
    // Only process disconnect if we have a meaningful session
    if (currentSessionId && messageCount >= 2) {
      const sessionData = activeSessions.get(currentSessionId);
      
      if (sessionData && !processedSessions.has(currentSessionId)) {
        console.log("📧 Socket disconnected - Sending email for session:", currentSessionId);
        console.log("📧 Messages in session:", sessionData.messages?.length || 0);
        console.log("📧 Message count:", messageCount);
        
        // Check if session has meaningful conversation (at least 2 messages)
        // AND has user messages (not just bot messages)
        const hasUserMessages = sessionData.messages.some(msg => !msg.isBot);
        if (sessionData.messages && sessionData.messages.length >= 2 && hasUserMessages) {
          try {
            // Mark as processed to prevent duplicates
            processedSessions.add(currentSessionId);
            
            // Add metadata if available
            sessionData.userAgent = socket.handshake.headers['user-agent'];
            sessionData.referrer = socket.handshake.headers.referer || socket.handshake.headers.referrer;
            sessionData.url = socket.handshake.headers.origin;
            
            // Send email with chat transcript
            const emailSent = await sendChatTranscriptEmail(sessionData);
            console.log("📧 Email sent on disconnect:", emailSent ? "✅ Success" : "❌ Failed");
            
            // Clean up
            activeSessions.delete(currentSessionId);
            
            const threadId = sessionThreads.get(currentSessionId);
            if (threadId) {
              sessionThreads.delete(currentSessionId);
              console.log(`🧹 Cleaned up thread ${threadId} for session ${currentSessionId}`);
            }
          } catch (error) {
            console.error("❌ Error sending email on disconnect:", error);
          }
        } else {
          console.log("⏭️ Skipping email - session too short (< 2 messages) or no user messages");
          activeSessions.delete(currentSessionId);
        }
      } else if (processedSessions.has(currentSessionId)) {
        console.log("✅ Session already processed, email already sent");
      }
    } else {
      console.log("⏭️ Skipping email - no meaningful session or too few messages");
      if (currentSessionId) {
        activeSessions.delete(currentSessionId);
      }
    }
  });
});

// Cleanup function to prevent memory leaks
setInterval(() => {
  // Clean up old sessions (older than 1 hour)
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [sessionId, sessionData] of activeSessions.entries()) {
    if (sessionData.timestamp < oneHourAgo) {
      console.log(`🧹 Cleaning up old session: ${sessionId}`);
      activeSessions.delete(sessionId);
      sessionThreads.delete(sessionId);
    }
  }
  
  // Clean up processed sessions
  if (processedSessions.size > 500) {
    processedSessions.clear();
    console.log("🧹 Cleared processed sessions cache");
  }
  
  // Clean up rate limiting cache
  const rateLimitCleanup = Date.now() - (10 * 60 * 1000);
  for (const [ip, timestamp] of connectionRateLimit.entries()) {
    if (timestamp < rateLimitCleanup) {
      connectionRateLimit.delete(ip);
    }
  }
  
  // Clean up stale user connections
  for (const [ip, connections] of userConnections.entries()) {
    const activeConnections = new Set();
    for (const socketId of connections) {
      if (io.sockets.sockets.has(socketId)) {
        activeConnections.add(socketId);
      }
    }
    if (activeConnections.size === 0) {
      userConnections.delete(ip);
      console.log(`🧹 Cleaned up stale connections for IP: ${ip}`);
    } else if (activeConnections.size < connections.size) {
      userConnections.set(ip, activeConnections);
      console.log(`🧹 Cleaned up ${connections.size - activeConnections.size} stale connections for IP: ${ip}`);
    }
  }
  
  // Log current connection stats
  console.log("📊 Connection stats - Active:", connectionCount, "Processed sessions:", processedSessions.size, "Rate limit entries:", connectionRateLimit.size);
}, 2 * 60 * 1000);

// Configure email transporter
const transporter = nodemailer.createTransporter({
  host:process.env.HOST,
  port: process.env.PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Validate email configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error("Email configuration error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

// Startup check for EMAIL_TO
if (!process.env.EMAIL_TO) {
  console.warn("⚠️  EMAIL_TO not set, using default: Herringtonconsulting@gmail.com");
  process.env.EMAIL_TO = "Herringtonconsulting@gmail.com";
}

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Portugal Residency PRO Chatbot running on http://0.0.0.0:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 Assistant ID: ${process.env.ASSISTANT_ID}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Initialize MongoDB
async function initializeDatabase() {
  try {
    const connected = await database.connect();
    if (connected) {
      console.log("✅ Database initialized successfully");
    } else {
      console.warn("⚠️  Database connection failed, falling back to in-memory storage");
    }
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
  }
}

// Initialize database
initializeDatabase();

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  await database.disconnect();
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});
