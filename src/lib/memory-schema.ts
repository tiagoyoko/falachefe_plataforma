import { 
  pgTable, 
  text, 
  timestamp, 
  boolean, 
  uuid, 
  integer, 
  decimal, 
  jsonb,
  check
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";
import { 
  companies, 
  agents, 
  conversations, 
  memoryTypeEnum, 
  sharedMemoryTypeEnum, 
  accessLevelEnum, 
  contextTypeEnum, 
  learningTypeEnum 
} from "./schema";

// Agent Memories (Memórias individuais dos agentes)
export const agentMemories = pgTable("agent_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
  memoryType: memoryTypeEnum("memory_type").notNull(),
  content: jsonb("content").notNull(),
  importance: decimal("importance", { precision: 3, scale: 2 }).default("0.5").notNull(),
  expiresAt: timestamp("expires_at"),
  accessCount: integer("access_count").default(0),
  lastAccessedAt: timestamp("last_accessed_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, () => ({
  importanceCheck: check("importance_range", sql`importance >= 0 AND importance <= 1`),
}));

// Shared Memories (Memórias compartilhadas)
export const sharedMemories = pgTable("shared_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  memoryType: sharedMemoryTypeEnum("memory_type").notNull(),
  content: jsonb("content").notNull(),
  accessLevel: accessLevelEnum("access_level").default("public"),
  tags: text("tags").array().default([]),
  isActive: boolean("is_active").default(true),
  createdBy: uuid("created_by").references(() => agents.id),
  lastUpdatedBy: uuid("last_updated_by").references(() => agents.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Conversation Contexts (Contexto das conversas)
export const conversationContexts = pgTable("conversation_contexts", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  contextType: contextTypeEnum("context_type").notNull(),
  data: jsonb("data").notNull(),
  version: integer("version").default(1),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Agent Learnings (Padrões de aprendizado)
export const agentLearnings = pgTable("agent_learnings", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id").references(() => agents.id, { onDelete: "cascade" }).notNull(),
  learningType: learningTypeEnum("learning_type").notNull(),
  pattern: jsonb("pattern").notNull(),
  confidence: decimal("confidence", { precision: 3, scale: 2 }).default("0.5").notNull(),
  successRate: decimal("success_rate", { precision: 3, scale: 2 }).default("0.0").notNull(),
  usageCount: integer("usage_count").default(0),
  isValidated: boolean("is_validated").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, () => ({
  confidenceCheck: check("confidence_range", sql`confidence >= 0 AND confidence <= 1`),
  successRateCheck: check("success_rate_range", sql`success_rate >= 0 AND success_rate <= 1`),
}));

// Relations
export const agentMemoriesRelations = relations(agentMemories, ({ one }) => ({
  agent: one(agents, {
    fields: [agentMemories.agentId],
    references: [agents.id],
  }),
  conversation: one(conversations, {
    fields: [agentMemories.conversationId],
    references: [conversations.id],
  }),
}));

export const sharedMemoriesRelations = relations(sharedMemories, ({ one }) => ({
  company: one(companies, {
    fields: [sharedMemories.companyId],
    references: [companies.id],
  }),
  createdBy: one(agents, {
    fields: [sharedMemories.createdBy],
    references: [agents.id],
  }),
  lastUpdatedBy: one(agents, {
    fields: [sharedMemories.lastUpdatedBy],
    references: [agents.id],
  }),
}));

export const conversationContextsRelations = relations(conversationContexts, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationContexts.conversationId],
    references: [conversations.id],
  }),
}));

export const agentLearningsRelations = relations(agentLearnings, ({ one }) => ({
  agent: one(agents, {
    fields: [agentLearnings.agentId],
    references: [agents.id],
  }),
}));

// Export types
export type AgentMemory = typeof agentMemories.$inferSelect;
export type NewAgentMemory = typeof agentMemories.$inferInsert;
export type SharedMemory = typeof sharedMemories.$inferSelect;
export type NewSharedMemory = typeof sharedMemories.$inferInsert;
export type ConversationContext = typeof conversationContexts.$inferSelect;
export type NewConversationContext = typeof conversationContexts.$inferInsert;
export type AgentLearning = typeof agentLearnings.$inferSelect;
export type NewAgentLearning = typeof agentLearnings.$inferInsert;
