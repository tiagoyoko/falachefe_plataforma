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
  decimal
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { sql } from "drizzle-orm";

// ============================================================================
// ENUMS CONSOLIDADOS
// ============================================================================

export const conversationStatusEnum = pgEnum('conversation_status', ['active', 'waiting', 'escalated', 'closed', 'archived']);
export const conversationPriorityEnum = pgEnum('conversation_priority', ['low', 'medium', 'high', 'urgent']);
export const senderTypeEnum = pgEnum('sender_type', ['user', 'agent', 'system']);
export const messageTypeEnum = pgEnum('message_type', ['text', 'image', 'video', 'document', 'audio', 'myaudio', 'ptt', 'sticker', 'template', 'interactive', 'flow']);
export const messageStatusEnum = pgEnum('message_status', ['pending', 'sent', 'delivered', 'read', 'failed']);
export const templateCategoryEnum = pgEnum('template_category', ['marketing', 'utility', 'authentication']);
export const templateStatusEnum = pgEnum('template_status', ['draft', 'pending', 'approved', 'rejected', 'paused']);
export const memoryTypeEnum = pgEnum('memory_type', ['fact', 'preference', 'context', 'learning', 'pattern']);
export const sharedMemoryTypeEnum = pgEnum('shared_memory_type', ['company_policy', 'user_preference', 'business_rule', 'integration_config', 'common_knowledge']);
export const accessLevelEnum = pgEnum('access_level', ['public', 'restricted', 'confidential']);
export const contextTypeEnum = pgEnum('context_type', ['user_intent', 'business_process', 'integration_state', 'workflow_progress']);
export const learningTypeEnum = pgEnum('learning_type', ['response_pattern', 'user_behavior', 'error_recovery', 'optimization']);
export const subscriptionPlanEnum = pgEnum('subscription_plan', ['starter', 'professional', 'enterprise']);
export const roleEnum = pgEnum('role', ['super_admin', 'manager', 'analyst', 'viewer']);
export const companySizeEnum = pgEnum('company_size', ['1-10', '11-50', '51-200', '201-1000', '1000+']);

// Agent type enums
export const agentTypeEnum = pgEnum('agent_type', [
  'financial', 
  'marketing_sales', 
  'hr', 
  'general', 
  'orchestrator'
]);

export const memoryCategoryEnum = pgEnum('memory_category', [
  'conversation',
  'user_profile', 
  'business',
  'financial',
  'learning',
  'preferences',
  'goals',
  'insights'
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

// ============================================================================
// TABELAS PRINCIPAIS
// ============================================================================

// Companies (Empresas clientes)
export const companies = pgTable("companies", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 255 }).unique(),
  uazToken: text("uaz_token").notNull(),
  uazAdminToken: text("uaz_admin_token").notNull(),
  subscriptionPlan: subscriptionPlanEnum("subscription_plan").default("starter"),
  isActive: boolean("is_active").default(true),
  settings: jsonb("settings").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// WhatsApp Users (Usuários finais via WhatsApp)
export const whatsappUsers = pgTable("whatsapp_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  phoneNumber: varchar("phone_number", { length: 20 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  optInStatus: boolean("opt_in_status").default(false),
  lastInteraction: timestamp("last_interaction"),
  windowExpiresAt: timestamp("window_expires_at"),
  preferences: jsonb("preferences").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Better Auth Users (Usuários do painel administrativo)
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  emailVerified: boolean("email_verified"),
  image: text("image"),
  role: roleEnum("role").notNull().default("viewer"),
  isActive: boolean("is_active").notNull().default(true),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Sessions (Better Auth)
export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Accounts (Better Auth)
export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Verifications (Better Auth)
export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Agents (Agentes especializados de IA)
export const agents = pgTable("agents", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  type: agentTypeEnum("type").notNull(),
  description: text("description"),
  systemPrompt: text("system_prompt").notNull(),
  isActive: boolean("is_active").default(true),
  capabilities: jsonb("capabilities").default({}),
  config: jsonb("config").default({}),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Conversations (Conversas entre usuários e agentes)
export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  whatsappUserId: uuid("whatsapp_user_id").references(() => whatsappUsers.id, { onDelete: "cascade" }).notNull(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  currentAgentId: uuid("current_agent_id").references(() => agents.id),
  status: conversationStatusEnum("status").default("active"),
  priority: conversationPriorityEnum("priority").default("medium"),
  context: jsonb("context").default({}),
  metadata: jsonb("metadata").default({}),
  startedAt: timestamp("started_at").defaultNow().notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  endedAt: timestamp("ended_at"),
});

// Messages (Mensagens individuais)
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }).notNull(),
  senderType: senderTypeEnum("sender_type").notNull(),
  senderId: uuid("sender_id").notNull(),
  content: text("content").notNull(),
  messageType: messageTypeEnum("message_type").notNull(),
  uazMessageId: varchar("uaz_message_id", { length: 255 }),
  status: messageStatusEnum("status").default("pending"),
  metadata: jsonb("metadata").default({}),
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
  readAt: timestamp("read_at"),
});

// Templates (Templates de mensagem WhatsApp)
export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  category: templateCategoryEnum("category").notNull(),
  language: varchar("language", { length: 10 }).notNull(),
  status: templateStatusEnum("status").default("draft"),
  content: jsonb("content").notNull(),
  uazTemplateId: varchar("uaz_template_id", { length: 255 }),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// SISTEMA DE MEMÓRIA
