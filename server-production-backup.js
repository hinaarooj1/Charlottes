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
const { getAssistantConfig, generateContextMessage, generateEmailContent } = require("./assistant-config.js");

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

// Add middleware to handle transport issues
io.engine.on("connection", (socket) => {
  socket.on("error", (err) => {
    if (err.message === "Transport unknown") {
      console.warn("⚠️  Client transport error:", err.message);
    } else {
      console.error("🔌 Socket error:", err);
    }
  });
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

// Session management (now using MongoDB)
const sessionThreads = new Map(); // Keep for OpenAI thread management
const processedSessions = new Set(); // Keep for preventing duplicate emails
const activeSessions = new Map(); // In-memory cache for active session data
const sessionSockets = new Map(); // sessionId -> Set of socket IDs for multi-tab support
const userConnections = new Map(); // Track connections per user to prevent duplicates

// Email validation function
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length > 5 && email.length < 254;
}

// Session management for automatic transcript sending
const sessionTimeouts = new Map(); // Track session timeouts
const sessionEmails = new Map(); // Track user emails per session
const EXPIRED_SESSION_TIMEOUT = 10 * 60 * 1000; // 10 minutes in milliseconds

// Function to send transcript and cleanup session
async function sendTranscriptAndCleanup(sessionId) {
  try {
    console.log(`📧 Processing expired session: ${sessionId}`);
    
    // Get session data
    let sessionData = null;
    let messages = [];
    
    // Try database first
    if (database.isConnected) {
      try {
        sessionData = await database.getSession(sessionId);
        if (sessionData) {
          messages = await database.getMessagesBySession(sessionId);
        }
      } catch (error) {
        console.warn("⚠️ Database lookup failed for cleanup:", error.message);
      }
    }
    
    // Fallback to in-memory
    if (!sessionData) {
      sessionData = activeSessions.get(sessionId);
      if (sessionData) {
        messages = sessionData.messages || [];
      }
    }
    
    // Check if we have a valid email and meaningful conversation
    const userEmail = sessionEmails.get(sessionId);
    if (!userEmail || !isValidEmail(userEmail)) {
      console.log(`📧 No valid email for session ${sessionId}, skipping transcript`);
      return;
    }
    
    if (!messages || messages.length < 2) {
      console.log(`📧 Session ${sessionId} has insufficient messages, skipping transcript`);
      return;
    }
    
    // Check if session was already processed
    if (processedSessions.has(sessionId)) {
      console.log(`📧 Session ${sessionId} already processed, skipping`);
      return;
    }
    
    // Mark as processed
    processedSessions.add(sessionId);
    
    // Generate email content
    let emailContent;
    try {
      const assistantConfig = await getAssistantConfig();
      emailContent = generateEmailContent(sessionData, assistantConfig, sessionId);
    } catch (error) {
      console.error("❌ Error generating email content:", error);
      return;
    }
    
    // Send email
    console.log(`📧 Sending transcript to: ${userEmail}`);
    const emailSent = await sendEmail(
      userEmail,
      emailContent.subject,
      emailContent.textContent,
      emailContent.htmlContent
    );
    
    if (emailSent.success) {
      console.log(`✅ Transcript sent successfully to: ${userEmail}`);
      
      // Update session in database to mark as processed
      if (database.isConnected) {
        try {
          await database.updateSession(sessionId, { 
            transcriptSent: true,
            transcriptSentAt: new Date(),
            userEmail: userEmail
          });
        } catch (error) {
          console.warn("⚠️ Could not update session in database:", error.message);
        }
      }
    } else {
      console.error(`❌ Failed to send transcript to: ${userEmail}`, emailSent.error);
    }
    
  } catch (error) {
    console.error(`❌ Error in sendTranscriptAndCleanup for session ${sessionId}:`, error);
  } finally {
    // Cleanup session data
    cleanupSession(sessionId);
  }
}

// Function to cleanup session data
function cleanupSession(sessionId) {
  console.log(`🧹 Cleaning up session: ${sessionId}`);
  
  // Clear timeout
  if (sessionTimeouts.has(sessionId)) {
    clearTimeout(sessionTimeouts.get(sessionId));
    sessionTimeouts.delete(sessionId);
  }
  
  // Remove from memory
  activeSessions.delete(sessionId);
  sessionSockets.delete(sessionId);
  sessionEmails.delete(sessionId);
  sessionThreads.delete(sessionId);
  
  // Remove from database (optional - you might want to keep for analytics)
  if (database.isConnected) {
    try {
      // Mark session as inactive instead of deleting
      database.updateSession(sessionId, { isActive: false }).catch(err => {
        console.warn("⚠️ Could not mark session as inactive:", err.message);
      });
    } catch (error) {
      console.warn("⚠️ Database cleanup error:", error.message);
    }
  }
  
  console.log(`✅ Session ${sessionId} cleaned up successfully`);
}

// Function to reset session timeout
function resetSessionTimeout(sessionId) {
  // Clear existing timeout
  if (sessionTimeouts.has(sessionId)) {
    clearTimeout(sessionTimeouts.get(sessionId));
  }
  
  // Set new timeout
  const timeoutId = setTimeout(() => {
    sendTranscriptAndCleanup(sessionId);
  }, EXPIRED_SESSION_TIMEOUT);
  
  sessionTimeouts.set(sessionId, timeoutId);
  console.log(`⏰ Reset timeout for session: ${sessionId} (${EXPIRED_SESSION_TIMEOUT / 1000}s)`);
}

// Connection management
let connectionCount = 0;
const MAX_CONNECTIONS = 200; // Increased since bots are now excluded
const connectionRateLimit = new Map(); // Track connection rate per IP

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
            <p>Welcome to our AI assistant for Portugal Golden Visa services!</p>
            
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
                &nbsp;&nbsp;&nbsp;&nbsp;widget = window.GreeterWidget("YOUR_WIDGET_ID");<br>
                &nbsp;&nbsp;};<br>
                &lt;/script&gt;
            </div>
        </div>
        
        <!-- Load the widget -->
        <script defer src="/themes/w/widget.min.js"></script>
        <script>
            window.onload = () => {
                widget = window.GreeterWidget("YOUR_WIDGET_ID");
            };
        </script>
    </body>
    </html>
  `);
});

// Helper: Resolve a session and messages with robust fallbacks (DB → memory → storage → minimal)
async function resolveSessionAndMessages(sessionId) {
  try {
    let session = null;
    let messages = [];

    // Try database first (even if not marked connected)
    try {
      session = await database.getSession(sessionId);
      if (session) {
        try {
          messages = await database.getMessagesBySession(sessionId);
        } catch (msgErr) {
          console.warn("⚠️ Could not load messages from database for session, continuing with session object:", msgErr.message);
          messages = session.messages || [];
        }
      }
    } catch (dbErr) {
      console.warn("⚠️ Database lookup failed during resolveSessionAndMessages:", dbErr.message);
    }

    // In-memory fallback
    if (!session) {
      const inMemorySession = activeSessions.get(sessionId);
      if (inMemorySession) {
        session = inMemorySession;
        messages = inMemorySession.messages || [];
      }
    }

    // Storage fallback
    if (!session) {
      try {
        const storageMessages = await storage.getMessagesBySession(sessionId);
        if (storageMessages && storageMessages.length > 0) {
          session = { sessionId, messages: storageMessages };
          messages = storageMessages;
        }
      } catch (storageErr) {
        console.warn("⚠️ Storage fallback error:", storageErr.message);
      }
    }

    // Minimal fallback to avoid client hang
    if (!session) {
      session = {
        sessionId,
        messages: [],
        messageCount: 0,
        createdAt: new Date(),
        lastActivity: new Date()
      };
      messages = [];
    }

    return { session, messages };
  } catch (err) {
    console.error("❌ resolveSessionAndMessages error:", err);
    return {
      session: {
        sessionId,
        messages: [],
        messageCount: 0,
        createdAt: new Date(),
        lastActivity: new Date()
      },
      messages: []
    };
  }
}

// REST fallback: session + messages
app.get('/api/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ success: false, error: 'Missing sessionId' });
    }
    const { session, messages } = await resolveSessionAndMessages(sessionId);
    return res.json({ success: true, session, messages });
  } catch (error) {
    console.error('Error in /api/session/:sessionId:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
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

// Session history endpoint
app.get('/api/session/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const messages = await database.getMessagesBySession(sessionId);
    res.json({ success: true, messages, count: messages.length });
  } catch (error) {
    console.error("Error fetching session messages:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Enhanced transcript endpoint
app.get('/api/session/:sessionId/transcript', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const transcript = await database.generateTranscript(sessionId);
    res.json({ success: true, transcript });
  } catch (error) {
    console.error("Error generating transcript:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Download transcript as text file
app.get('/api/session/:sessionId/transcript/download', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const transcript = await database.generateTranscript(sessionId);
    
    // Get assistant configuration for transcript
    let textTranscript;
    try {
      const assistantConfig = await getAssistantConfig();
      const companyName = assistantConfig.name.split(' - ')[1] || 'Portugal Residency PRO';
      textTranscript = `${companyName} - Chat Transcript
