import { createTemplate } from "./template";
import { io, Socket } from "socket.io-client";

const WC_TAG_NAME = "portugal-residency-widget";

export default async function createWidget(wg_id: string) {
  const template = createTemplate({});

  class GreeterWidgetElement extends HTMLElement {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: number = 1000;
  private sessionId: string;
  private emailSent = false; // Flag to prevent duplicate email sends
  private typingTimeout: NodeJS.Timeout | null = null; // Timeout for typing indicator
  private sessionRestored = false; // Flag to prevent duplicate session restoration
  private sessionRestoreAttempts = 0; // Track session restoration attempts
  private maxSessionRestoreAttempts = 3; // Maximum attempts to restore session
  private assistantName = "Sofia"; // Default assistant name
  private isOnline = navigator.onLine; // Track online status
    private messages: Array<{
      content: string;
      isBot: boolean;
      timestamp: number;
    }> = [];

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: "open" });
      shadow.appendChild(template.content.cloneNode(true));
      
      // Try to restore session from localStorage first
      this.sessionId = this.getOrCreateSessionId();
      this.initializeElements();
      this.connectWebSocket();
      this.setupPageUnloadHandler();

      // Hide the widget initially and show loading overlay
      const container = shadow.getElementById(
        "widget-container"
      ) as HTMLElement;
      const toggleButton = shadow.getElementById(
        "toggle-button"
      ) as HTMLButtonElement;
      if (container && toggleButton) {
        container.style.display = "none"; // Keep widget hidden initially
        toggleButton.style.display = "block"; // Ensure toggle button is visible
      }

      // Add a loading overlay inside the widget
      const messagesContainer = shadow.getElementById("messages-container") as HTMLElement;
      if (messagesContainer) {
        const loading = document.createElement('div');
        loading.id = 'restore-loading-overlay';
        loading.style.cssText = `
          display: none;
          padding: 20px;
          margin: 8px 0;
          text-align: center;
          color: #666;
          font-size: 14px;
          background: #f8f9fa;
          border-radius: 12px;
          border: 1px solid #e9ecef;
        `;
        loading.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
            <div class="loading-spinner"></div>
            <span>Restoring your chat...</span>
          </div>
        `;
        messagesContainer.parentElement?.insertBefore(loading, messagesContainer);
      }

      // Add connectivity status banner
      const connectivityBanner = document.createElement('div');
      connectivityBanner.id = 'connectivity-banner';
      connectivityBanner.style.cssText = `
        display: none;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        background: #dc3545;
        color: white;
        padding: 8px 16px;
        font-size: 12px;
        text-align: center;
        z-index: 1000;
        border-radius: 16px 16px 0 0;
      `;
      connectivityBanner.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 8px;">
          <div class="loading-spinner" style="border-top-color: white;"></div>
          <span>No internet connection. Retrying...</span>
        </div>
      `;
      const widgetContainer = shadow.getElementById("widget-container");
      if (widgetContainer) {
        widgetContainer.appendChild(connectivityBanner);
      }

      // Add loading spinner CSS
      const style = document.createElement('style');
      style.textContent = `
        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e9ecef;
          border-top: 2px solid #a60316;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .reconnecting-banner {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          background: #fff3cd;
          color: #856404;
          padding: 8px 16px;
          font-size: 12px;
          text-align: center;
          border-bottom: 1px solid #ffeaa7;
          z-index: 1000;
        }
      `;
      shadow.appendChild(style);

      // Add internet connectivity listeners
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.hideConnectivityBanner();
        this.connectWebSocket();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
        this.showConnectivityBanner();
      });

      // Don't add initial greeting here - the server will handle it
      // when a new session is created or when session is restored
    }

    private getOrCreateSessionId(): string {
      try {
        // Try to get existing session from localStorage
        const existingSessionId = localStorage.getItem('portugal-chatbot-session-id');
        if (existingSessionId) {
          return existingSessionId;
        }
      } catch (error) {
        console.warn("⚠️ localStorage not available (private browsing?):", error);
      }
      
      // Create new session ID
      const newSessionId = Math.random().toString(36).substring(7);
      try {
        localStorage.setItem('portugal-chatbot-session-id', newSessionId);
      } catch (error) {
        console.warn("⚠️ Could not store session ID in localStorage:", error);
      }
      return newSessionId;
    }

    // Removed manual restoreSession() - now using auth-based auto-restore

    private setupPageUnloadHandler() {
      // Page unload handlers removed - server will handle email sending after 10 minutes of inactivity
      // No immediate email sending when user leaves tab
    }

    private async sendEmailToUser(email: string) {
      if (!this.socket || !this.socket.connected) {
        this.addMessage("Sorry, I'm not connected. Please try again in a moment.", true);
        return;
      }

      try {
        this.socket.emit("sendEmail", { sessionId: this.sessionId, email });
      } catch (error) {
        console.error("Error sending email:", error);
        this.addMessage("Sorry, there was an error sending the email. Please try again.", true);
      }
    }

    private async clearChat() {
      if (!this.socket || !this.socket.connected) {
        this.addMessage("Sorry, I'm not connected. Please try again in a moment.", true);
        return;
      }

      try {
        this.socket.emit("clearChat", { sessionId: this.sessionId });
        } catch (error) {
        console.error("Error clearing chat:", error);
        this.addMessage("Sorry, there was an error clearing the chat. Please try again.", true);
      }
    }

    private initializeElements() {
      const shadow = this.shadowRoot!;
      const container = shadow.getElementById(
        "widget-container"
      ) as HTMLElement;
      const toggleButton = shadow.getElementById(
        "toggle-button"
      ) as HTMLButtonElement;
      const closeButton = shadow.getElementById(
        "close-button"
      ) as HTMLButtonElement;
      const messageInput = shadow.getElementById(
        "message-input"
      ) as HTMLInputElement;
      const sendButton = shadow.getElementById(
        "send-button"
      ) as HTMLButtonElement;

      // Disable input and send until session restored
      if (messageInput) {
        messageInput.disabled = true;
        messageInput.placeholder = "Restoring your chat…";
      }
      if (sendButton) {
        sendButton.disabled = true;
      }

      // Show/hide widget
      closeButton.addEventListener("click", () => {
        container.style.display = "none";
        toggleButton.style.display = "block";
      });

      toggleButton.addEventListener("click", () => {
        container.style.display = "flex";
        toggleButton.style.display = "none";
      });

      // Send message handling
      const sendMessage = () => {
        const text = messageInput.value.trim();
        if (text) {
          this.addMessage(text, false, true, Date.now());
          messageInput.value = "";
          sendButton.disabled = true; // Disable while sending
          
          try {
            this.messages.push({
              content: text,
              isBot: false,
              timestamp: Date.now(),
            });

            // Note: Email detection removed - emails will only be sent when session ends

            // Try to send via socket if connected
            if (this.socket && this.socket.connected) {
              this.socket.emit(
                "message",
                JSON.stringify({
                  content: text,
                  isBot: false,
                  sessionId: this.sessionId,
                })
              );
              sendButton.disabled = false; // Re-enable after sending
            } else {
              // Show connection error message
              this.addMessage("Sorry, I'm having trouble connecting. Please try again in a moment.", true);
              sendButton.disabled = false; // Re-enable button
              this.connectWebSocket();
            }
          } catch (error) {
            console.error("Error sending message:", error);
            this.addMessage("Sorry, there was an error sending your message. Please try again.", true);
            sendButton.disabled = false; // Re-enable button
          }
        }
      };

      // Handle both click and touch events for better mobile support
      sendButton.addEventListener("click", sendMessage);
      sendButton.addEventListener("touchend", (e) => {
        e.preventDefault();
        sendMessage();
      });
      
      messageInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });

      // Enable/disable send button based on input
      messageInput.addEventListener("input", () => {
        sendButton.disabled = !messageInput.value.trim();
      });
      
      // Re-enable button after socket reconnection
      this.socket?.on("connect", () => {
        if (messageInput.value.trim()) {
          sendButton.disabled = false;
        }
      });

      // Add action buttons after all elements are initialized
      setTimeout(() => {
        this.addActionButtons();
      }, 100);

    }

    private addActionButtons() {
      try {
        const shadow = this.shadowRoot!;
        const header = shadow.getElementById("widget-header") as HTMLElement;
        
        if (!header) {
          console.warn("Widget header not found, skipping action buttons");
          return;
        }

      // Create buttons container
      const buttonsContainer = document.createElement("div");
      buttonsContainer.style.cssText = `
        display: flex;
        gap: 8px;
        margin-left: auto;
      `;

      // Email button
      const emailButton = document.createElement("button");
      emailButton.innerHTML = "📧";
      emailButton.title = "Send chat transcript via email";
      emailButton.style.cssText = `
        background: transparent;
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 6px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
      `;
      emailButton.addEventListener("click", () => this.showEmailDialog());
      emailButton.addEventListener("mouseenter", () => {
        emailButton.style.backgroundColor = "rgba(255,255,255,0.1)";
      });
      emailButton.addEventListener("mouseleave", () => {
        emailButton.style.backgroundColor = "transparent";
      });

      // Clear chat button
      const clearButton = document.createElement("button");
      clearButton.innerHTML = "🗑️";
      clearButton.title = "Clear chat history";
      clearButton.style.cssText = `
        background: transparent;
        border: 1px solid rgba(255,255,255,0.3);
        color: white;
        padding: 6px 8px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        transition: background-color 0.2s;
      `;
      clearButton.addEventListener("click", () => this.showClearChatDialog());
      clearButton.addEventListener("mouseenter", () => {
        clearButton.style.backgroundColor = "rgba(255,255,255,0.1)";
      });
      clearButton.addEventListener("mouseleave", () => {
        clearButton.style.backgroundColor = "transparent";
      });
 
      
      // Insert buttons in the header
      const closeButton = shadow.getElementById("close-button");
      if (closeButton && closeButton.parentNode === header) {
        header.insertBefore(buttonsContainer, closeButton);
      } else {
        // If close button is not a direct child or doesn't exist, append to header
        header.appendChild(buttonsContainer);
      }
      } catch (error) {
        console.error("Error adding action buttons:", error);
      }
    }

    private showEmailDialog() {
      // Create a better email input dialog
      const emailDialog = document.createElement("div");
      emailDialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;

      const dialogContent = document.createElement("div");
      dialogContent.style.cssText = `
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        max-width: 400px;
        width: 90%;
        text-align: center;
      `;

      dialogContent.innerHTML = `
        <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">📧 Send Chat Transcript</h3>
        <p style="margin: 0 0 16px 0; color: #666; font-size: 14px;">Enter your email to receive the chat transcript</p>
        <input type="email" id="email-input" placeholder="your@email.com" style="
          width: 100%;
          padding: 12px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 16px;
          margin-bottom: 16px;
          box-sizing: border-box;
        " />
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="email-cancel" style="
            padding: 10px 20px;
            border: 1px solid #ccc;
            background: #f5f5f5;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">Cancel</button>
          <button id="email-send" style="
            padding: 10px 20px;
            border: none;
            background: #a60316;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">Send Transcript</button>
        </div>
      `;

      emailDialog.appendChild(dialogContent);
      document.body.appendChild(emailDialog);

      const emailInput = dialogContent.querySelector("#email-input") as HTMLInputElement;
      const cancelBtn = dialogContent.querySelector("#email-cancel") as HTMLButtonElement;
      const sendBtn = dialogContent.querySelector("#email-send") as HTMLButtonElement;

      // Focus on input
      emailInput.focus();

      // Handle cancel
      cancelBtn.addEventListener("click", () => {
        document.body.removeChild(emailDialog);
      });

      // Handle send
      const handleSend = () => {
        const email = emailInput.value.trim();
        if (email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (emailRegex.test(email)) {
            this.sendEmailToUser(email);
            document.body.removeChild(emailDialog);
          } else {
            emailInput.style.borderColor = "#ff4444";
            emailInput.placeholder = "Please enter a valid email address";
          }
        }
      };

      sendBtn.addEventListener("click", handleSend);
      emailInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          handleSend();
        }
      });

      // Close on backdrop click
      emailDialog.addEventListener("click", (e) => {
        if (e.target === emailDialog) {
          document.body.removeChild(emailDialog);
        }
      });
    }

    private showClearChatDialog() {
      // Create a better clear chat confirmation dialog
      const clearDialog = document.createElement("div");
      clearDialog.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10000;
      `;

      const dialogContent = document.createElement("div");
      dialogContent.style.cssText = `
        background: white;
        padding: 24px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        max-width: 400px;
        width: 90%;
        text-align: center;
      `;

      dialogContent.innerHTML = `
        <div style="font-size: 48px; margin-bottom: 16px;">🗑️</div>
        <h3 style="margin: 0 0 16px 0; color: #333; font-size: 18px;">Clear Chat History</h3>
        <p style="margin: 0 0 24px 0; color: #666; font-size: 14px; line-height: 1.5;">
          Are you sure you want to clear the chat history?<br>
          <strong>This action cannot be undone.</strong>
        </p>
        <div style="display: flex; gap: 12px; justify-content: center;">
          <button id="clear-cancel" style="
            padding: 10px 20px;
            border: 1px solid #ccc;
            background: #f5f5f5;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">Cancel</button>
          <button id="clear-confirm" style="
            padding: 10px 20px;
            border: none;
            background: #dc3545;
            color: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
          ">Clear Chat</button>
        </div>
      `;

      clearDialog.appendChild(dialogContent);
      document.body.appendChild(clearDialog);

      const cancelBtn = dialogContent.querySelector("#clear-cancel") as HTMLButtonElement;
      const confirmBtn = dialogContent.querySelector("#clear-confirm") as HTMLButtonElement;

      // Handle cancel
      cancelBtn.addEventListener("click", () => {
        document.body.removeChild(clearDialog);
      });

      // Handle confirm
      confirmBtn.addEventListener("click", () => {
        this.clearChat();
        document.body.removeChild(clearDialog);
      });

      // Close on backdrop click
      clearDialog.addEventListener("click", (e) => {
        if (e.target === clearDialog) {
          document.body.removeChild(clearDialog);
        }
      });
    }

    private connectWebSocket() {
      try {
        // Check internet connectivity first
        if (!this.isOnline) {
          this.showConnectivityBanner();
          return;
        }

        // Hide connectivity banner if online
        this.hideConnectivityBanner();

        // Use Render server URL for production, localhost for development
        const serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
          ? "http://localhost:5000" 
          : "https://portugalresidency-chatbot.onrender.com";
          
        // iOS-specific connection options
        const isIOS = /iPad|iPhone|iPod/.test(window.navigator.userAgent);
        const connectionOptions = {
          transports: isIOS ? ["polling"] : ["polling", "websocket"], // iOS prefers polling
          forceNew: true,
          secure: window.location.protocol === 'https:',
          rejectUnauthorized: false,
          reconnection: true,
          reconnectionAttempts: isIOS ? 10 : this.maxReconnectAttempts, // More attempts for iOS
          reconnectionDelay: isIOS ? 5000 : this.reconnectTimeout, // Faster reconnection for iOS
          timeout: isIOS ? 30000 : 20000, // Longer timeout for iOS
          path: "/socket.io",
          auth: { sessionId: this.sessionId },
        };
          
      // Show loading overlay while connecting
      const overlay = this.shadowRoot?.getElementById('restore-loading-overlay');
      if (overlay) overlay.style.display = 'block';
      
      // Disable input while connecting
      const messageInput = this.shadowRoot?.getElementById("message-input") as HTMLInputElement;
      const sendButton = this.shadowRoot?.getElementById("send-button") as HTMLButtonElement;
      if (messageInput && sendButton) {
        messageInput.disabled = true;
        sendButton.disabled = true;
      }
          
        this.socket = io(serverUrl, connectionOptions);

        this.socket.on("connect", () => {
          
          // Fetch assistant name from server
          this.fetchAssistantName();
          
          // Start a REST fallback timer if session not restored promptly
          setTimeout(() => {
            if (!this.sessionRestored) {
              this.fetchSessionViaREST();
            }
          }, 2000);
        });

        this.socket.on("message", (data) => {
          try {
            // Socket.IO already parses JSON for us, so data is already an object
            // If it's a string, parse it; otherwise use it directly
            const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
            
            if (parsedData.type === "typing") {
              this.setTypingIndicator(parsedData.isTyping);
            } else if (parsedData.type === "message") {
              this.setTypingIndicator(false);
              this.addMessage(parsedData.message.content, true, true, parsedData.message.timestamp);

              this.messages.push({
                content: parsedData.message.content,
                isBot: true,
                timestamp: parsedData.message.timestamp || Date.now(),
              });
            }
          } catch (error) {
            console.error("Error parsing message:", error);
          }
        });

        this.socket.on("disconnect", (reason) => {
          // Clear typing indicator on disconnect
          this.setTypingIndicator(false);
          // Inform user unobtrusively
          const overlay = this.shadowRoot?.getElementById('restore-loading-overlay');
          if (overlay) {
            overlay.innerText = 'Reconnecting…';
            overlay.style.display = 'block';
          }
          // Disable input and send while disconnected
          const messageInput = this.shadowRoot?.getElementById("message-input") as HTMLInputElement;
          const sendButton = this.shadowRoot?.getElementById("send-button") as HTMLButtonElement;
          if (messageInput) messageInput.disabled = true;
          if (sendButton) sendButton.disabled = true;
          // Socket.IO will automatically reconnect - don't manually call connectWebSocket()
          // Manual reconnection causes connection loops
        });

        this.socket.on("connect_error", (error) => {
          console.error("WebSocket connection error:", error);
          // Clear typing indicator on connection error
          this.setTypingIndicator(false);
          const overlay = this.shadowRoot?.getElementById('restore-loading-overlay');
          if (overlay) {
            overlay.innerText = 'Connection error. Retrying…';
            overlay.style.display = 'block';
          }
          // iOS-specific error handling
          if (window.navigator.userAgent.includes('iPhone') || window.navigator.userAgent.includes('iPad')) {
            this.addMessage("Having trouble connecting on iOS. Please try refreshing the page or check your internet connection.", true);
          } else {
            this.addMessage("Connection error. Please check your internet connection.", true);
          }
        });

        // Handle session restoration
        this.socket.on("sessionRestored", (data) => {
          this.sessionRestored = true;
          this.sessionRestoreAttempts = 0; // Reset retry counter
          // Hide loading overlay
          const overlay = this.shadowRoot?.getElementById('restore-loading-overlay');
          if (overlay) overlay.style.display = 'none';
          // Enable input and send
          const messageInput = this.shadowRoot?.getElementById("message-input") as HTMLInputElement;
          const sendButton = this.shadowRoot?.getElementById("send-button") as HTMLButtonElement;
          if (messageInput) {
            messageInput.disabled = false;
            messageInput.placeholder = "Type your message…";
          }
          if (sendButton) {
            sendButton.disabled = !messageInput.value.trim();
          }
          
          // Clear the timeout since restoration succeeded
          if ((this as any).restoreTimeoutId) {
            clearTimeout((this as any).restoreTimeoutId);
            (this as any).restoreTimeoutId = null;
          }
          
          if (data.messages && data.messages.length > 0) {
            
            // Clear existing messages and reset the messages array
            this.messages = [];
            const messagesContainer = this.shadowRoot?.getElementById("messages-container");
            if (messagesContainer) {
              messagesContainer.innerHTML = `
                <div class="hero_heading">
                  <img src="https://files-cdn.chatway.app/1GbfCaeyiIRtZI8wTQVCIDPmwTIwCtmDvXJTrasQ0bEtI1RU_88x88.jpg" alt="Andrist" class="center_img" />
                  <h4 class="main_heading">${this.assistantName}</h4>
                  <p class="main_para">joined</p>
                </div>
                <div class="date-separator">
                  ${new Date().toLocaleDateString("en-US",{month:"long",day:"numeric"})}
                </div>
              `;
            }
            
            // Restore messages one by one
            data.messages.forEach((msg: any, index: number) => {
              // Convert isBot to boolean if it's a string
              const isBot = msg.isBot === true || msg.isBot === "true";
              this.messages.push({
                content: msg.content,
                isBot: isBot,
                timestamp: msg.timestamp || Date.now()
              });
              
              // Add message to UI
              this.addMessage(msg.content, isBot, false, msg.timestamp); // false = don't add to messages array again
            });
            
          } else {
          }
        });

        this.socket.on("sessionNotFound", () => {
          this.sessionRestored = true; // Prevent adding initial greeting
          this.sessionRestoreAttempts = 0; // Reset retry counter
          const overlay = this.shadowRoot?.getElementById('restore-loading-overlay');
          if (overlay) overlay.style.display = 'none';
          // Enable input and send
          const messageInput = this.shadowRoot?.getElementById("message-input") as HTMLInputElement;
          const sendButton = this.shadowRoot?.getElementById("send-button") as HTMLButtonElement;
          if (messageInput) {
            messageInput.disabled = false;
            messageInput.placeholder = "Type your message…";
          }
          if (sendButton) {
            sendButton.disabled = !messageInput.value.trim();
          }
          
          // Clear the timeout since we got a response
          if ((this as any).restoreTimeoutId) {
            clearTimeout((this as any).restoreTimeoutId);
            (this as any).restoreTimeoutId = null;
          }
        });

        this.socket.on("sessionError", (error) => {
          console.error("❌ Session restoration error:", error);
          this.sessionRestored = true; // Prevent adding initial greeting
          this.sessionRestoreAttempts = 0; // Reset retry counter
          const overlay = this.shadowRoot?.getElementById('restore-loading-overlay');
          if (overlay) overlay.style.display = 'none';
          // Enable input and send to let user proceed anyway
          const messageInput = this.shadowRoot?.getElementById("message-input") as HTMLInputElement;
          const sendButton = this.shadowRoot?.getElementById("send-button") as HTMLButtonElement;
          if (messageInput) {
            messageInput.disabled = false;
            messageInput.placeholder = "Type your message…";
          }
          if (sendButton) {
            sendButton.disabled = !messageInput.value.trim();
          }
          
          // Clear the timeout since we got a response
          if ((this as any).restoreTimeoutId) {
            clearTimeout((this as any).restoreTimeoutId);
            (this as any).restoreTimeoutId = null;
          }
        });

        // Handle email sending responses
        this.socket.on("emailSent", (data) => {
          this.addMessage("✅ Chat transcript has been sent to your email!", true);
        });

        this.socket.on("emailError", (error) => {
          console.error("📧 Email sending failed:", error);
          this.addMessage("❌ Sorry, there was an error sending the email. Please try again.", true);
        });

        // Handle chat clearing responses
        this.socket.on("chatCleared", () => {
          // Clear messages from UI
          const messagesContainer = this.shadowRoot?.getElementById("messages-container");
          if (messagesContainer) {
            messagesContainer.innerHTML = `
              <div class="hero_heading">
                <img src="https://files-cdn.chatway.app/1GbfCaeyiIRtZI8wTQVCIDPmwTIwCtmDvXJTrasQ0bEtI1RU_88x88.jpg" alt="Andrist" class="center_img" />
                <h4 class="main_heading">${this.assistantName}</h4>
                <p class="main_para">joined</p>
              </div>
              <div class="date-separator">
                ${new Date().toLocaleDateString("en-US",{month:"long",day:"numeric"})}
              </div>
            `;
          }
          
          // Clear messages array
          this.messages = [];
          this.addMessage("Chat history has been cleared. How can I help you today?", true);
        });
      } catch (error) {
        console.error("Error connecting to WebSocket:", error);
        setTimeout(() => this.connectWebSocket(), 8000);
      }
    }

    private async fetchSessionViaREST() {
      try {
        const serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
          ? "http://localhost:5000" 
          : "https://portugalresidency-chatbot.onrender.com";
        const res = await fetch(`${serverUrl}/api/session/${this.sessionId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (json && json.success && !this.sessionRestored) {
          this.sessionRestored = true;
          const data = { sessionId: this.sessionId, messages: json.messages || [], sessionData: json.session };

          // Hide loading overlay
          const overlay = this.shadowRoot?.getElementById('restore-loading-overlay');
          if (overlay) overlay.style.display = 'none';
          
          // Enable inputs
          const messageInput = this.shadowRoot?.getElementById("message-input") as HTMLInputElement;
          const sendButton = this.shadowRoot?.getElementById("send-button") as HTMLButtonElement;
          if (messageInput && sendButton) {
            messageInput.disabled = false;
            sendButton.disabled = false;
          }

          // Hydrate UI similar to sessionRestored event
          if (data.messages && data.messages.length > 0) {
            this.messages = [];
            const messagesContainer = this.shadowRoot?.getElementById("messages-container");
            if (messagesContainer) {
              messagesContainer.innerHTML = `
                <div class="hero_heading">
                  <img src="https://files-cdn.chatway.app/1GbfCaeyiIRtZI8wTQVCIDPmwTIwCtmDvXJTrasQ0bEtI1RU_88x88.jpg" alt="Andrist" class="center_img" />
                  <h4 class="main_heading">${this.assistantName}</h4>
                  <p class="main_para">joined</p>
                </div>
                <div class="date-separator">
                  ${new Date().toLocaleDateString("en-US",{month:"long",day:"numeric"})}
                </div>
              `;
            }
            data.messages.forEach((msg: any) => {
              const isBot = msg.isBot === true || msg.isBot === "true";
              this.messages.push({ content: msg.content, isBot, timestamp: msg.timestamp || Date.now() });
              this.addMessage(msg.content, isBot, false, msg.timestamp);
            });
          }
        }
      } catch (err) {
        console.warn("REST fallback failed:", (err as Error).message);
      }
    }

    private async fetchAssistantName() {
      try {
        const serverUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
          ? "http://localhost:5000" 
          : "https://portugalresidency-chatbot.onrender.com";
        const res = await fetch(`${serverUrl}/api/assistant-info`);
        if (res.ok) {
          const data = await res.json();
          if (data.name) {
            this.assistantName = data.name.split(' - ')[0] || 'Sofia';
            
            // Update the assistant name in the UI
            const mainHeading = this.shadowRoot?.querySelector('.main_heading');
            if (mainHeading) {
              mainHeading.textContent = this.assistantName;
            }
            
            // Update avatar alt text
            const avatars = this.shadowRoot?.querySelectorAll('.avatar');
            if (avatars) {
              avatars.forEach(avatar => {
                avatar.setAttribute('alt', this.assistantName);
              });
            }
          }
        }
      } catch (error) {
        console.warn("Failed to fetch assistant name:", error);
      }
    }

    private showConnectivityBanner() {
      const banner = this.shadowRoot?.getElementById('connectivity-banner');
      if (banner) {
        banner.style.display = 'block';
      }
    }

    private hideConnectivityBanner() {
      const banner = this.shadowRoot?.getElementById('connectivity-banner');
      if (banner) {
        banner.style.display = 'none';
      }
    }

    private addMessage(content: string, isBot: boolean | string, addToMessagesArray: boolean = true, timestamp?: number) {
      // Convert string to boolean if needed
      const isBotMessage = isBot === true || isBot === "true";
      
      // Use provided timestamp or current time
      const messageTimestamp = timestamp || Date.now();
      
      const messagesContainer = this.shadowRoot!.getElementById(
        "messages-container"
      ) as HTMLElement;
      if (!messagesContainer) return;

      // Remove typing indicator along with its parent wrapper
      const existingIndicator = messagesContainer.querySelector(".typing");
      if (existingIndicator) {
        const parentWrapper = existingIndicator.closest(".message-wrapper");
        if (parentWrapper) {
          parentWrapper.remove();
        }
      }

      const messageWrapper = document.createElement("div");
      messageWrapper.className = `message-wrapper ${isBotMessage ? "" : "user"}`;

      if (isBotMessage) {
        const avatarImg = document.createElement("img");
        avatarImg.src =
          "https://files-cdn.chatway.app/1GbfCaeyiIRtZI8wTQVCIDPmwTIwCtmDvXJTrasQ0bEtI1RU_88x88.jpg";
        avatarImg.alt = this.assistantName;
        avatarImg.className = "avatar";
        messageWrapper.appendChild(avatarImg);
      }

      const messageContent = document.createElement("div");
      messageContent.className = "message-content";

      // Add message info for both bot and user messages
        const messageInfo = document.createElement("div");
        messageInfo.className = "message-info";
        messageInfo.innerHTML = `
        <span class="message-sender">${isBotMessage ? this.assistantName : 'You'}</span>
        <span class="message-time">${new Date(messageTimestamp).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}</span>
      `;
        messageContent.appendChild(messageInfo);

      const messageDiv = document.createElement("div");
      messageDiv.className = `message ${isBotMessage ? "bot" : "user"}`;
      const formattedContent = content
        .replace(/\n/g, "<br>") // Preserve line breaks
        .replace(/(\d+\.)\s/g, "<br><b>$1</b> ") // Format numbered points
        .replace(/- (.*?)\n/g, "<li>$1</li>") // Convert bullet points into list items
        .replace(/Estimated Cost:/g, "<b>Estimated Cost:</b>") // Bold key points
        .replace(/Timeline:/g, "<b>Timeline:</b>"); // Bold key points

      messageDiv.innerHTML = `<div class="chat-message-text">${formattedContent}</div>`;

      messageContent.appendChild(messageDiv);
      messageWrapper.appendChild(messageContent);
      messagesContainer.appendChild(messageWrapper);
      messagesContainer.scrollTo(0, messagesContainer.scrollHeight);
      this.setTypingIndicator(false);
      
      // Only add to messages array if requested (default true for new messages)
      if (addToMessagesArray) {
        this.messages.push({
          content: content,
          isBot: isBotMessage,
          timestamp: messageTimestamp
        });
      }
    }

    private setTypingIndicator(isTyping: boolean) {
      const messagesContainer = this.shadowRoot!.getElementById(
        "messages-container"
      ) as HTMLElement;
      if (!messagesContainer) return;

      const existingIndicator = messagesContainer.querySelector(".typing-indicator");

      // Clear any existing typing timeout
      if (this.typingTimeout) {
        clearTimeout(this.typingTimeout);
        this.typingTimeout = null;
      }

      if (isTyping && !existingIndicator) {
        const indicator = document.createElement("div");
        indicator.className = "message-wrapper typing-indicator";

        const avatarImg = document.createElement("img");
        avatarImg.src =
          "https://files-cdn.chatway.app/1GbfCaeyiIRtZI8wTQVCIDPmwTIwCtmDvXJTrasQ0bEtI1RU_88x88.jpg";
        avatarImg.alt = this.assistantName;
        avatarImg.className = "avatar";
        indicator.appendChild(avatarImg);

        const content = document.createElement("div");
        content.className = "message-content";
        content.innerHTML = `
        <div class="message-info">
        <span class="message-sender">${this.assistantName}</span>
        <span class="message-time">${new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}</span>
        </div>
        <div class="message bot typing">
        <div class="typing-dot" style="animation-delay: 0s;"></div>
        <div class="typing-dot" style="animation-delay: 0.15s;"></div>
        <div class="typing-dot" style="animation-delay: 0.3s;"></div>
        </div>
      `;

        indicator.appendChild(content);
        messagesContainer.appendChild(indicator);
        messagesContainer.scrollTo(0, messagesContainer.scrollHeight);
        
        // Auto-clear typing indicator after 30 seconds to prevent getting stuck
        this.typingTimeout = setTimeout(() => {
          this.setTypingIndicator(false);
        }, 30000);
        
      } else if (!isTyping && existingIndicator) {
        existingIndicator.remove();
      }
    }
  }

  if (!customElements.get(WC_TAG_NAME)) {
    customElements.define(WC_TAG_NAME, GreeterWidgetElement);
  }

  const componentInstance = document.createElement(WC_TAG_NAME);
  document.body.appendChild(componentInstance);
  return componentInstance;
}