// ============================================================================

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
  importanceCheck: sql`importance >= 0 AND importance <= 1`,
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
  confidenceCheck: sql`confidence >= 0 AND confidence <= 1`,
  successRateCheck: sql`success_rate >= 0 AND success_rate <= 1`,
}));

// ============================================================================
// SISTEMA FINANCEIRO
// ============================================================================

// Financial Categories
export const financialCategories = pgTable("financial_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  color: varchar("color", { length: 7 }), // Hex color code
  isDefault: boolean("is_default").default(false).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  userId: varchar("user_id", { length: 100 }), // NULL for global categories
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Financial Data
export const financialData = pgTable("financial_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: varchar("type", { length: 20 }).notNull(),
  amount: integer("amount").notNull(), // Stored in cents
  description: text("description").notNull(),
  category: varchar("category", { length: 50 }).notNull(),
  date: timestamp("date").notNull(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  metadata: jsonb("metadata").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// ONBOARDING E PERFIS
// ============================================================================

// User Onboarding
export const userOnboarding = pgTable("user_onboarding", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 100 }).unique().notNull(), // Better Auth user ID
  firstName: varchar("first_name", { length: 255 }).notNull(),
  lastName: varchar("last_name", { length: 255 }).notNull(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  position: varchar("position", { length: 255 }).notNull(),
  companySize: companySizeEnum("company_size").notNull(),
  industry: varchar("industry", { length: 255 }).notNull(),
  whatsappPhone: varchar("whatsapp_phone", { length: 20 }).notNull(),
  isCompleted: boolean("is_completed").default(false).notNull(),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================================================
// AUDITORIA E LOGS
// ============================================================================

// Audit Logs
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  resourceId: uuid("resource_id"),
  details: text("details").default("{}"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ============================================================================
// RELAÇÕES
// ============================================================================

export const companiesRelations = relations(companies, ({ many }) => ({
  whatsappUsers: many(whatsappUsers),
  users: many(user),
  agents: many(agents),
  conversations: many(conversations),
  templates: many(templates),
  sharedMemories: many(sharedMemories),
  financialCategories: many(financialCategories),
}));

export const whatsappUsersRelations = relations(whatsappUsers, ({ one, many }) => ({
  company: one(companies, {
    fields: [whatsappUsers.companyId],
    references: [companies.id],
  }),
  conversations: many(conversations),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  company: one(companies, {
    fields: [user.companyId],
    references: [companies.id],
  }),
  sessions: many(sessions),
  accounts: many(accounts),
  auditLogs: many(auditLogs),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(user, {
    fields: [sessions.userId],
    references: [user.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(user, {
    fields: [accounts.userId],
    references: [user.id],
  }),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  company: one(companies, {
    fields: [agents.companyId],
    references: [companies.id],
  }),
  conversations: many(conversations),
  memories: many(agentMemories),
  learnings: many(agentLearnings),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  whatsappUser: one(whatsappUsers, {
    fields: [conversations.whatsappUserId],
    references: [whatsappUsers.id],
  }),
  company: one(companies, {
    fields: [conversations.companyId],
    references: [companies.id],
  }),
  currentAgent: one(agents, {
    fields: [conversations.currentAgentId],
    references: [agents.id],
  }),
  messages: many(messages),
  contexts: many(conversationContexts),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
}));

export const templatesRelations = relations(templates, ({ one }) => ({
  company: one(companies, {
    fields: [templates.companyId],
    references: [companies.id],
  }),
}));

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

export const financialCategoriesRelations = relations(financialCategories, ({ one }) => ({
  company: one(companies, {
    fields: [financialCategories.companyId],
    references: [companies.id],
  }),
}));

export const financialDataRelations = relations(financialData, ({ one }) => ({
  category: one(financialCategories, {
    fields: [financialData.category],
    references: [financialCategories.name],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(user, {
    fields: [auditLogs.userId],
    references: [user.id],
  }),
}));

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type WhatsAppUser = typeof whatsappUsers.$inferSelect;
export type NewWhatsAppUser = typeof whatsappUsers.$inferInsert;
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Verification = typeof verifications.$inferSelect;
export type NewVerification = typeof verifications.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type AgentMemory = typeof agentMemories.$inferSelect;
export type NewAgentMemory = typeof agentMemories.$inferInsert;
export type SharedMemory = typeof sharedMemories.$inferSelect;
export type NewSharedMemory = typeof sharedMemories.$inferInsert;
export type ConversationContext = typeof conversationContexts.$inferSelect;
export type NewConversationContext = typeof conversationContexts.$inferInsert;
export type AgentLearning = typeof agentLearnings.$inferSelect;
export type NewAgentLearning = typeof agentLearnings.$inferInsert;
export type FinancialCategory = typeof financialCategories.$inferSelect;
export type NewFinancialCategory = typeof financialCategories.$inferInsert;
export type FinancialData = typeof financialData.$inferSelect;
export type NewFinancialData = typeof financialData.$inferInsert;
export type UserOnboarding = typeof userOnboarding.$inferSelect;
export type NewUserOnboarding = typeof userOnboarding.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;

