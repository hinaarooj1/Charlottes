const express = require("express");
const { createServer } = require("http");
const path = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const { insertMessageSchema } = require("./shared/schema.js");
const { storage } = require("./storage.js");
const OpenAI = require("openai");
const { Server } = require("socket.io");
const nodemailer = require("nodemailer");
const sendEmail = require("./emailService");
require("dotenv").config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: { 
    origin: process.env.SOCKET_CORS_ORIGIN || "*", 
    methods: ["GET", "POST"] 
  },
  path: "/socket.io",
  transports: ["websocket", "polling"],
});

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "100mb" }));
app.use(cors({ origin: "*" }));

// Middleware to set correct MIME type for images
app.use((req, res, next) => {
  if (req.path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
    const ext = req.path.split('.').pop().toLowerCase();
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp'
    };
    res.setHeader('Content-Type', mimeTypes[ext] || 'image/jpeg');
  }
  next();
});

app.use("/public", express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "themes/")));

global.appRoot = path.resolve(__dirname);
const sessionThreads = new Map();

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: process.env.HOST,
  port: process.env.PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify email transporter configuration
transporter.verify((error) => {
  if (error) {
    // console.error("Email configuration error:", error);
  } else {
    // console.log("Email server is ready to send messages");
  }
});

// Function to validate email format
function isValidEmail(email) {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
  return emailRegex.test(email);
}

// Function to extract user email from messages
function extractUserEmailFromMessages(messages) {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  
  for (const message of messages) {
    if (!message.isBot) { // Only check user messages
      const emailMatch = message.content.match(emailRegex);
      if (emailMatch && emailMatch.length > 0) {
        const email = emailMatch[0];
        if (isValidEmail(email)) {
          return email; // Return first valid email found
        }
      }
    }
  }
  return null; // No valid email found
}

async function sendChatTranscriptEmail(sessionData) {
  const { sessionId, messages, timestamp, userAgent, referrer, url } = sessionData;
  
  // Extract user email from chat messages
  const userEmail = extractUserEmailFromMessages(messages);
  const recipientEmail = userEmail || process.env.EMAIL_TO; // Fallback to default
  
  console.log(`Sending email to: ${recipientEmail} ${userEmail ? '(from chat)' : '(default)'}`);

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

  ipData = await detailsResponse.json();
  console.log(":rocket: ~ sendChatTranscriptEmail ~ ipData:", ipData);

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

    // Try sending via Nodemailer first
    try {
      const emailResult = await transporter.sendMail(mailOptions);
      console.log("Email sent successfully via Nodemailer:", emailResult.messageId);
      return true;
    } catch (emailError) {
      console.error("Nodemailer failed, trying webhook:", emailError.message);
      
      // Fallback to emailService (which includes webhook fallback)
      console.log("📧 Using emailService fallback...");
      const emailResult = await sendEmail(
        recipientEmail,
        mailOptions.subject,
        mailOptions.text,
        mailOptions.html
      );
      console.log("✅ Email sent via emailService:", emailResult);
      return true;
    }
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }

}
// Function to clean response text
function cleanResponse(response) {
  return response
    .replace(/【.*?】/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/###/g, "")
    .replace(/\n{2,}/g, "\n\n")
    .trim();
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY 
});

// WebSocket connection handling
io.on("connection", (socket) => {
  // console.log("New connection:", socket.id);

  socket.on("connect_error", (error) => {
    console.error("Connection error for socket:", socket.id, error);
  });

  // Handle incoming messages
  socket.on("message", async (data) => {
    try {
      const message = JSON.parse(data.toString());
      const validatedMessage = insertMessageSchema.parse(message);

      const savedUserMessage = await storage.createMessage(validatedMessage);

      socket.send(JSON.stringify({ type: "typing", isTyping: true }));

      try {
        let threadId = sessionThreads.get(validatedMessage.sessionId);
        if (!threadId) {
          const thread = await openai.beta.threads.create();
          threadId = thread.id;
          sessionThreads.set(validatedMessage.sessionId, threadId);
        }

        // Send the raw user message to the Assistant. All persona, tone and
        // behavior should be controlled by the Assistant's own instructions
        // in OpenAI, not by hardcoded text here.
        await openai.beta.threads.messages.create(threadId, {
          role: "user",
          content: validatedMessage.content,
        });

        const run = await openai.beta.threads.runs.create(threadId, {
          assistant_id: process.env.ASSISTANT_ID,
        });

        let runStatus;
        do {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          runStatus = await openai.beta.threads.runs.retrieve(threadId, run.id);
          if (runStatus.status === "failed") {
            throw new Error("Run failed");
          }
        } while (runStatus.status !== "completed");

        const messages = await openai.beta.threads.messages.list(threadId);
        const responseMessage = messages.data.find((msg) => msg.role === "assistant");

        let botResponse = "I apologize, but I'm having trouble processing your request at the moment.";

        if (responseMessage && responseMessage.content.length > 0) {
          const firstContent = responseMessage.content[0];
          if ("text" in firstContent) {
            botResponse = cleanResponse(firstContent.text.value);
          }
        }

        const botMessage = await storage.createMessage({
          content: botResponse,
          isBot: "true",
          sessionId: validatedMessage.sessionId,
        });

        socket.send(JSON.stringify({ type: "typing", isTyping: false }));
        socket.send(JSON.stringify({ type: "message", message: botMessage }));
      } catch (error) {
        console.error("OpenAI API error:", error);
        socket.send(JSON.stringify({ type: "typing", isTyping: false }));
        socket.send(
          JSON.stringify({
            type: "message",
            message: await storage.createMessage({
              content: "I apologize, but I'm having trouble processing your request at the moment.",
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

  // Handle session end
  socket.on("endSession", async (data) => {
    try {
      const sessionData = JSON.parse(data.toString());
      console.log("Session ended:", sessionData.sessionId);

      const emailSent = await sendChatTranscriptEmail(sessionData);

      const threadId = sessionThreads.get(sessionData.sessionId);
      if (threadId) {
        sessionThreads.delete(sessionData.sessionId);
      }

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
});

// Default route
app.get("/", (req, res) => {
  // Keep this generic so it doesn't hardcode a specific bot name
  res.send(process.env.STATUS_MESSAGE || "Assistant is live!");
});

// Start server
const PORT = process.env.NODE_PORT || 5000;
server.listen(PORT, () => console.log(`Server starting at Port ${PORT}`));
