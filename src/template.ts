export function createTemplate(WidgetData: any) {
  const template = document.createElement("template");
  const THEME_COLOR = "#C1272D"; // Portugal Residency PRO red
  const THEME_COLOR_HOVER = "#C1272D";
  const WIDGET_WIDTH = "380px";
  const WIDGET_HEIGHT = "600px";

  // Sofia's avatar using the provided URL
  const Sofia_AVATAR = `
    <img 
      src="https://files-cdn.chatway.app/1GbfCaeyiIRtZI8wTQVCIDPmwTIwCtmDvXJTrasQ0bEtI1RU_88x88.jpg" 
      alt="Sofia" 
      class="avatar"
    />
  `;

  template.innerHTML = `
    <style>

#messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #ffffff;
      }

      .bot-sender {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }

      .bot-sender .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
      }

      .sender-info {
        display: flex;
        flex-direction: column;
      }

      .sender-name {
        font-weight: 500;
        font-size: 13px;
        color: #666;
      }

      .sender-time {
        font-size: 12px;
        color: #888;
      }

      .message {
        max-width: 80%;
        padding: 12px 16px;
        border-radius: 15px;
        font-size: 14px;
        line-height: 1.5;
      }

      .message.bot {
        background: #f0f0f0;
        border-bottom-left-radius: 5px;
        color: #000000;
        align-self: flex-start;
      }

      .message.user {
        background: ${THEME_COLOR};
        border-bottom-right-radius: 5px;
        color: #ffffff;
        align-self: flex-end;
      }

      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
      }
      #widget-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: ${WIDGET_WIDTH};
        height: ${WIDGET_HEIGHT};
        background: white;
        border-radius: 16px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: system-ui, -apple-system, sans-serif;
        z-index: 99999;
      }

      #widget-header {
        background: ${THEME_COLOR};
        padding: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        height: 24px;
      }

      .header-main {
        display: flex;
        align-items: center;
        width: 100%;
      }

      #widget-title {
        flex: 1;
        font-size: 15px;
        font-weight: 500;
        color: #000000;
        margin-left: 6px;
      }

      .chat-widget-status {
        display: inline-block;
        width: 8px;
        height: 8px;
        background: #C1272D;
        border-radius: 50%;
      }

      #close-button {
        background: transparent;
        border: none;
        cursor: pointer;
        padding: 4px;
        color: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        transition: background-color 0.2s;
      }

      #close-button:hover {
        background: rgba(0, 0, 0, 0.1);
      }

      #messages-container {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: #ffffff;
      }

      .message-wrapper {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        max-width: 85%;
      }

      .message-wrapper.user {
        flex-direction: row-reverse;
        align-self: flex-end;
      }

      .avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
      }

      .message-content {
        display: flex;
        flex-direction: column;
      }

      .message {
        padding: 12px 16px;
        position: relative;
        font-size: 14px;
        line-height: 1.5;
      }

      .message.bot {
        background: #f0f0f0;
        border-radius: 15px;
        border-bottom-left-radius: 5px;
        color: #000000;
      }

      .message.user {
        align-self: flex-end;
        background: ${THEME_COLOR};
        border-radius: 15px;
        border-bottom-right-radius: 5px;
        color: #ffffff;
      }

      .message-info {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 4px;
      }

      .message-sender {
        font-weight: 500;
        font-size: 13px;
        color: #333333;
      }

      .message-time {
        font-size: 12px;
        color: #888;
      }

      .message.error {
        align-self: center;
        background: #C1272D;
        color: #ffffff;
        font-size: 14px;
        border-radius: 8px;
      }

      .message.bot.typing {
        background: #f0f0f0;
        display: flex;
        gap: 4px;
        padding: 12px 16px;
        width: fit-content;
      }

      .typing-dot {
        width: 6px;
        height: 6px;
        background: #666;
        border-radius: 50%;
        animation: typing-bounce 0.8s infinite;
      }

      @keyframes typing-bounce {
        0%, 100% {
          transform: translateY(0);
          opacity: 0.5;
        }
        50% {
          transform: translateY(-4px);
          opacity: 1;
        }
      }

      #input-container {
        padding: 16px;
        border-top: 1px solid #e5e5e5;
        display: flex;
        gap: 12px;
        background: #ffffff;
      }

      #message-input {
        flex: 1;
        padding: 12px 16px;
        border: 1px solid #e5e5e5;
        border-radius: 24px;
        outline: none;
        font-size: 14px;
        resize: none;
        transition: border-color 0.2s;
      }

      #message-input:focus {
        border-color: ${THEME_COLOR};
      }

      #send-button {
        background: ${THEME_COLOR};
        border: none;
        padding: 10px;
        border-radius: 50%;
        cursor: pointer;
        color: #ffffff;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        transition: background-color 0.2s;
        -webkit-tap-highlight-color: transparent;
        touch-action: manipulation;
      }

      #send-button:hover {
        background: ${THEME_COLOR_HOVER};
      }

      #send-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      /* Mobile optimizations */
      @media (max-width: 768px) {
        #send-button {
          min-width: 44px;
          min-height: 44px;
          padding: 12px;
        }
        
        #message-input {
          font-size: 16px; /* Prevents zoom on iOS */
          padding: 14px 16px;
        }
        
        #input-container {
          padding: 12px;
          gap: 8px;
        }
      }

      #toggle-button {
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: ${THEME_COLOR};
        border: none;
        width: 56px;
        height: 56px;
        border-radius: 50%;
        cursor: pointer;
        color: #ffffff;
        display: none;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: transform 0.2s, background-color 0.2s;
      }

      #toggle-button:hover {
        background: ${THEME_COLOR_HOVER};
        transform: scale(1.05);
      }

      #messages-container::-webkit-scrollbar {
        width: 6px;
      }

      #messages-container::-webkit-scrollbar-track {
        background: transparent;
      }

      #messages-container::-webkit-scrollbar-thumb {
        background: #e0e0e0;
        border-radius: 3px;
      }

      #messages-container::-webkit-scrollbar-thumb:hover {
        background: #cccccc;
      }
      .hero_heading {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin: 5px 0 10px;
      }
      .hero_heading img {
      width: 60px;
      height: 60px;
      border-radius: 100%;
      }
      .hero_heading h4 {
      font-size: 22px;
      font-weight: 400;
      margin: 5px 0 0;
      font-family: 'Poppins', sans-serif;
      }
      .hero_heading p {
      font-size: 16px;
      margin: 3px 0 0;
      font-family: 'Poppins', sans-serif;
      color: #777777;
      }

           .date-separator {
        text-align: center;
        color: #888;
        font-size: 12px;
        margin: 16px 0;
        position: relative;
      }

      .date-separator::before,
      .date-separator::after {
        content: '';
        position: absolute;
        top: 50%;
        width: 40%;
        height: 1px;
        background-color: #e0e0e0;
      }

      .date-separator::before {
        left: 0;
      }

      .date-separator::after {
        right: 0;
      }

    </style>

    <button id="toggle-button">
      <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
      </svg>
    </button>

    <div id="widget-container">
      <div id="widget-header">
        <div class="header-main">
          <span class="chat-widget-status"></span>
          <h3 id="widget-title">Message us</h3>
          <button id="close-button">✕</button>
        </div>
      </div>

 <div id="messages-container">
        <div class="hero_heading">
        <img src="https://files-cdn.chatway.app/1GbfCaeyiIRtZI8wTQVCIDPmwTIwCtmDvXJTrasQ0bEtI1RU_88x88.jpg" alt="Sofia" class="center_img" />
        <h4 class="main_heading">Sofia</h4>
        <p class="main_para">joined</p>
        </div>

<div class="date-separator">
  ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}
</div>


      </div>

      <div id="input-container">
        <input type="text" id="message-input" placeholder="Type your message..." />
        <button id="send-button" disabled>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"/>
          </svg>
        </button>
      </div>
    </div>
  `;
  template.innerHTML = template.innerHTML.replace(
    `<div class="message-wrapper">
          ${Sofia_AVATAR}
          <div class="message-content">
            <div class="message-info">
              <span class="message-sender">Ai assistant</span>
              <span class="message-time">${new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}</span>
            </div>
            <div class="message bot">
              Wait, don't leave! I'd LOVE to help you find what you are looking for.
            </div>
          </div>
        </div>`,
    ``
  );

  return template;
}
