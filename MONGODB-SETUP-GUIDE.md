# MongoDB Setup Guide for Portugal Residency Chatbot

## Option 1: MongoDB Atlas (Recommended for Production)

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account
3. Create a new cluster (M0 Sandbox is free)

### Step 2: Configure Database Access
1. Go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Create a username and password
4. Set permissions to "Read and write to any database"

### Step 3: Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. Add `0.0.0.0/0` to allow access from anywhere (for Render deployment)
4. Or add specific Render IP ranges for better security

### Step 4: Get Connection String
1. Go to "Clusters" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `portugal-chatbot`

### Step 5: Add to Environment Variables
Add to your `.env` file or Render environment variables:

```bash
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portugal-chatbot?retryWrites=true&w=majority
```

## Option 2: Render MongoDB Addon

### Step 1: Add MongoDB to Render
1. Go to your Render dashboard
2. Click on your service
3. Go to "Add-ons" tab
4. Search for "MongoDB"
5. Add the MongoDB addon

### Step 2: Get Connection String
1. After adding the addon, go to the MongoDB addon dashboard
2. Copy the connection string
3. Add it to your environment variables

## Option 3: Local Development

### For Local Development Only
```bash
# Install MongoDB locally
# On Windows: Download from https://www.mongodb.com/try/download/community
# On Mac: brew install mongodb-community
# On Linux: sudo apt-get install mongodb

# Start MongoDB
mongod

# Set environment variable
MONGODB_URI=mongodb://localhost:27017/portugal-chatbot
```

## Environment Variables

Add these to your `.env` file:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/portugal-chatbot?retryWrites=true&w=majority

# Database Configuration
DB_NAME=portugal-chatbot
DB_CLEANUP_INTERVAL=3600000

# Analytics Configuration
ANALYTICS_ENABLED=true
SESSION_TIMEOUT=3600000
```

## Fallback Behavior

If MongoDB is not available, the application will:
- ✅ Continue working with in-memory storage
- ✅ Log warnings about database connection
- ✅ Fall back to original storage.js for messages
- ✅ Still provide all chat functionality
- ❌ No session persistence across restarts
- ❌ No analytics tracking
- ❌ No transcript features

## Testing Database Connection

The application will log:
- ✅ `MongoDB connected successfully` - Database working
- ⚠️ `Database connection failed, falling back to in-memory storage` - Using fallback
- 📝 `Database not connected, skipping operation` - Individual operations skipped

## Production Recommendations

1. **Use MongoDB Atlas** for production deployments
2. **Set up proper indexes** for performance
3. **Configure TTL** for automatic cleanup
4. **Monitor connection limits** and usage
5. **Set up backups** for data protection

## Troubleshooting

### Connection Refused Error
```
MongoServerSelectionError: connect ECONNREFUSED
```
**Solution**: Check your MONGODB_URI and network access settings

### Authentication Failed
```
MongoServerError: Authentication failed
```
**Solution**: Verify username/password in connection string

### Network Access Denied
```
MongoServerError: not authorized on database
```
**Solution**: Add your IP address to MongoDB Atlas network access list

### Render Deployment Issues
- Ensure MONGODB_URI is set in Render environment variables
- Check that the connection string is correct
- Verify network access allows Render's IP ranges
