const { Message, insertMessageSchema } = require("./shared/schema.js");

class MemStorage {
  constructor() {
    this.messages = new Map();
    this.sessions = new Map();
    this.currentId = 1;
  }

  async createMessage(insertMessage) {
    const id = this.currentId++;
    const message = {
      id,
      content: insertMessage.content,
      isBot: insertMessage.isBot, // Already converted to string by schema
      sessionId: insertMessage.sessionId,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessagesBySession(sessionId) {
    return Array.from(this.messages.values())
      .filter((message) => message.sessionId === sessionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createSession(sessionData) {
    const session = {
      sessionId: sessionData.sessionId,
      threadId: sessionData.threadId || null,
      createdAt: new Date(),
      lastActivity: new Date()
    };
    this.sessions.set(sessionData.sessionId, session);
    return session;
  }

  async getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  async updateSession(sessionId, updates) {
    const session = this.sessions.get(sessionId);
    if (session) {
      Object.assign(session, updates);
      session.lastActivity = new Date();
      this.sessions.set(sessionId, session);
    }
    return session;
  }
}

const storage = new MemStorage();

module.exports = {
  MemStorage,
  storage,
};
