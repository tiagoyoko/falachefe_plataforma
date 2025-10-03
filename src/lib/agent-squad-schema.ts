/**
 * Agent Squad Schema - Database tables for Agent Squad Framework
 * Based on AWS Labs Agent Squad Framework
 */

import { 
  pgTable, 
  text, 
  timestamp, 
  boolean, 
  uuid, 
  integer, 
  jsonb,
  pgEnum,
  varchar,
  index
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Agent Squad specific enums
export const agentSquadTypeEnum = pgEnum('agent_squad_type', [
  'financial', 
  'marketing_sales', 
  'hr', 
  'general', 
  'orchestrator'
]);

export const memoryCategoryEnum = pgEnum('memory_category', [
  'individual',
  'shared',
  'conversation',
  'context'
]);

export const intentTypeEnum = pgEnum('intent_type', [
  'add_expense',
  'add_revenue', 
  'cashflow_analysis',
  'budget_planning',
  'financial_query',
  'lead_management',
  'campaign_analysis',
  'sales_report',
  'marketing_query',
  'employee_management',
  'payroll',
  'hr_query',
  'help',
  'settings',
  'general_query'
]);

// Agent Conversations - Main conversation tracking
export const agentConversations = pgTable("agent_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: varchar("conversation_id", { length: 255 }).unique().notNull(),
  userId: uuid("user_id").notNull(),
  companyId: uuid("company_id").notNull(),
  agentType: agentSquadTypeEnum("agent_type").notNull(),
  currentAgentId: uuid("current_agent_id"),
  context: jsonb("context").default({}),
  status: varchar("status", { length: 50 }).default('active'),
  priority: varchar("priority", { length: 20 }).default('medium'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  conversationIdIdx: index("idx_agent_conversations_conversation_id").on(table.conversationId),
  userIdIdx: index("idx_agent_conversations_user_id").on(table.userId),
  agentTypeIdx: index("idx_agent_conversations_agent_type").on(table.agentType),
  companyIdIdx: index("idx_agent_conversations_company_id").on(table.companyId),
}));

// Individual Memory - Agent-specific memory storage
export const agentIndividualMemory = pgTable("agent_individual_memory", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: varchar("conversation_id", { length: 255 }).notNull(),
  agentType: agentSquadTypeEnum("agent_type").notNull(),
  agentId: uuid("agent_id").notNull(),
  memoryData: jsonb("memory_data").notNull(),
  category: memoryCategoryEnum("category").default('individual'),
  ttl: integer("ttl").default(86400), // 24 hours in seconds
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  conversationIdIdx: index("idx_agent_individual_memory_conversation_id").on(table.conversationId),
  agentTypeIdx: index("idx_agent_individual_memory_agent_type").on(table.agentType),
  agentIdIdx: index("idx_agent_individual_memory_agent_id").on(table.agentId),
  categoryIdx: index("idx_agent_individual_memory_category").on(table.category),
}));

// Shared Memory - Cross-agent memory storage
export const agentSharedMemory = pgTable("agent_shared_memory", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: varchar("conversation_id", { length: 255 }).notNull(),
  companyId: uuid("company_id").notNull(),
  memoryData: jsonb("memory_data").notNull(),
  category: memoryCategoryEnum("category").default('shared'),
  accessLevel: varchar("access_level", { length: 20 }).default('public'),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  conversationIdIdx: index("idx_agent_shared_memory_conversation_id").on(table.conversationId),
  companyIdIdx: index("idx_agent_shared_memory_company_id").on(table.companyId),
  categoryIdx: index("idx_agent_shared_memory_category").on(table.category),
}));

