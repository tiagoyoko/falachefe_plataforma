import { 
  pgTable, 
  text, 
  timestamp, 
  boolean,
  uuid,
  integer,
  decimal,
  jsonb,
  pgEnum,
  varchar
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies } from "./schema";

// Re-export companies for use in billing schema
export { companies };

// Enums para billing
export const subscriptionStatusEnum = pgEnum('subscription_status', [
  'active', 
  'inactive', 
  'cancelled', 
  'past_due', 
  'unpaid', 
  'trialing',
  'paused'
]);

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'processing', 
  'succeeded',
  'failed',
  'cancelled',
  'refunded',
  'partially_refunded'
]);

export const paymentMethodEnum = pgEnum('payment_method', [
  'credit_card',
  'debit_card',
  'pix',
  'boleto',
  'bank_transfer',
  'stripe',
  'paypal'
]);

export const billingCycleEnum = pgEnum('billing_cycle', [
  'monthly',
  'quarterly', 
  'yearly',
  'lifetime'
]);

export const invoiceStatusEnum = pgEnum('invoice_status', [
  'draft',
  'open',
  'paid',
  'void',
  'uncollectible'
]);

// Tabela de planos de assinatura
export const subscriptionPlans = pgTable("subscription_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 50 }).unique().notNull(),
  description: text("description"),
  
  // Preços
  priceMonthly: decimal("price_monthly", { precision: 10, scale: 2 }).notNull(),
  priceYearly: decimal("price_yearly", { precision: 10, scale: 2 }),
  priceLifetime: decimal("price_lifetime", { precision: 10, scale: 2 }),
  
  // Configurações de cobrança
  billingCycle: billingCycleEnum("billing_cycle").default("monthly"),
  trialDays: integer("trial_days").default(0),
  
  // Limites de uso
  maxAgents: integer("max_agents").default(1),
  maxUsers: integer("max_users").default(10),
  maxMessagesPerMonth: integer("max_messages_per_month").default(1000),
  maxTemplates: integer("max_templates").default(5),
  maxStorageGB: integer("max_storage_gb").default(1),
  
  // Recursos incluídos
  features: jsonb("features").default({}),
  
  // Status
  isActive: boolean("is_active").default(true),
  isPopular: boolean("is_popular").default(false),
  
  // Metadados
  stripePriceId: varchar("stripe_price_id", { length: 255 }),
  stripeProductId: varchar("stripe_product_id", { length: 255 }),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela de assinaturas de usuários
export const userSubscriptions = pgTable("user_subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(), // Referência ao user do better-auth
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  planId: uuid("plan_id").references(() => subscriptionPlans.id).notNull(),
  
  // Status da assinatura
  status: subscriptionStatusEnum("status").default("active"),
  
  // Datas importantes
  startDate: timestamp("start_date").defaultNow().notNull(),
  endDate: timestamp("end_date"),
  trialEndDate: timestamp("trial_end_date"),
  cancelledAt: timestamp("cancelled_at"),
  
  // Configurações de cobrança
  billingCycle: billingCycleEnum("billing_cycle").notNull(),
  nextBillingDate: timestamp("next_billing_date"),
  
  // IDs externos (Stripe)
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  
  // Metadados
  metadata: jsonb("metadata").default({}),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela de pagamentos
export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").references(() => userSubscriptions.id, { onDelete: "cascade" }).notNull(),
  
  // Valores
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  
  // Status e método
  status: paymentStatusEnum("status").default("pending"),
  paymentMethod: paymentMethodEnum("payment_method").notNull(),
  
  // IDs externos
  stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),
  stripeChargeId: varchar("stripe_charge_id", { length: 255 }),
  
  // Datas
  paidAt: timestamp("paid_at"),
  failedAt: timestamp("failed_at"),
  
  // Metadados
  failureReason: text("failure_reason"),
  metadata: jsonb("metadata").default({}),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela de faturas
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").references(() => userSubscriptions.id, { onDelete: "cascade" }).notNull(),
  paymentId: uuid("payment_id").references(() => payments.id),
  
  // Número da fatura
  invoiceNumber: varchar("invoice_number", { length: 50 }).unique().notNull(),
  
  // Valores
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0.00"),
  discount: decimal("discount", { precision: 10, scale: 2 }).default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 3 }).default("BRL"),
  
  // Status
  status: invoiceStatusEnum("status").default("draft"),
  
  // Datas
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  dueDate: timestamp("due_date").notNull(),
  paidDate: timestamp("paid_date"),
  
  // IDs externos
  stripeInvoiceId: varchar("stripe_invoice_id", { length: 255 }),
  
  // Metadados
  notes: text("notes"),
  metadata: jsonb("metadata").default({}),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela de limites de uso por plano
