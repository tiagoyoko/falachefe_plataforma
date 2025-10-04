/**
 * Schema Drizzle para Sistema de Memória do Agente Secretário
 */

import { pgTable, uuid, varchar, jsonb, real, integer, timestamp, text, vector } from 'drizzle-orm/pg-core'
import { createInsertSchema, createSelectSchema } from 'drizzle-zod'
import { z } from 'zod'

// Enums
export const memoryCategoryEnum = z.enum([
  'conversation',
  'user_profile', 
  'business',
  'financial',
  'learning',
  'preferences',
  'goals',
  'insights'
])

// Tabela principal de memórias do agente
export const agentMemories = pgTable('agent_memories', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 100 }).notNull(),
  conversationId: varchar('conversation_id', { length: 100 }),
  category: varchar('category', { length: 50 }).notNull(),
  memoryKey: varchar('memory_key', { length: 255 }).notNull(),
  memoryValue: jsonb('memory_value').notNull(),
  importanceScore: real('importance_score').default(0.5).notNull(),
  ttlSeconds: integer('ttl_seconds'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at')
})

// Tabela de contexto de conversação
export const conversationContexts = pgTable('conversation_contexts', {
  id: uuid('id').primaryKey().defaultRandom(),
  conversationId: varchar('conversation_id', { length: 100 }).unique().notNull(),
  userId: varchar('user_id', { length: 100 }).notNull(),
  contextData: jsonb('context_data').notNull().default({}),
  messageCount: integer('message_count').default(0).notNull(),
  lastActivity: timestamp('last_activity').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Tabela de perfil de memória do usuário
export const userMemoryProfiles = pgTable('user_memory_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 100 }).unique().notNull(),
  profileData: jsonb('profile_data').notNull().default({}),
  preferences: jsonb('preferences').default({}).notNull(),
  businessContext: jsonb('business_context').default({}).notNull(),
  lastUpdated: timestamp('last_updated').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Tabela de embeddings para busca semântica
export const memoryEmbeddings = pgTable('memory_embeddings', {
  id: uuid('id').primaryKey().defaultRandom(),
  memoryId: uuid('memory_id').notNull().references(() => agentMemories.id, { onDelete: 'cascade' }),
  embedding: vector('embedding', { dimensions: 1536 }), // OpenAI embedding dimension
  contentText: text('content_text').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
})

// Schemas Zod para validação
export const insertAgentMemorySchema = createInsertSchema(agentMemories)

export const selectAgentMemorySchema = createSelectSchema(agentMemories)

export const insertConversationContextSchema = createInsertSchema(conversationContexts)

export const selectConversationContextSchema = createSelectSchema(conversationContexts)

export const insertUserMemoryProfileSchema = createInsertSchema(userMemoryProfiles)

export const selectUserMemoryProfileSchema = createSelectSchema(userMemoryProfiles)

export const insertMemoryEmbeddingSchema = createInsertSchema(memoryEmbeddings)

export const selectMemoryEmbeddingSchema = createSelectSchema(memoryEmbeddings)

// Tipos TypeScript derivados dos schemas
export type AgentMemory = typeof agentMemories.$inferSelect
export type InsertAgentMemory = typeof agentMemories.$inferInsert
export type ConversationContext = typeof conversationContexts.$inferSelect
export type InsertConversationContext = typeof conversationContexts.$inferInsert
export type UserMemoryProfile = typeof userMemoryProfiles.$inferSelect
export type InsertUserMemoryProfile = typeof userMemoryProfiles.$inferInsert
export type MemoryEmbedding = typeof memoryEmbeddings.$inferSelect
export type InsertMemoryEmbedding = typeof memoryEmbeddings.$inferInsert

// Enum para uso em TypeScript
export type MemoryCategory = z.infer<typeof memoryCategoryEnum>
