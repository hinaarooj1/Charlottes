# Render Deployment Fix

## Issue
Render was running `server-production.js` which had old bugs. Now using `server.js` which has all the latest fixes.

## Solution

### Step 1: Updated package.json
✅ **FIXED**: Updated `package.json` to use `server.js` for production:
```json
"scripts": {
  "start": "node server.js",  // Now uses server.js instead of server-production.js
  "dev": "node server.js"
}
```

### Step 2: Deploy to Render
1. Go to https://dashboard.render.com
2. Select your service: **portugal-residency-widget**
3. Click **Manual Deploy** → **Deploy latest commit**
4. Or just push to git:
   ```bash
   git add .
   git commit -m "Switch to server.js for production"
   git push
   ```

### Step 2: Verify Environment Variables
Make sure these are set in Render dashboard:
- `PORT` = `10000`
- `NODE_ENV` = `production`
- `OPENAI_API_KEY` = (your OpenAI API key)
- `ASSISTANT_ID` = `asst_U1evpT53Ps0e3awBBi8JuAF3`
- `EMAIL_USER` = `Herringtonconsulting@gmail.com`
- `EMAIL_PASSWORD` = (your Gmail app password)
- `EMAIL_FROM` = `Herringtonconsulting@gmail.com`
- `EMAIL_TO` = `Herringtonconsulting@gmail.com`
- `SOCKET_CORS_ORIGIN` = `https://portugalresidency.pro`

### Step 3: Build Widget (Optional)
If you want to update the widget, run locally:
```bash
npm run build
```
This will generate `themes/w/widget.min.js`

Then commit and push:
```bash
git add themes/w/widget.min.js
git commit -m "Update widget with latest fixes"
git push
```

## What's Different Between Dev and Production?

### Development (`npm run dev`)
- Runs `server.js`
- Includes webpack-dev-server
- Binds to `localhost:5000`
- Hot module replacement
- **NOT suitable for Render**

### Production (`npm start`)
- Runs `server-production.js`
- No webpack-dev-server
- Binds to `0.0.0.0:PORT` (required for Render)
- Serves pre-built widget from `themes/w/widget.min.js`
- **Correct for Render**

## Recent Fixes Applied
✅ Fixed `io is not defined` error in `broadcastToSession`
✅ Fixed `apiTimeout is not defined` error
✅ Fixed JSON parsing error in client
✅ Fixed message attribution (user vs bot)
✅ Fixed session persistence
✅ Increased connection limit to 50 per IP
✅ Added connection cleanup

## Testing After Deployment
1. Visit: https://charlottes.onrender.com
2. Open browser console (F12)
3. Send a message
4. Check for:
   - ✅ Initial greeting appears
   - ✅ Bot responds to your message
   - ✅ No errors in console
   - ✅ Session persists on refresh

## Troubleshooting

### If still seeing "No open ports detected"
1. Check Start Command is `npm start` (not `npm run dev`)
2. Verify `PORT` environment variable is set to `10000`
3. Check build logs for errors
4. Try **Clear build cache & deploy**

### If bot not responding
1. Check OpenAI API key is valid
2. Check OpenAI account has credits
3. Check Assistant ID is correct
4. View logs in Render dashboard

### If email not working
1. Check Gmail app password is correct
2. Check 2FA is enabled on Gmail account
3. Check "Less secure app access" is enabled (if needed)
4. Test SMTP connection in logs