// Intent Classifications - Store intent classification results
export const intentClassifications = pgTable("intent_classifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: varchar("conversation_id", { length: 255 }).notNull(),
  messageId: varchar("message_id", { length: 255 }),
  intent: intentTypeEnum("intent").notNull(),
  domain: varchar("domain", { length: 50 }).notNull(),
  confidence: integer("confidence").notNull(), // 0-100
  reasoning: text("reasoning"),
  suggestedAgent: agentSquadTypeEnum("suggested_agent").notNull(),
  actualAgent: agentSquadTypeEnum("actual_agent"),
  processingTime: integer("processing_time"), // milliseconds
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  conversationIdIdx: index("idx_intent_classifications_conversation_id").on(table.conversationId),
  intentIdx: index("idx_intent_classifications_intent").on(table.intent),
  domainIdx: index("idx_intent_classifications_domain").on(table.domain),
  createdAtIdx: index("idx_intent_classifications_created_at").on(table.createdAt),
}));

// Agent Performance - Track agent performance metrics
export const agentPerformance = pgTable("agent_performance", {
  id: uuid("id").primaryKey().defaultRandom(),
  agentId: uuid("agent_id").notNull(),
  agentType: agentSquadTypeEnum("agent_type").notNull(),
  conversationId: varchar("conversation_id", { length: 255 }).notNull(),
  responseTime: integer("response_time").notNull(), // milliseconds
  confidence: integer("confidence").notNull(), // 0-100
  userSatisfaction: integer("user_satisfaction"), // 1-5 rating
  success: boolean("success").notNull(),
  errorMessage: text("error_message"),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  agentIdIdx: index("idx_agent_performance_agent_id").on(table.agentId),
  agentTypeIdx: index("idx_agent_performance_agent_type").on(table.agentType),
  conversationIdIdx: index("idx_agent_performance_conversation_id").on(table.conversationId),
  createdAtIdx: index("idx_agent_performance_created_at").on(table.createdAt),
}));

// Streaming Connections - Track active streaming connections
export const streamingConnections = pgTable("streaming_connections", {
  id: uuid("id").primaryKey().defaultRandom(),
  connectionId: varchar("connection_id", { length: 255 }).unique().notNull(),
  conversationId: varchar("conversation_id", { length: 255 }).notNull(),
  userId: uuid("user_id").notNull(),
  companyId: uuid("company_id").notNull(),
  isActive: boolean("is_active").default(true),
  lastActivity: timestamp("last_activity").defaultNow().notNull(),
  connectedAt: timestamp("connected_at").defaultNow().notNull(),
  disconnectedAt: timestamp("disconnected_at"),
  metadata: jsonb("metadata").default({}),
}, (table) => ({
  connectionIdIdx: index("idx_streaming_connections_connection_id").on(table.connectionId),
  conversationIdIdx: index("idx_streaming_connections_conversation_id").on(table.conversationId),
  userIdIdx: index("idx_streaming_connections_user_id").on(table.userId),
  isActiveIdx: index("idx_streaming_connections_is_active").on(table.isActive),
}));

// Relations
export const agentConversationsRelations = relations(agentConversations, ({ many }) => ({
  individualMemories: many(agentIndividualMemory),
  sharedMemories: many(agentSharedMemory),
  intentClassifications: many(intentClassifications),
  performance: many(agentPerformance),
  streamingConnections: many(streamingConnections),
}));

export const agentIndividualMemoryRelations = relations(agentIndividualMemory, ({ one }) => ({
  conversation: one(agentConversations, {
    fields: [agentIndividualMemory.conversationId],
    references: [agentConversations.conversationId],
  }),
}));

export const agentSharedMemoryRelations = relations(agentSharedMemory, ({ one }) => ({
  conversation: one(agentConversations, {
    fields: [agentSharedMemory.conversationId],
    references: [agentConversations.conversationId],
  }),
}));

export const intentClassificationsRelations = relations(intentClassifications, ({ one }) => ({
  conversation: one(agentConversations, {
    fields: [intentClassifications.conversationId],
    references: [agentConversations.conversationId],
  }),
}));

export const agentPerformanceRelations = relations(agentPerformance, ({ one }) => ({
  conversation: one(agentConversations, {
    fields: [agentPerformance.conversationId],
    references: [agentConversations.conversationId],
  }),
}));

export const streamingConnectionsRelations = relations(streamingConnections, ({ one }) => ({
  conversation: one(agentConversations, {
    fields: [streamingConnections.conversationId],
    references: [agentConversations.conversationId],
  }),
}));
