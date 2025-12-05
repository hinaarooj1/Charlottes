# WordPress Integration Guide for Portugal Residency PRO Chatbot

## 🎯 Adding Sofia to Your WordPress Site

### Method 1: Add to Footer (Recommended)

#### Step 1: Access WordPress Admin
1. Go to your WordPress admin panel
2. Navigate to **Appearance > Theme Editor**
3. Select **footer.php** from the file list

#### Step 2: Add Integration Code
Add this code just **before** the closing `</body>` tag:

```html
<!-- Portugal Residency PRO Chatbot -->
<script defer src="https://charlottes.onrender.com/themes/w/widget.min.js"></script>
<div id="portugal-residency-chatbot-widget"></div>
<script>
  window.onload = () => {
    widget = window.GreeterWidget("6347b4e595cf065c9388f4ab");
  };
</script>
<!-- End Portugal Residency PRO Chatbot -->
```

#### Step 3: Save Changes
Click **Update File** to save your changes.

---

### Method 2: Add to Header

#### Step 1: Access Header File
1. Go to **Appearance > Theme Editor**
2. Select **header.php**

#### Step 2: Add Integration Code
Add the same code just **before** the closing `</head>` tag:

```html
<!-- Portugal Residency PRO Chatbot -->
<script defer src="https://charlottes.onrender.com/themes/w/widget.min.js"></script>
<script>
  window.onload = () => {
    widget = window.GreeterWidget("6347b4e595cf065c9388f4ab");
  };
</script>
<!-- End Portugal Residency PRO Chatbot -->
```

Then add the widget container anywhere you want it to appear:

```html
<div id="portugal-residency-chatbot-widget"></div>
```

---

### Method 3: Using WordPress Plugins

#### Option A: Insert Headers and Footers Plugin
1. Install **"Insert Headers and Footers"** plugin
2. Go to **Settings > Insert Headers and Footers**
3. Add the code to **"Scripts in Footer"** section

#### Option B: Custom HTML Widget
1. Go to **Appearance > Widgets**
2. Add **"Custom HTML"** widget
3. Paste the integration code

---

## 🎨 Customization Options

### Change Widget Position
Add CSS to position the widget:

```css
<style>
#portugal-residency-chatbot-widget {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 9999;
}
</style>
```

### Hide on Specific Pages
Add this condition to hide on certain pages:

```php
<?php if (!is_page('contact') && !is_page('about')): ?>
<!-- Portugal Residency PRO Chatbot -->
<script defer src="https://charlottes.onrender.com/themes/w/widget.min.js"></script>
<div id="portugal-residency-chatbot-widget"></div>
<script>
  window.onload = () => {
    widget = window.GreeterWidget("6347b4e595cf065c9388f4ab");
  };
</script>
<!-- End Portugal Residency PRO Chatbot -->
<?php endif; ?>
```

---

## 🔧 Troubleshooting

### If Widget Doesn't Appear:
1. **Check browser console** for JavaScript errors
2. **Clear cache** (if using caching plugins)
3. **Test in incognito mode**
4. **Verify widget URL** is accessible: https://charlottes.onrender.com/themes/w/widget.min.js

### Common Issues:
- **Conflicting JavaScript**: Disable other chat plugins temporarily
- **Theme conflicts**: Try different integration methods
- **Caching**: Clear all caches after adding code

---

## 📱 Mobile Optimization

The widget is automatically responsive, but you can add mobile-specific styling:

```css
<style>
@media (max-width: 768px) {
  #portugal-residency-chatbot-widget {
    bottom: 10px;
    right: 10px;
  }
}
</style>
```

---

## 🎯 Final Result

After integration, visitors to your WordPress site will see:
- ✅ **Sofia chat widget** in bottom-right corner
- ✅ **Portugal Golden Visa expertise** 
- ✅ **Email collection** for lead generation
- ✅ **Professional branding** with Portugal colors

---

## 📞 Support

If you need help with integration:
- **Email**: Herringtonconsulting@gmail.com
- **Phone**: (234) 109-6666
- **Website**: https://portugalresidency.pro/

**Sofia is ready to help your visitors with Portugal Golden Visa inquiries!** 🇵🇹✨
