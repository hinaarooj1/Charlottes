const { MongoClient } = require('mongodb');

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/portugal-chatbot';
      
      // Check if we're in production and no MongoDB URI is set
      if (process.env.NODE_ENV === 'production' && !process.env.MONGODB_URI) {
        console.warn('⚠️  No MONGODB_URI set in production. Using in-memory storage.');
        this.isConnected = false;
        return false;
      }
      
      this.client = new MongoClient(mongoUrl);
      await this.client.connect();
      this.db = this.client.db();
      this.isConnected = true;
      
      // Create indexes for better performance
      await this.createIndexes();
      
      console.log('✅ MongoDB connected successfully');
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      console.warn('⚠️  Falling back to in-memory storage');
      this.isConnected = false;
      return false;
    }
  }

  // Helper method to check if database is connected
  _checkConnection() {
    if (!this.isConnected) {
      console.log('📝 Database not connected, skipping operation');
      return false;
    }
    return true;
  }

  async createIndexes() {
    if (!this._checkConnection()) return;
    
    try {
      // Sessions collection indexes
      await this.db.collection('sessions').createIndex({ sessionId: 1 }, { unique: true });
      await this.db.collection('sessions').createIndex({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // 24 hours TTL
      await this.db.collection('sessions').createIndex({ userIP: 1 });
      await this.db.collection('sessions').createIndex({ isActive: 1 });

      // Messages collection indexes
      await this.db.collection('messages').createIndex({ sessionId: 1 });
      await this.db.collection('messages').createIndex({ timestamp: 1 });
      await this.db.collection('messages').createIndex({ isBot: 1 });

      // Connections collection indexes
      await this.db.collection('connections').createIndex({ socketId: 1 }, { unique: true });
      await this.db.collection('connections').createIndex({ sessionId: 1 });
      await this.db.collection('connections').createIndex({ userIP: 1 });
      await this.db.collection('connections').createIndex({ connectedAt: 1 }, { expireAfterSeconds: 3600 }); // 1 hour TTL

      // Analytics collection indexes
      await this.db.collection('analytics').createIndex({ sessionId: 1 });
      await this.db.collection('analytics').createIndex({ eventType: 1 });
      await this.db.collection('analytics').createIndex({ timestamp: 1 });

      console.log('✅ Database indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
    }
  }

  // Session operations
  async createSession(sessionData) {
    if (!this._checkConnection()) return sessionData;
    
    try {
      const session = {
        sessionId: sessionData.sessionId,
        messages: sessionData.messages || [],
        createdAt: new Date(),
        lastActivity: new Date(),
        userIP: sessionData.userIP,
        userAgent: sessionData.userAgent,
        referrer: sessionData.referrer,
        url: sessionData.url,
        isActive: true,
        socketIds: sessionData.socketIds || [],
        messageCount: sessionData.messageCount || 0,
        hasUserEmail: sessionData.hasUserEmail || false,
        userEmail: sessionData.userEmail || null,
        threadId: sessionData.threadId || null
      };

      await this.db.collection('sessions').insertOne(session);
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async getSession(sessionId) {
    if (!this._checkConnection()) return null;
    
    try {
      return await this.db.collection('sessions').findOne({ sessionId });
    } catch (error) {
      console.error('Error getting session:', error);
      throw error;
    }
  }

  async updateSession(sessionId, updateData) {
    try {
      const update = {
        ...updateData,
        lastActivity: new Date()
      };
      
      return await this.db.collection('sessions').updateOne(
        { sessionId },
        { $set: update }
      );
    } catch (error) {
      console.error('Error updating session:', error);
      throw error;
    }
  }

  async deleteSession(sessionId) {
    try {
      return await this.db.collection('sessions').deleteOne({ sessionId });
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  // Message operations
  async createMessage(messageData) {
    try {
      const message = {
        ...messageData,
        timestamp: new Date(),
        id: require('crypto').randomUUID()
      };

      await this.db.collection('messages').insertOne(message);
      return message;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async getMessagesBySession(sessionId) {
    try {
      return await this.db.collection('messages')
        .find({ sessionId })
        .sort({ timestamp: 1 })
        .toArray();
    } catch (error) {
      console.error('Error getting messages by session:', error);
      throw error;
    }
  }

  // Connection operations
  async createConnection(connectionData) {
    if (!this._checkConnection()) return connectionData;
    
    try {
      const connection = {
        socketId: connectionData.socketId,
        sessionId: connectionData.sessionId,
        userIP: connectionData.userIP,
        userAgent: connectionData.userAgent,
        connectedAt: new Date(),
        lastPing: new Date(),
        isActive: true
      };

      // Use upsert to handle duplicate socket IDs
      await this.db.collection('connections').updateOne(
        { socketId: connectionData.socketId },
        { $set: connection },
        { upsert: true }
      );
      return connection;
    } catch (error) {
      console.error('Error creating connection:', error);
      throw error;
    }
  }

  async getConnectionsBySession(sessionId) {
    try {
      return await this.db.collection('connections')
        .find({ sessionId, isActive: true })
        .toArray();
    } catch (error) {
      console.error('Error getting connections by session:', error);
      throw error;
    }
  }

  async updateConnection(socketId, updateData) {
    try {
      return await this.db.collection('connections').updateOne(
        { socketId },
        { $set: { ...updateData, lastPing: new Date() } }
      );
    } catch (error) {
      console.error('Error updating connection:', error);
      throw error;
    }
  }

  async deleteConnection(socketId) {
    try {
      return await this.db.collection('connections').deleteOne({ socketId });
    } catch (error) {
      console.error('Error deleting connection:', error);
      throw error;
    }
  }

  // Analytics operations
  async trackEvent(eventData) {
    try {
      const event = {
        sessionId: eventData.sessionId,
        eventType: eventData.eventType, // 'message_sent', 'session_started', 'session_ended', etc.
        data: eventData.data || {},
        timestamp: new Date(),
        userIP: eventData.userIP,
        userAgent: eventData.userAgent
      };

      await this.db.collection('analytics').insertOne(event);
      return event;
    } catch (error) {
      console.error('Error tracking event:', error);
      throw error;
    }
  }

  async getSessionAnalytics(sessionId) {
    try {
      return await this.db.collection('analytics')
        .find({ sessionId })
        .sort({ timestamp: 1 })
        .toArray();
    } catch (error) {
      console.error('Error getting session analytics:', error);
      throw error;
    }
  }

  // Transcript operations
  async generateTranscript(sessionId) {
    try {
      const session = await this.getSession(sessionId);
      const messages = await this.getMessagesBySession(sessionId);
      
      if (!session) {
        throw new Error('Session not found');
      }

      const transcript = {
        sessionId,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        messageCount: messages.length,
        userIP: session.userIP,
        userAgent: session.userAgent,
        referrer: session.referrer,
        url: session.url,
        messages: messages.map(msg => ({
          content: msg.content,
          isBot: msg.isBot,
          timestamp: msg.timestamp,
          type: msg.isBot ? 'Sofia' : 'User'
        })),
        summary: {
          totalMessages: messages.length,
          userMessages: messages.filter(m => !m.isBot).length,
          botMessages: messages.filter(m => m.isBot).length,
          sessionDuration: session.lastActivity - session.createdAt,
          hasUserEmail: session.hasUserEmail,
          userEmail: session.userEmail
        }
      };

      return transcript;
    } catch (error) {
      console.error('Error generating transcript:', error);
      throw error;
    }
  }

  // Cleanup operations
  async cleanupOldData() {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      
      // Clean up old sessions
      const sessionResult = await this.db.collection('sessions').deleteMany({
        lastActivity: { $lt: oneDayAgo },
        isActive: false
      });

      // Clean up old analytics
      const analyticsResult = await this.db.collection('analytics').deleteMany({
        timestamp: { $lt: oneDayAgo }
      });

      console.log(`🧹 Cleaned up ${sessionResult.deletedCount} old sessions and ${analyticsResult.deletedCount} old analytics`);
      return { sessions: sessionResult.deletedCount, analytics: analyticsResult.deletedCount };
    } catch (error) {
      console.error('Error cleaning up old data:', error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.client) {
        await this.client.close();
        this.isConnected = false;
        console.log('✅ MongoDB disconnected');
      }
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
    }
  }
}

module.exports = new Database();
