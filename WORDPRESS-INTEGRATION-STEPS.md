# 🚀 WordPress Integration Guide - Step by Step

## 📋 Quick Summary

You need to add the chatbot widget code to your WordPress site. The widget file is already hosted at `https://charlottes.onrender.com/themes/w/widget.min.js`, so you **don't need to upload any files** - just add the code!

---

## ✅ Method 1: Using WordPress File Manager (Easiest)

### Step 1: Find Your Widget ID
Replace `"YOUR_WIDGET_ID"` with any unique identifier. You can use:
- `"6347b4e595cf065c9388f4ab"` (from your codebase)
- Or any unique string like `"my-chatbot-2024"`

### Step 2: Access Your WordPress Theme Files
1. Log into your WordPress admin panel
2. Go to **Appearance → Theme File Editor** (or use File Manager in cPanel)
3. Select **footer.php** from the file list on the right

### Step 3: Add the Integration Code
Scroll to the bottom of `footer.php` and find the closing `</body>` tag. Add this code **just before** `</body>`:

```html
<!-- Chatbot Widget -->
<script defer src="https://charlottes.onrender.com/themes/w/widget.min.js"></script>
<div id="portugal-residency-chatbot-widget"></div>
<script>
  window.onload = () => {
    widget = window.GreeterWidget("6347b4e595cf065c9388f4ab");
  };
</script>
<!-- End Chatbot Widget -->
```

**Important:** Replace `"6347b4e595cf065c9388f4ab"` with your actual widget ID if you have one, or keep it as is.

### Step 4: Save Changes
Click **Update File** or **Save** to save your changes.

---

## ✅ Method 2: Using "Insert Headers and Footers" Plugin (Recommended for Beginners)

This method is safer and doesn't require editing theme files directly.

### Step 1: Install Plugin
1. Go to **Plugins → Add New**
2. Search for **"Insert Headers and Footers"**
3. Install and activate it

### Step 2: Add Code
1. Go to **Settings → Insert Headers and Footers**
2. Paste this code in the **"Scripts in Footer"** section:

```html
<!-- Chatbot Widget -->
<script defer src="https://charlottes.onrender.com/themes/w/widget.min.js"></script>
<div id="portugal-residency-chatbot-widget"></div>
<script>
  window.onload = () => {
    widget = window.GreeterWidget("6347b4e595cf065c9388f4ab");
  };
</script>
<!-- End Chatbot Widget -->
```

3. Click **Save**

---

## ✅ Method 3: Using Custom HTML Widget

### Step 1: Add Widget
1. Go to **Appearance → Widgets**
2. Add a **"Custom HTML"** widget to your footer or sidebar
3. Paste the integration code above
4. Save

---

## 🎨 Optional: Customize Widget Position

If you want to change where the widget appears, add this CSS to your theme's `style.css` or in **Appearance → Customize → Additional CSS**:

```css
#portugal-residency-chatbot-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}

/* Mobile optimization */
@media (max-width: 768px) {
  #portugal-residency-chatbot-widget {
    bottom: 10px;
    right: 10px;
  }
}
```

---

## 🧪 Testing

After adding the code:

1. **Clear your cache** (if using caching plugins like WP Super Cache, W3 Total Cache, etc.)
2. **Visit your website** in an incognito/private browser window
3. **Look for the chat widget** in the bottom-right corner
4. **Click it** to test the chat functionality

---

## 🔧 Troubleshooting

### Widget doesn't appear?
1. **Check browser console** (F12 → Console tab) for JavaScript errors
2. **Clear all caches:**
   - WordPress cache plugins
   - Browser cache (Ctrl+Shift+Delete)
   - CDN cache (if using Cloudflare)
3. **Test in incognito mode** to rule out browser extensions
4. **Verify the widget URL** is accessible:
   - Visit: `https://charlottes.onrender.com/themes/w/widget.min.js`
   - You should see JavaScript code (not an error page)

### Widget appears but doesn't connect?
1. **Check your server** is running at `https://charlottes.onrender.com`
2. **Verify WebSocket connections** are allowed (not blocked by firewall)
3. **Check browser console** for connection errors

### Still not working?
- Make sure you're using the correct widget ID
- Ensure your WordPress theme supports custom scripts
- Try a different integration method (Method 2 is usually most reliable)

---

## 📝 Complete Integration Code (Copy & Paste Ready)

```html
<!-- Chatbot Widget -->
<script defer src="https://charlottes.onrender.com/themes/w/widget.min.js"></script>
<div id="portugal-residency-chatbot-widget"></div>
<script>
  window.onload = () => {
    widget = window.GreeterWidget("6347b4e595cf065c9388f4ab");
  };
</script>
<!-- End Chatbot Widget -->
```

**Note:** Replace `"6347b4e595cf065c9388f4ab"` with your actual widget ID if different.

---

## ✅ What You'll See After Integration

- ✅ Chat widget button in bottom-right corner
- ✅ Clicking opens the chat interface
- ✅ AI assistant responds based on your OpenAI Assistant configuration
- ✅ Chat transcripts sent via email when session ends

---

## 🎯 Next Steps

1. ✅ Add the code using one of the methods above
2. ✅ Test the widget on your site
3. ✅ Customize the assistant's name/instructions in your OpenAI Assistant dashboard
4. ✅ Monitor chat conversations and email transcripts

---

## 📞 Need Help?

If you encounter issues:
- Check the browser console for errors
- Verify your server is running
- Make sure all environment variables are set correctly
- Test the widget URL directly in your browser

**Your chatbot is ready to help visitors! 🚀**

