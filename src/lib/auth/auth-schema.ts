import { 
  pgTable, 
  text, 
  timestamp, 
  boolean, 
  uuid, 
  varchar
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { companies, roleEnum } from "../schema-consolidated";

// Admin Users (Usuários do painel administrativo)
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  role: roleEnum("role").default("analyst"),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "cascade" }).notNull(),
  isActive: boolean("is_active").default(true),
  lastLoginAt: timestamp("last_login_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Audit Logs (Logs de auditoria)
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => adminUsers.id, { onDelete: "cascade" }).notNull(),
  action: varchar("action", { length: 100 }).notNull(),
  resource: varchar("resource", { length: 100 }).notNull(),
  resourceId: uuid("resource_id"),
  details: text("details").default("{}"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const adminUsersRelations = relations(adminUsers, ({ one, many }) => ({
  company: one(companies, {
    fields: [adminUsers.companyId],
    references: [companies.id],
  }),
  auditLogs: many(auditLogs),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(adminUsers, {
    fields: [auditLogs.userId],
    references: [adminUsers.id],
  }),
}));

// Export types
export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;
export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
