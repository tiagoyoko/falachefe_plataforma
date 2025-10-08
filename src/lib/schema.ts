import { 
  pgTable, 
  text, 
  timestamp, 
  boolean, 
  uuid, 
  integer, 
  jsonb,
  pgEnum,
  varchar
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./schema-consolidated";

// Enums
export const agentTypeEnum = pgEnum('agent_type', ['sales', 'support', 'marketing', 'finance', 'orchestrator']);
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

// Users (Usuários finais via WhatsApp)
export const users = pgTable("whatsapp_users", {
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
  userId: uuid("user_id").references(() => user.id, { onDelete: "cascade" }).notNull(),
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

// Relations
export const companiesRelations = relations(companies, ({ many }) => ({
  users: many(users),
  agents: many(agents),
  conversations: many(conversations),
  templates: many(templates),
}));

export const userRelations = relations(user, ({ one, many }) => ({
  company: one(companies, {
    fields: [user.companyId],
    references: [companies.id],
  }),
  conversations: many(conversations),
}));

export const agentsRelations = relations(agents, ({ one, many }) => ({
  company: one(companies, {
    fields: [agents.companyId],
    references: [companies.id],
  }),
  conversations: many(conversations),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user: one(user, {
    fields: [conversations.userId],
    references: [user.id],
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

// Export all types
export type Company = typeof companies.$inferSelect;
export type NewCompany = typeof companies.$inferInsert;
export type User = typeof user.$inferSelect;
export type NewUser = typeof user.$inferInsert;
export type Agent = typeof agents.$inferSelect;
export type NewAgent = typeof agents.$inferInsert;
export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type NewMessage = typeof messages.$inferInsert;
export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
export type UserOnboarding = typeof userOnboarding.$inferSelect;
export type NewUserOnboarding = typeof userOnboarding.$inferInsert;

// Re-export billing types
export type {
  SubscriptionPlan,
  NewSubscriptionPlan,
  UserSubscription,
  NewUserSubscription,
  Payment,
  NewPayment,
  Invoice,
  NewInvoice,
  UsageLimit,
  NewUsageLimit,
  UsageHistory,
  NewUsageHistory,
  StripeWebhook,
  NewStripeWebhook,
} from './billing-schema';

// Financial Categories table
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

// Financial Data table
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

// User Onboarding table
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

// Relations
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