export const usageLimits = pgTable("usage_limits", {
  id: uuid("id").primaryKey().defaultRandom(),
  planId: uuid("plan_id").references(() => subscriptionPlans.id, { onDelete: "cascade" }).notNull(),
  
  // Tipo de limite
  limitType: varchar("limit_type", { length: 50 }).notNull(), // 'agents', 'users', 'messages', 'templates', 'storage'
  limitValue: integer("limit_value").notNull(),
  
  // Configurações
  isHardLimit: boolean("is_hard_limit").default(true), // true = bloqueia, false = apenas avisa
  resetPeriod: varchar("reset_period", { length: 20 }).default("monthly"), // 'daily', 'weekly', 'monthly', 'yearly'
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Tabela de histórico de uso
export const usageHistory = pgTable("usage_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  subscriptionId: uuid("subscription_id").references(() => userSubscriptions.id, { onDelete: "cascade" }).notNull(),
  
  // Tipo de uso
  usageType: varchar("usage_type", { length: 50 }).notNull(), // 'agents', 'users', 'messages', 'templates', 'storage'
  usageValue: integer("usage_value").notNull(),
  
  // Período
  periodStart: timestamp("period_start").notNull(),
  periodEnd: timestamp("period_end").notNull(),
  
  // Metadados
  metadata: jsonb("metadata").default({}),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Tabela de webhooks do Stripe
export const stripeWebhooks = pgTable("stripe_webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  stripeEventId: varchar("stripe_event_id", { length: 255 }).unique().notNull(),
  eventType: varchar("event_type", { length: 100 }).notNull(),
  
  // Status do processamento
  processed: boolean("processed").default(false),
  processedAt: timestamp("processed_at"),
  
  // Dados do evento
  eventData: jsonb("event_data").notNull(),
  
  // Erro no processamento
  errorMessage: text("error_message"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const subscriptionPlansRelations = relations(subscriptionPlans, ({ many }) => ({
  subscriptions: many(userSubscriptions),
  usageLimits: many(usageLimits),
}));

export const userSubscriptionsRelations = relations(userSubscriptions, ({ one, many }) => ({
  company: one(companies, {
    fields: [userSubscriptions.companyId],
    references: [companies.id],
  }),
  plan: one(subscriptionPlans, {
    fields: [userSubscriptions.planId],
    references: [subscriptionPlans.id],
  }),
  payments: many(payments),
  invoices: many(invoices),
  usageHistory: many(usageHistory),
}));

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  subscription: one(userSubscriptions, {
    fields: [payments.subscriptionId],
    references: [userSubscriptions.id],
  }),
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  subscription: one(userSubscriptions, {
    fields: [invoices.subscriptionId],
    references: [userSubscriptions.id],
  }),
  payment: one(payments, {
    fields: [invoices.paymentId],
    references: [payments.id],
  }),
}));

export const usageLimitsRelations = relations(usageLimits, ({ one }) => ({
  plan: one(subscriptionPlans, {
    fields: [usageLimits.planId],
    references: [subscriptionPlans.id],
  }),
}));

export const usageHistoryRelations = relations(usageHistory, ({ one }) => ({
  subscription: one(userSubscriptions, {
    fields: [usageHistory.subscriptionId],
    references: [userSubscriptions.id],
  }),
}));

// Export types
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type NewSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type NewUserSubscription = typeof userSubscriptions.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type Invoice = typeof invoices.$inferSelect;
export type NewInvoice = typeof invoices.$inferInsert;
export type UsageLimit = typeof usageLimits.$inferSelect;
export type NewUsageLimit = typeof usageLimits.$inferInsert;
export type UsageHistory = typeof usageHistory.$inferSelect;
export type NewUsageHistory = typeof usageHistory.$inferInsert;
export type StripeWebhook = typeof stripeWebhooks.$inferSelect;
export type NewStripeWebhook = typeof stripeWebhooks.$inferInsert;

