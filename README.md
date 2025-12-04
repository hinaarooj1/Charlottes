# Portugal Residency PRO: AI-Powered Customer Support Chat Widget

A web-based AI chatbot widget that can be embedded into websites to provide automated customer support for Portugal's Golden Visa program and residency by investment services with email transcript functionality.

## 🚀 Features

- **AI-Powered Chat**: Uses OpenAI Assistant API for intelligent responses
- **Dynamic Email System**: Automatically extracts user emails from chat and sends transcripts
- **Real-time Communication**: WebSocket-based chat with typing indicators
- **Responsive Widget**: Modern, mobile-friendly chat interface
- **Email Transcripts**: Automatic email sending when chat sessions end
- **Lead Generation**: Collects user contact information during conversations

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- OpenAI API key
- Gmail account for email sending (optional - webhook fallback available)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd FIN-AGENT-main
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the server** (Choose one method):

   **Option A: Using startup scripts (Recommended)**
   ```bash
   # Windows Command Prompt
   npm run start:win
   
   # PowerShell
   npm run start:ps
   ```

   **Option B: Manual environment setup**
   ```bash
   # Set environment variables manually
   $env:OPENAI_API_KEY="your-openai-api-key"
   $env:ASSISTANT_ID="your-assistant-id"
   $env:EMAIL_USER="your-email@gmail.com"
   $env:EMAIL_PASSWORD="your-app-password"
   
   # Start server
   npm run dev
   ```

4. **Access the widget**
   - Open your browser to `http://localhost:5000`
   - The chat widget will be available for testing

## 📧 Email System

The system automatically:
- **Extracts emails** from user messages in the chat
- **Validates email format** before using
- **Sends transcripts** to the user's email when they close the chat
- **Falls back to webhook** if Gmail SMTP fails

### Email Configuration

Update the `.env` file or use the startup scripts to set:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TO=default-recipient@gmail.com
WEBHOOK_URL=your-webhook-url
```

## 🎯 Usage

### For Website Integration

The widget can be embedded in any website:

```html
<!DOCTYPE html>
<html>
<head>
    <script defer src="widget.js"></script>
</head>
<body>
    <div id="portugal-residency-chatbot-widget"></div>
    <script>
        window.onload = () => {
            widget = window.GreeterWidget("your-widget-id");
        };
    </script>
</body>
</html>
```

### Chat Flow

1. User opens the chat widget
2. AI assistant asks for contact information
3. User provides email/name during conversation
4. System extracts and validates email
5. When user closes chat, transcript is sent to their email

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | ✅ |
| `ASSISTANT_ID` | OpenAI Assistant ID | ✅ |
| `EMAIL_USER` | Gmail username | ✅ |
| `EMAIL_PASSWORD` | Gmail app password | ✅ |
| `EMAIL_FROM` | Sender email address | ✅ |
| `EMAIL_TO` | Default recipient email | ✅ |
| `WEBHOOK_URL` | Webhook for email fallback | ✅ |
| `NODE_PORT` | Server port (default: 5000) | ❌ |

### AI Assistant Setup

1. Create an OpenAI Assistant in the OpenAI dashboard
2. Configure the assistant to ask for user contact information
3. Update `ASSISTANT_ID` in your environment variables

## 🧪 Testing

The system includes comprehensive email testing:
- Email extraction from chat messages
- Dynamic email routing
- Webhook fallback functionality
- Email validation

## 🚨 Troubleshooting

### Environment Variables Not Loading
- Use the provided startup scripts (`start.bat` or `start.ps1`)
- Ensure `.env` file is in the project root
- Check file encoding (should be UTF-8)

### Gmail Authentication Issues
- Use App Passwords instead of regular passwords
- Enable 2-factor authentication
- The system will automatically fall back to webhook if Gmail fails

### Server Not Starting
- Check if port 5000 is available
- Verify all environment variables are set
- Check Node.js version compatibility

## 📝 API Endpoints

- `GET /` - Main widget page
- `WebSocket /socket.io` - Real-time chat communication

## 🔒 Security

- All secrets are stored in environment variables
- `.env` file is gitignored
- Gmail credentials use app passwords
- CORS is configurable for production

## 📄 License

ISC License

---

**Need help?** Check the troubleshooting section or create an issue in the repository.

