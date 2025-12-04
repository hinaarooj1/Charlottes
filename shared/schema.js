const { pgTable, text, serial, timestamp } = require("drizzle-orm/pg-core");
const { createInsertSchema } = require("drizzle-zod");
const { z } = require("zod");

const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  isBot: text("is_bot").notNull().default("false"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  sessionId: text("session_id").notNull(),
});

const insertMessageSchema = createInsertSchema(messages)
  .pick({
    content: true,
    isBot: true,
    sessionId: true,
  })
  .extend({
    isBot: z.boolean().transform((val) => (val ? "true" : "false")),
  });

const ChatConfig = {
  primaryColor: undefined,
  position: undefined,
  welcomeMessage: undefined,
  botName: undefined,
};

module.exports = {
  messages,
  insertMessageSchema,
  ChatConfig,
};