Session ID: ${transcript.sessionId}
Date: ${transcript.createdAt.toLocaleString()}
Duration: ${Math.round(transcript.summary.sessionDuration / 1000)} seconds
Total Messages: ${transcript.summary.totalMessages}

Chat Transcript:
${transcript.messages.map(msg => `${msg.type}: ${msg.content}`).join('\n\n')}

Contact Information:
Phone: ${assistantConfig.contact.phone}
Email: ${assistantConfig.contact.email}
Website: ${assistantConfig.contact.website}`;
    } catch (error) {
      console.error("❌ Error loading assistant config for transcript:", error);
      // If assistant config fails, return error instead of hardcoded content
      return res.status(500).json({ success: false, error: "Unable to generate transcript content" });
    }

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename="chat-transcript-${sessionId}.txt"`);
    res.send(textTranscript);
  } catch (error) {
    console.error("Error downloading transcript:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Session analytics endpoint
app.get('/api/session/:sessionId/analytics', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const analytics = await database.getSessionAnalytics(sessionId);
    res.json({ success: true, analytics });
  } catch (error) {
    console.error("Error fetching session analytics:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Global analytics endpoint
app.get('/api/analytics', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};
    
    if (startDate && endDate) {
      query.timestamp = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const analytics = await database.db.collection('analytics').find(query).toArray();
    const sessions = await database.db.collection('sessions').find(query).toArray();
    
    const stats = {
      totalSessions: sessions.length,
      activeSessions: sessions.filter(s => s.isActive).length,
      totalMessages: analytics.filter(a => a.eventType === 'message_sent').length,
      totalBotResponses: analytics.filter(a => a.eventType === 'bot_response').length,
      uniqueUsers: new Set(sessions.map(s => s.userIP)).size,
      averageSessionDuration: sessions.reduce((acc, s) => acc + (s.lastActivity - s.createdAt), 0) / sessions.length,
      topUserAgents: analytics.reduce((acc, a) => {
        acc[a.userAgent] = (acc[a.userAgent] || 0) + 1;
        return acc;
      }, {})
    };

    res.json({ success: true, stats, analytics: analytics.slice(0, 100) }); // Limit to last 100 events
  } catch (error) {
    console.error("Error fetching global analytics:", error);
    res.status(500).json({ success: false, error: error.message });
  }
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

// Note: broadcastToSession function removed - using direct socket.send instead

// API endpoint to get assistant information
app.get('/api/assistant-info', async (req, res) => {
  try {
    console.log("🔍 REST API: Fetching assistant info");
    const assistantConfig = await getAssistantConfig();
    res.json({
      success: true,
      name: assistantConfig.name,
      website: assistantConfig.website,
      contact: assistantConfig.contact
    });
  } catch (error) {
    console.error("❌ REST API: Error fetching assistant info:", error);
    res.json({
      success: true,
      name: "Sofia",
      website: "https://portugalresidency.pro/",
      contact: {
        phone: "(234) 109-6666",
        email: "Herringtonconsulting@gmail.com"
      }
    });
  }
});

// Socket.IO connection handling
io.on("connection", async (socket) => {
  const clientIP = getClientIP(socket); // Use real client IP
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
  
  // Check for duplicate connections from same IP using database
  try {
    if (database.isConnected) {
      const existingConnections = await database.db.collection('connections').countDocuments({ userIP: clientIP, isActive: true });
      if (existingConnections >= 10) { // Allow max 10 connections per IP (increased for better user experience)
        console.log("🚨 Too many connections from same IP, disconnecting:", socket.id, "- IP:", clientIP, "- Existing:", existingConnections);
        socket.disconnect();
        return;
      }
    } else {
      console.log("📝 Database not connected, skipping connection limit check");
    }
  } catch (error) {
    console.error("Error checking existing connections:", error);
  }

  // Track user connections in memory for fallback
  if (!userConnections.has(clientIP)) {
    userConnections.set(clientIP, new Set());
  }
  
  const existingUserConnections = userConnections.get(clientIP);
  if (existingUserConnections.size >= 10) { // Allow max 10 connections per IP
    console.log("🚨 Too many connections from same IP (memory), disconnecting:", socket.id, "- IP:", clientIP, "- Existing:", existingUserConnections.size);
    socket.disconnect();
    return;
  }
  
  // Add this connection to the user's connections
  existingUserConnections.add(socket.id);
  
  // Only increment after all validations pass
  connectionCount++;
  
  console.log("🔌 New WebSocket connection established - Socket ID:", socket.id);
  console.log("🔌 Total active connections:", io.engine.clientsCount);
  console.log("🔌 Connection count:", connectionCount);
  
  let currentSessionId = null; // Track the session for this socket
  let messageCount = 0; // Track messages in this session
  const connectionStartTime = Date.now();

  // Helper: perform session restore and emit results
  const performSessionRestore = async (sessionId) => {
    try {
      console.log("🧭 Auto-restore invoked for:", sessionId);
      const { session, messages } = await resolveSessionAndMessages(sessionId);

      // Check if this is a new session (no messages)
      const isNewSession = !messages || messages.length === 0;
      
      if (isNewSession) {
        console.log("🆕 New session detected, sending initial greeting");
        try {
          const assistantConfig = await getAssistantConfig();
          const assistantName = assistantConfig.name.split(' - ')[0] || 'Sofia';
          const companyName = assistantConfig.name.split(' - ')[1] || 'our company';
          const greetingMessage = `Hello! I'm ${assistantName}, your AI assistant at ${companyName}. I'm here to help you with questions about our services. How can I assist you today?`;
          
          // Send initial greeting
          socket.send(JSON.stringify({
            type: "message",
            message: {
              content: greetingMessage,
              isBot: true,
              timestamp: Date.now(),
            }
          }));
          
          // Store the greeting message
          const greetingMsg = {
            content: greetingMessage,
            sessionId: sessionId,
            isBot: true,
            timestamp: Date.now(),
          };
          
          // Store in memory
          if (!activeSessions.has(sessionId)) {
            activeSessions.set(sessionId, {
              sessionId,
              messages: [greetingMsg],
              messageCount: 1,
              createdAt: new Date(),
              lastActivity: new Date()
            });
          } else {
            activeSessions.get(sessionId).messages.push(greetingMsg);
            activeSessions.get(sessionId).messageCount++;
          }
          
          // Store in database if connected
          if (database.isConnected) {
            try {
              await database.createMessage({
                sessionId: sessionId,
                content: greetingMessage,
                isBot: true,
                timestamp: new Date()
              });
            } catch (error) {
              console.error("Error storing greeting message in database:", error);
            }
          }
          
          console.log("✅ Initial greeting sent for new session");
          
          // Update messages array to include the greeting
          messages = [greetingMsg];
        } catch (error) {
          console.error("❌ Error sending initial greeting:", error);
        }
      }

      socket.emit("sessionRestored", {
        sessionId,
        messages: messages || [],
        sessionData: session
      });

      if (!activeSessions.has(sessionId)) {
        activeSessions.set(sessionId, {
          sessionId,
          messages,
          messageCount: messages.length,
          createdAt: session.createdAt || new Date(),
          lastActivity: session.lastActivity || new Date()
        });
      }

      if (session.threadId && !sessionThreads.has(sessionId)) {
        sessionThreads.set(sessionId, session.threadId);
        console.log(`🧵 Restored OpenAI thread for session: ${sessionId} -> ${session.threadId}`);
      }

      if (!sessionSockets.has(sessionId)) {
        sessionSockets.set(sessionId, new Set());
      }
      sessionSockets.get(sessionId).add(socket.id);
      console.log(`📱 Session ${sessionId} restored with ${sessionSockets.get(sessionId).size} connection(s)`);
    } catch (err) {
      console.error("❌ performSessionRestore error:", err);
      socket.emit("sessionError", { error: err.message });
    }
  };

  // Auth-based auto-restore
  try {
    const handshakeSessionId = socket.handshake && socket.handshake.auth && socket.handshake.auth.sessionId;
    if (handshakeSessionId) {
      console.log("🔐 Handshake session ID detected:", handshakeSessionId);
      currentSessionId = handshakeSessionId;
      // fire and forget
      performSessionRestore(handshakeSessionId);
    } else {
      console.log("ℹ️ No handshake sessionId provided");
    }
  } catch (authErr) {
    console.warn("⚠️ Error reading handshake auth:", authErr.message);
  }

  // Handle session restoration (manual event — kept for backward compatibility)
  socket.on("restoreSession", async (data) => {
    console.log("🔔 RESTORE SESSION EVENT RECEIVED:", data);
    try {
      console.log("🔄 Session restoration requested:", data);
      const { sessionId } = data;
      if (!sessionId) {
        console.log("❌ No session ID provided");
        socket.emit("sessionNotFound", { sessionId: null });
        return;
      }
      currentSessionId = sessionId;
      await performSessionRestore(sessionId);
    } catch (error) {
      console.error("❌ Error restoring session:", error);
      console.error("❌ Error stack:", error.stack);
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
          activeSessions.get(sessionId).lastActivity = Date.now();
        }
        
        // Clear database messages if connected
        if (database.isConnected) {
          await database.db.collection('messages').deleteMany({ sessionId: sessionId });
          console.log("🗑️ Cleared messages from database for session:", sessionId);
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
        // Get session data
        let sessionData = activeSessions.get(sessionId);
        if (!sessionData && database.isConnected) {
          const session = await database.getSession(sessionId);
          const messages = await database.getMessagesBySession(sessionId);
          sessionData = {
            sessionId: sessionId,
            messages: messages,
            messageCount: messages.length,
            createdAt: session.createdAt,
            lastActivity: session.lastActivity
          };
        }
        
        if (sessionData && sessionData.messages && sessionData.messages.length > 0) {
          // Get assistant configuration for email content
          let emailContent;
          try {
            const assistantConfig = await getAssistantConfig();
            emailContent = generateEmailContent(sessionData, assistantConfig, sessionId);
          } catch (error) {
            console.error("❌ Error loading assistant config for email:", error);
            // If assistant config fails, show error message instead of hardcoded content
            socket.emit("emailError", { 
              success: false, 
              message: "Unable to generate email content. Please try again later." 
            });
            return;
          }
          
          // Send email with dynamic content
          const emailSent = await sendEmail(
            email,
            emailContent.subject,
            emailContent.textContent,
            emailContent.htmlContent
          );
          
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
    // Add timeout wrapper to prevent hanging
    const messageProcessingPromise = processMessage(data);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Message processing timeout')), 45000); // 45 second timeout
    });
    
    try {
      await Promise.race([messageProcessingPromise, timeoutPromise]);
    } catch (error) {
      console.error("❌ Message processing error:", error);
      socket.send(JSON.stringify({ type: "typing", isTyping: false }));
      
      if (error.message === 'Message processing timeout') {
        socket.send(JSON.stringify({
          type: "message",
          message: {
            content: "I'm experiencing delays. Please try again in a moment.",
            isBot: true,
            timestamp: Date.now(),
          }
        }));
      } else {
        // For other errors, just log and continue silently
        console.warn("Non-critical message processing error:", error.message);
      }
    }
  });

  async function processMessage(data) {
    try {
      console.log("💬 Received message:", data.toString());
      const message = JSON.parse(data.toString());
      const validatedMessage = insertMessageSchema.parse(message);
      
      // Track current session for this socket
      currentSessionId = validatedMessage.sessionId;
      messageCount++;
      
      // Check for email in user message and validate it
      const emailMatch = validatedMessage.content.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/);
      if (emailMatch) {
        const detectedEmail = emailMatch[0];
        if (isValidEmail(detectedEmail)) {
          sessionEmails.set(currentSessionId, detectedEmail);
          console.log(`📧 Valid email detected for session ${currentSessionId}: ${detectedEmail}`);
          
          // Update session in database with email
          if (database.isConnected) {
            try {
              await database.updateSession(currentSessionId, { 
                userEmail: detectedEmail,
                hasUserEmail: true
              });
            } catch (error) {
              console.warn("⚠️ Could not update session with email:", error.message);
            }
          }
        } else {
          console.log(`📧 Invalid email detected: ${detectedEmail}`);
        }
      }
      
      // Reset session timeout on any activity
      resetSessionTimeout(currentSessionId);
      
      // Create or update session in database
      if (database.isConnected) {
        try {
          let session = await database.getSession(currentSessionId);
          if (!session) {
            // Create new session
            session = await database.createSession({
              sessionId: currentSessionId,
              userIP: clientIP,
              userAgent: socket.handshake.headers['user-agent'],
              referrer: socket.handshake.headers.referer || socket.handshake.headers.referrer,
              url: socket.handshake.headers.origin,
              messageCount: 0,
              hasUserEmail: false,
              userEmail: null
            });
            console.log(`📱 Created new session: ${currentSessionId}`);
          } else {
            // Update existing session
            await database.updateSession(currentSessionId, {
              lastActivity: new Date(),
              messageCount: session.messageCount + 1
            });
          }

          // Update in-memory cache
          if (!activeSessions.has(currentSessionId)) {
            activeSessions.set(currentSessionId, {
              sessionId: currentSessionId,
              messages: [],
              messageCount: 0,
              createdAt: Date.now()
            });
          }

          // Track socket for this session
          if (!sessionSockets.has(currentSessionId)) {
            sessionSockets.set(currentSessionId, new Set());
          }
          sessionSockets.get(currentSessionId).add(socket.id);
          console.log(`📱 Session ${currentSessionId} now has ${sessionSockets.get(currentSessionId).size} connection(s)`);

          // Create connection record
          try {
            await database.createConnection({
              socketId: socket.id,
              sessionId: currentSessionId,
              userIP: clientIP,
              userAgent: socket.handshake.headers['user-agent']
            });
          } catch (error) {
            if (error.code === 11000) {
              console.warn('⚠️  Connection already exists for socket:', socket.id);
            } else {
              console.error('Error creating connection:', error);
            }
          }

          // Track analytics
          if (process.env.ANALYTICS_ENABLED === 'true') {
            await database.trackEvent({
              sessionId: currentSessionId,
              eventType: 'message_sent',
              data: { messageType: 'user', content: validatedMessage.content },
              userIP: clientIP,
              userAgent: socket.handshake.headers['user-agent']
            });
          }

          console.log(`📱 Session ${currentSessionId} now has ${await database.getConnectionsBySession(currentSessionId).then(conns => conns.length)} connection(s)`);
        } catch (error) {
          console.error("Error managing session in database:", error);
        }
      } else {
        console.log("📝 Database not connected, using in-memory storage only");
      }

      // Store user message
      const savedUserMessage = await storage.createMessage(validatedMessage);
      
      // Also store in database
      try {
        await database.createMessage({
          sessionId: currentSessionId,
          content: validatedMessage.content,
          isBot: false,
          timestamp: new Date()
        });
      } catch (error) {
        console.error("Error storing message in database:", error);
      }

      // Update in-memory cache
      const userSession = activeSessions.get(currentSessionId);
      if (userSession) {
        userSession.messages.push(validatedMessage);
        userSession.messageCount = userSession.messages.length;
        userSession.lastActivity = Date.now();
      }

      // Send typing indicator
      console.log("📤 Sending typing indicator");
      socket.send(JSON.stringify({ type: "typing", isTyping: true }));

      try {
        console.log("🤖 Starting OpenAI API call for session:", currentSessionId);
        console.log("🔑 Assistant ID:", process.env.ASSISTANT_ID);
        console.log("🔑 OpenAI API Key:", process.env.OPENAI_API_KEY ? "Set" : "Not set");
        
        // Get or create thread for this session
        let threadId = sessionThreads.get(validatedMessage.sessionId);
        console.log(`🔍 Looking for thread for session: ${validatedMessage.sessionId}`);
        console.log(`🔍 Found thread in memory: ${!!threadId}`);
        console.log(`🔍 Thread ID: ${threadId}`);
        
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

        // Add the user's message to the thread
        console.log("📝 Adding user message to thread:", threadId);
        
        // Check if this is the first message in the thread
        const existingMessages = await openai.beta.threads.messages.list(threadId);
        const isFirstMessage = existingMessages.data.length === 0;
        
        let messageContent = validatedMessage.content;
        
        // Add context only for the first message
        if (isFirstMessage) {
          try {
            console.log("🔍 Fetching assistant configuration for context...");
            const assistantConfig = await getAssistantConfig();
            
            // Get conversation history for context
            let conversationHistory = [];
            if (database.isConnected) {
              try {
                const historyMessages = await database.getMessagesBySession(validatedMessage.sessionId);
                conversationHistory = historyMessages.slice(0, -1); // Exclude the current message
              } catch (error) {
                console.warn("⚠️ Could not fetch conversation history:", error.message);
              }
            }
            
            messageContent = generateContextMessage(validatedMessage.content, assistantConfig, conversationHistory);
            console.log("✅ Assistant configuration loaded successfully with", conversationHistory.length, "previous messages");
          } catch (error) {
            console.error("❌ Error loading assistant config:", error);
            // If assistant config fails, show connecting message instead of hardcoded content
            socket.send(JSON.stringify({
              type: "message",
              message: {
                content: "I'm connecting to my knowledge base. Please wait a moment...",
                isBot: true,
                timestamp: Date.now(),
              }
            }));
            return; // Exit early to prevent processing with hardcoded content
          }
        }
        
        await openai.beta.threads.messages.create(threadId, {
          role: "user",
          content: messageContent,
        });
        console.log("✅ User message added to thread successfully");

        // Run the assistant
        console.log("🚀 Creating OpenAI run for thread:", threadId, "with assistant:", process.env.ASSISTANT_ID);
        const run = await openai.beta.threads.runs.create(threadId, {
          assistant_id: process.env.ASSISTANT_ID,
        });
        console.log("✅ Run created successfully:", run.id);

        // Wait for completion with optimized polling
        let runStatus;
        let pollCount = 0;
        const maxPolls = 30; // Maximum 30 seconds
        console.log("🔄 Polling run status for thread:", threadId);
        
        do {
          // Progressive delay: start with 500ms, increase to 1s after 5 polls
          const delay = pollCount < 5 ? 500 : 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
          
          runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
          pollCount++;
          
          console.log(`🔄 Run status (poll ${pollCount}):`, runStatus.status);
          
          if (runStatus.status === "failed") {
            console.error("❌ Run failed:", runStatus.last_error);
            
            // Handle rate limit specifically
            if (runStatus.last_error?.code === 'rate_limit_exceeded') {
              console.error("🚨 OpenAI rate limit exceeded - check billing and quota");
              throw new Error("OpenAI rate limit exceeded. Please check your OpenAI billing and quota.");
            }
            
            throw new Error("Run failed: " + (runStatus.last_error?.message || "Unknown error"));
          }
          
          // Timeout protection
          if (pollCount >= maxPolls) {
            console.error("⏰ Run polling timeout after", maxPolls, "attempts");
            throw new Error("OpenAI run timeout - response took too long");
          }
        } while (runStatus.status !== "completed");
        
        console.log(`✅ Run completed successfully after ${pollCount} polls (${pollCount < 5 ? pollCount * 500 : (pollCount - 5) * 1000 + 2500}ms)`);

        // Get the assistant's response
        console.log("📥 Retrieving messages from thread:", threadId);
        const messages = await openai.beta.threads.messages.list(threadId);
        console.log("📥 Retrieved", messages.data.length, "messages");
        
        const lastMessage = messages.data[0];
        console.log("🤖 Found assistant message:", !!lastMessage);
        console.log("🤖 Message content:", lastMessage?.content);
        
        if (!lastMessage || !lastMessage.content || !lastMessage.content[0] || !lastMessage.content[0].text) {
          console.error("❌ Invalid message structure from OpenAI:", lastMessage);
          throw new Error("Invalid message structure from OpenAI");
        }
        
        const responseContent = lastMessage.content[0].text.value;
        console.log("🤖 Bot response generated:", responseContent.substring(0, 100) + "...");
        
        if (!responseContent || responseContent.trim() === '') {
          console.error("❌ Empty response from OpenAI");
          throw new Error("Empty response from OpenAI");
        }

        // Store and send bot response
        const botMessage = {
          content: responseContent,
          sessionId: validatedMessage.sessionId,
          isBot: true,
          timestamp: Date.now(),
        };
        await storage.createMessage(botMessage);
        
        // Store bot message in database
        try {
          await database.createMessage({
            sessionId: currentSessionId,
            content: botMessage.content,
            isBot: true,
            timestamp: new Date()
          });

          // Update session with bot message
          await database.updateSession(currentSessionId, {
            lastActivity: new Date(),
            messageCount: (await database.getSession(currentSessionId)).messageCount + 1
          });

          // Track analytics for bot response
          if (process.env.ANALYTICS_ENABLED === 'true') {
            await database.trackEvent({
              sessionId: currentSessionId,
              eventType: 'bot_response',
              data: { messageType: 'bot', content: botMessage.content },
              userIP: clientIP,
              userAgent: socket.handshake.headers['user-agent']
            });
          }
        } catch (error) {
          console.error("Error storing bot message in database:", error);
        }

        // Update in-memory cache with bot message
        const botSession = activeSessions.get(currentSessionId);
        if (botSession) {
          botSession.messages.push(botMessage);
          botSession.messageCount = botSession.messages.length;
          botSession.lastActivity = Date.now();
        }

        // Send in the format the client expects
        const responseData = {
          type: "message",
          message: botMessage
        };
        console.log("📤 Sending response to client:", JSON.stringify(responseData));
        
        // Send typing end and message
        socket.send(JSON.stringify({ type: "typing", isTyping: false }));
        
        // Send response to current socket
        socket.send(JSON.stringify(responseData));
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      
      // Only show error messages for critical failures
      let errorMessage = null;
      
      if (openaiError.message.includes("rate limit exceeded")) {
        errorMessage = "I'm currently experiencing high demand. Please try again in a few minutes.";
      } else if (openaiError.message.includes("API key") || openaiError.message.includes("authentication")) {
        errorMessage = "I'm having trouble with my AI service. Please try again in a moment.";
      } else if (openaiError.message.includes("timeout") || openaiError.message.includes("network")) {
        errorMessage = "I'm having trouble connecting to my AI service. Please try again.";
      }
      
      // Only send error message for critical failures
      if (errorMessage) {
        socket.send(JSON.stringify({
          type: "message",
          message: {
            content: errorMessage,
            isBot: true,
            timestamp: Date.now(),
          }
        }));
      } else {
        // For non-critical errors, just log and continue
        console.warn("Non-critical OpenAI error, continuing:", openaiError.message);
      }
    }
  } catch (error) {
    console.error("Error processing message:", error);
    
    // Only show error message for critical failures
    if (error.message.includes("validation") || error.message.includes("schema")) {
      socket.send(JSON.stringify({
        type: "message",
        message: {
          content: "I'm having trouble understanding your message. Could you please rephrase it?",
          isBot: true,
          timestamp: Date.now(),
        }
      }));
    } else {
      // For other errors, just log and continue silently
      console.warn("Non-critical message processing error:", error.message);
    }
  }
  }

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

      // Get session data from database
      const session = await database.getSession(sessionData.sessionId);
      if (!session) {
        console.log("❌ Session not found in database:", sessionData.sessionId);
        socket.emit("sessionEnded", { success: false, message: "Session not found" });
        return;
      }

      // Extract user email from messages
      const userEmail = extractUserEmailFromMessages(sessionData.messages || []);

      // Update session with user email if found
      if (userEmail) {
        await database.updateSession(sessionData.sessionId, {
          hasUserEmail: true,
          userEmail: userEmail
        });
      }

      // Skip email if no user email provided
      if (!userEmail) {
        console.log("⏭️ Skipping email - no email address provided by user");
        socket.emit("sessionEnded", { success: true, message: "Session ended" });
        return;
      }

      console.log("📧 Sending transcript to user email:", userEmail);

      // Get assistant configuration for email content
      let emailContent;
      try {
        const assistantConfig = await getAssistantConfig();
        emailContent = generateEmailContent(sessionData, assistantConfig, sessionData.sessionId);
      } catch (error) {
        console.error("❌ Error loading assistant config for email:", error);
        // If assistant config fails, skip email sending
        console.log("⏭️ Skipping email - unable to generate content");
        socket.emit("sessionEnded", { success: false, message: "Unable to generate email content" });
        return;
      }
      
      // Send email transcript
      const emailSent = await sendEmail(
        userEmail,
        emailContent.subject,
        emailContent.textContent,
        emailContent.htmlContent
      );

      // Clean up thread
      const threadId = sessionThreads.get(sessionData.sessionId);
      if (threadId) {
        sessionThreads.delete(sessionData.sessionId);
      }
      
      // Clean up active session
      activeSessions.delete(sessionData.sessionId);

      socket.emit("sessionEnded", { success: emailSent });
    } catch (error) {
      console.error("Error processing session end:", error);
      socket.emit("sessionEnded", { success: false, error: error.message });
    }
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
    console.log("🔌 Session ID:", currentSessionId);
    console.log("🔌 Messages in session:", messageCount);
    
    // Clean up session sockets
    if (currentSessionId && sessionSockets.has(currentSessionId)) {
      sessionSockets.get(currentSessionId).delete(socket.id);
      const remainingSockets = sessionSockets.get(currentSessionId).size;
      
      console.log(`📱 Session ${currentSessionId} now has ${remainingSockets} connection(s) open`);
      
      if (remainingSockets === 0) {
        sessionSockets.delete(currentSessionId);
        console.log(`🔒 All connections closed for session ${currentSessionId}`);
      } else {
        console.log(`📱 Session ${currentSessionId} still has ${remainingSockets} tab(s) open`);
        // Don't send email or cleanup if other tabs are still open
        return;
      }
    }

    // Clean up user connections
    if (userConnections.has(clientIP)) {
      userConnections.get(clientIP).delete(socket.id);
      if (userConnections.get(clientIP).size === 0) {
        userConnections.delete(clientIP);
        console.log(`🔒 All connections closed for IP: ${clientIP}`);
      } else {
        console.log(`📱 IP ${clientIP} still has ${userConnections.get(clientIP).size} connection(s) open`);
      }
    }
    
    // Remove connection from database
    try {
      await database.deleteConnection(socket.id);
      
      // Check remaining connections for this session
      const remainingConnections = await database.getConnectionsBySession(currentSessionId);
      console.log(`📱 Session ${currentSessionId} now has ${remainingConnections.length} connection(s) open`);
      
      if (remainingConnections.length === 0) {
        // Mark session as inactive
        await database.updateSession(currentSessionId, { isActive: false });
        console.log(`🔒 All connections closed for session ${currentSessionId}`);
      }
    } catch (error) {
      console.error("Error managing connection disconnect in database:", error);
    }
    
    // Handle session cleanup and transcript sending on disconnect
    if (currentSessionId) {
      console.log("📧 Socket disconnected - Processing session:", currentSessionId);
      
      // Clear the session timeout since user is disconnecting
      if (sessionTimeouts.has(currentSessionId)) {
        clearTimeout(sessionTimeouts.get(currentSessionId));
        sessionTimeouts.delete(currentSessionId);
        console.log(`⏰ Cleared timeout for disconnected session: ${currentSessionId}`);
      }
      
      // If this was the last connection for the session, send transcript immediately
      const remainingSockets = sessionSockets.get(currentSessionId)?.size || 0;
      if (remainingSockets === 0) {
        console.log("📧 Last connection closed - sending transcript immediately");
        // Use setTimeout to ensure disconnect processing completes first
        setTimeout(() => {
          sendTranscriptAndCleanup(currentSessionId);
        }, 1000);
      }
    }
            
            // Skip email if no user email provided
            if (!userEmail) {
              console.log("⏭️ Skipping email on disconnect - no email address provided by user");
              return;
            }
            
            console.log("📧 Sending transcript to user email:", userEmail);
            
            // Get assistant configuration for email content
            let emailContent;
            try {
              const assistantConfig = await getAssistantConfig();
              emailContent = generateEmailContent(sessionData, assistantConfig, currentSessionId);
            } catch (error) {
              console.error("❌ Error loading assistant config for email:", error);
              // If assistant config fails, skip email sending
              console.log("⏭️ Skipping email on disconnect - unable to generate content");
              return;
            }
            
            // Send email transcript
            const emailSent = await sendEmail(
              userEmail,
              emailContent.subject,
              emailContent.textContent,
              emailContent.htmlContent
            );
            
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
  
  // Clean up processed sessions (older than 24 hours)
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
  for (const sessionId of processedSessions) {
    // We can't track timestamps for processed sessions, so just limit the size
    if (processedSessions.size > 500) { // Reduced from 1000
      processedSessions.clear();
      console.log("🧹 Cleared processed sessions cache");
      break;
    }
  }
  
  // Clean up rate limiting cache
  const rateLimitCleanup = Date.now() - (10 * 60 * 1000); // 10 minutes
  for (const [ip, timestamp] of connectionRateLimit.entries()) {
    if (timestamp < rateLimitCleanup) {
      connectionRateLimit.delete(ip);
    }
  }
  
  // Clean up empty sessionSockets entries
  for (const [sessionId, sockets] of sessionSockets.entries()) {
    if (sockets.size === 0) {
      sessionSockets.delete(sessionId);
    }
  }
  
  // Clean up empty user connections
  if (typeof userConnections !== 'undefined' && userConnections instanceof Map) {
    for (const [ip, connections] of userConnections.entries()) {
      if (connections.size === 0) {
        userConnections.delete(ip);
      }
    }
  } else {
    console.warn("⚠️ userConnections Map not available for cleanup");
  }
  
  // Log current connection stats
  const userConnectionsSize = (typeof userConnections !== 'undefined' && userConnections instanceof Map) ? userConnections.size : 0;
  console.log("📊 Connection stats - Active:", connectionCount, "Processed sessions:", processedSessions.size, "Rate limit entries:", connectionRateLimit.size, "User connections:", userConnectionsSize);
}, 2 * 60 * 1000); // Run every 2 minutes

// Start server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Portugal Residency PRO Chatbot running on http://0.0.0.0:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🤖 Assistant ID: ${process.env.ASSISTANT_ID}`);
  // Warm assistant-config cache on startup (non-blocking)
  try {
    Promise.resolve(getAssistantConfig())
      .then(() => console.log('🔥 Assistant config cache warmed'))
      .catch((e) => console.warn('⚠️ Failed to warm assistant config cache:', e.message));
  } catch (e) {
    console.warn('⚠️ getAssistantConfig warm-up threw:', e.message);
  }
  // Periodic refresh every 10 minutes (optional)
  const refreshMs = 10 * 60 * 1000;
  setInterval(() => {
    try {
      Promise.resolve(getAssistantConfig())
        .then(() => console.log('♻️ Assistant config cache refreshed'))
        .catch((e) => console.warn('⚠️ Assistant config refresh failed:', e.message));
    } catch (e) {
      console.warn('⚠️ Assistant config refresh threw:', e.message);
    }
  }, refreshMs);
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
      
      // Start cleanup interval
      setInterval(async () => {
        try {
          await database.cleanupOldData();
        } catch (error) {
          // Only log cleanup errors, don't affect main functionality
          console.warn("⚠️ Database cleanup failed (non-critical):", error.message);
        }
      }, process.env.DB_CLEANUP_INTERVAL || 3600000); // 1 hour default
    } else {
      console.warn("⚠️  Database connection failed, falling back to in-memory storage");
    }
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
  }
}

// Startup check for EMAIL_TO
if (!process.env.EMAIL_TO) {
  console.warn("⚠️  EMAIL_TO not set - email functionality may be limited");
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

