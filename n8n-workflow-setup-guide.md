# N8N Workflow Setup Guide - Portugal Residency PRO

## 🚨 **Issue Identified:**
The webhook is working perfectly (returns `{ message: 'Workflow was started' }`), but **the n8n workflow is not configured to send emails**.

## 🔧 **How to Fix the n8n Workflow:**

### **Step 1: Access n8n Dashboard**
1. Go to: `https://n8n.srv917741.hstgr.cloud`
2. Login to your n8n account
3. Find the workflow with webhook: `ac21fa0b-ad69-45bf-857b-4bce97ea14bd`

### **Step 2: Configure the Workflow**

#### **Current Workflow (Broken):**
```
[Webhook Trigger] → [Workflow Ends]
```

#### **Fixed Workflow (Working):**
```
[Webhook Trigger] → [Email Node] → [Workflow Ends]
```

### **Step 3: Add Email Node**

#### **Option A: Gmail Node (Recommended)**
1. **Add Gmail node** after the webhook trigger
2. **Configure Gmail credentials:**
   - **Email:** `ahmarjabbar7@gmail.com` (or your preferred sender email)
   - **App Password:** Your Gmail app password
3. **Map the fields:**
   - **To:** `{{ $json.to }}`
   - **Subject:** `{{ $json.subject }}`
   - **HTML Content:** `{{ $json.html }}`
   - **Text Content:** `{{ $json.text }}`

#### **Option B: SMTP Node**
1. **Add SMTP node** after the webhook trigger
2. **Configure SMTP settings:**
   - **Host:** `smtp.gmail.com`
   - **Port:** `587`
   - **Security:** `STARTTLS`
   - **Username:** `ahmarjabbar7@gmail.com`
   - **Password:** Your Gmail app password
3. **Map the fields:**
   - **From:** `{{ $json.from }}`
   - **To:** `{{ $json.to }}`
   - **Subject:** `{{ $json.subject }}`
   - **HTML Content:** `{{ $json.html }}`
   - **Text Content:** `{{ $json.text }}`

#### **Option C: Generic Email Service**
1. **Add HTTP Request node** after the webhook trigger
2. **Configure to use email service API** (SendGrid, Mailgun, etc.)

### **Step 4: Test the Workflow**

#### **Test Data Structure:**
```json
{
  "from": "ahmarjabbar7@gmail.com",
  "to": "ahmarjabbar7@gmail.com",
  "subject": "Test Email",
  "text": "Test email content",
  "html": "<h2>Test Email</h2><p>Test email content</p>"
}
```

#### **Expected Flow:**
1. **Webhook receives data** ✅
2. **Email node processes data** ✅
3. **Email is sent** ✅
4. **You receive email** ✅

## 🔍 **Debugging Steps:**

### **1. Check Workflow Execution**
- Go to **Executions** tab in n8n
- Look for recent executions
- Check if email node is executed successfully

### **2. Check Email Node Configuration**
- Verify email credentials are correct
- Ensure field mappings are proper
- Check for any error messages

### **3. Test with Simple Data**
```json
{
  "to": "ahmarjabbar7@gmail.com",
  "subject": "Simple Test",
  "text": "This is a simple test email"
}
```

## 📧 **Alternative Solutions:**

### **Option 1: Use Different Email Service**
If Gmail is having issues, try:
- **SendGrid**
- **Mailgun** 
- **Amazon SES**
- **Outlook/Hotmail SMTP**

### **Option 2: Use n8n Email Template**
1. **Add Email node**
2. **Use n8n's built-in email templates**
3. **Configure with your email provider**

### **Option 3: Create New Webhook**
If the current workflow is too complex:
1. **Create new webhook**
2. **Build simple workflow:** Webhook → Email
3. **Update your chatbot** to use new webhook URL

## ✅ **Expected Results After Fix:**

### **Logs You'll See:**
```
🔗 [2/2] Trying Webhook fallback
📤 Sending webhook request with data: {...}
✅ SUCCESS! Email sent via Webhook to: user@example.com
📬 Webhook response: { message: 'Workflow was started' }
📧 EMAIL RECEIVED! ✅
```

### **What Will Happen:**
1. ✅ **Webhook receives data** (already working)
2. ✅ **Email node processes data** (needs configuration)
3. ✅ **Email is sent** (will work after configuration)
4. ✅ **User receives email** (will work after configuration)

## 🚀 **Quick Test:**

After configuring the email node, test with:
```bash
curl -X POST https://n8n.srv917741.hstgr.cloud/webhook/ac21fa0b-ad69-45bf-857b-4bce97ea14bd \
  -H "Content-Type: application/json" \
  -d '{
    "from": "ahmarjabbar7@gmail.com",
    "to": "ahmarjabbar7@gmail.com",
    "subject": "Test Email After Configuration",
    "text": "This should work after configuring the email node!"
  }'
```

**The webhook is working perfectly - you just need to configure the email node in the n8n workflow!** 📧✨
