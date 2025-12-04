// FIXED VERSION of sendChatTranscriptEmail function
// Replace your current function with this one

async function sendChatTranscriptEmail(sessionData) {
  const { sessionId, messages, timestamp, userAgent, referrer, url } = sessionData;

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

  // Extract user email from messages (if provided)
  const userEmail = extractUserEmailFromMessages(messages);
  const recipientEmail = userEmail || "ahmarjabbar7@gmail.com"; // Fallback to your email

  // Email options - FIXED: Added FROM and TO fields
  const mailOptions = {
    from: "ahmarjabbar7@gmail.com",  // ← ADDED: From email
    to: recipientEmail,              // ← ADDED: To email (user's email or fallback)
    subject: `Portugal Residency PRO - Chat Transcript - Session ${sessionId.substring(0, 8)}`,
    text: `Portugal Residency PRO - Chat Transcript\n\n${metadata}\n\n${formattedMessages}`,
    html: `
      <h2>Portugal Residency PRO - Chat Transcript</h2>
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p><strong>Session ID:</strong> ${sessionId}</p>
        <p><strong>Started:</strong> ${new Date(messages[0].timestamp).toLocaleString()}</p>
        <p><strong>Ended:</strong> ${new Date(timestamp).toLocaleString()}</p>
        <p><strong>URL:</strong> ${url || "N/A"}</p>
        <p><strong>Referrer:</strong> ${referrer || "N/A"}</p>
        <p><strong>User Agent:</strong> ${userAgent || "N/A"}</p>
        <p><strong>IP Address:</strong> ${ipAddress || "N/A"}</p>
        <p><strong>Country:</strong> ${ipData.country || "N/A"}</p>
        <p><strong>Timezone:</strong> ${ipData.timezone || "N/A"}</p>
      </div>
      <div style="line-height: 1.6;">
        ${messages
        .map((msg) => {
          const date = new Date(msg.timestamp).toLocaleString();
          const role = msg.isBot ? "Sofia (Assistant)" : "User";
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
      <hr>
      <p><strong>Portugal Residency PRO</strong><br>
      Phone: (234) 109-6666<br>
      Email: Herringtonconsulting@gmail.com<br>
      Website: <a href="https://portugalresidency.pro/">https://portugalresidency.pro/</a></p>
    `,
  };

  try {
    console.log("📧 Sending email via webhook...");
    console.log("📧 From:", mailOptions.from);
    console.log("📧 To:", mailOptions.to);
    console.log("📧 Subject:", mailOptions.subject);

    const response = await fetch("https://n8n.srv917741.hstgr.cloud/webhook/ac21fa0b-ad69-45bf-857b-4bce97ea14bd", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mailOptions),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const result = await response.json().catch(() => ({}));
    console.log("✅ Webhook response:", result);
    return true;
  } catch (error) {
    console.error("❌ Error sending to webhook:", error);
    return false;
  }
}

// Helper function to extract email from messages
function extractUserEmailFromMessages(messages) {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  
  for (const message of messages) {
    if (!message.isBot && message.content) {
      const matches = message.content.match(emailRegex);
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }
  }
  return null;
}

module.exports = { sendChatTranscriptEmail, extractUserEmailFromMessages };
