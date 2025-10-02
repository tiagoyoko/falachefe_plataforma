-- Migration SQL para criar as tabelas faltantes do projeto Falachefe

-- Criar enums (se não existirem)
CREATE TYPE IF NOT EXISTS "access_level" AS ENUM('public', 'restricted', 'confidential');
CREATE TYPE IF NOT EXISTS "agent_type" AS ENUM('sales', 'support', 'marketing', 'finance', 'orchestrator');
CREATE TYPE IF NOT EXISTS "context_type" AS ENUM('user_intent', 'business_process', 'integration_state', 'workflow_progress');
CREATE TYPE IF NOT EXISTS "conversation_priority" AS ENUM('low', 'medium', 'high', 'urgent');
CREATE TYPE IF NOT EXISTS "conversation_status" AS ENUM('active', 'waiting', 'escalated', 'closed', 'archived');
CREATE TYPE IF NOT EXISTS "learning_type" AS ENUM('response_pattern', 'user_behavior', 'error_recovery', 'optimization');
CREATE TYPE IF NOT EXISTS "memory_type" AS ENUM('fact', 'preference', 'context', 'learning', 'pattern');
CREATE TYPE IF NOT EXISTS "message_status" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed');
CREATE TYPE IF NOT EXISTS "message_type" AS ENUM('text', 'image', 'document', 'template', 'interactive', 'flow');
CREATE TYPE IF NOT EXISTS "role" AS ENUM('super_admin', 'manager', 'analyst', 'viewer');
CREATE TYPE IF NOT EXISTS "sender_type" AS ENUM('user', 'agent', 'system');
CREATE TYPE IF NOT EXISTS "shared_memory_type" AS ENUM('company_policy', 'user_preference', 'business_rule', 'integration_config', 'common_knowledge');
CREATE TYPE IF NOT EXISTS "subscription_plan" AS ENUM('starter', 'professional', 'enterprise');
CREATE TYPE IF NOT EXISTS "template_category" AS ENUM('marketing', 'utility', 'authentication');
CREATE TYPE IF NOT EXISTS "template_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'paused');

-- Criar tabela users (usuários do WhatsApp)
CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"phone_number" varchar(20) NOT NULL,
	"name" varchar(255) NOT NULL,
	"company_id" uuid NOT NULL,
	"opt_in_status" boolean DEFAULT false,
	"last_interaction" timestamp,
	"window_expires_at" timestamp,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_phone_number_unique" UNIQUE("phone_number")
);

-- Criar tabela conversations
CREATE TABLE IF NOT EXISTS "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"current_agent_id" uuid,
	"status" "conversation_status" DEFAULT 'active',
	"priority" "conversation_priority" DEFAULT 'medium',
	"context" jsonb DEFAULT '{}'::jsonb,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"last_message_at" timestamp DEFAULT now() NOT NULL,
	"ended_at" timestamp
);

-- Criar tabela messages
CREATE TABLE IF NOT EXISTS "messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"sender_type" "sender_type" NOT NULL,
	"sender_id" uuid NOT NULL,
	"content" text NOT NULL,
	"message_type" "message_type" NOT NULL,
	"uaz_message_id" varchar(255),
	"status" "message_status" DEFAULT 'pending',
	"metadata" jsonb DEFAULT '{}'::jsonb,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"delivered_at" timestamp,
	"read_at" timestamp
);

-- Criar tabela templates
CREATE TABLE IF NOT EXISTS "templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"category" "template_category" NOT NULL,
	"language" varchar(10) NOT NULL,
	"status" "template_status" DEFAULT 'draft',
	"content" jsonb NOT NULL,
	"uaz_template_id" varchar(255),
	"usage_count" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Criar tabela agent_memories
CREATE TABLE IF NOT EXISTS "agent_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"conversation_id" uuid,
	"memory_type" "memory_type" NOT NULL,
	"content" jsonb NOT NULL,
	"importance" numeric(3, 2) DEFAULT '0.5' NOT NULL,
	"expires_at" timestamp,
	"access_count" integer DEFAULT 0,
	"last_accessed_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "importance_range" CHECK (importance >= 0 AND importance <= 1)
);

-- Criar tabela shared_memories
CREATE TABLE IF NOT EXISTS "shared_memories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"memory_type" "shared_memory_type" NOT NULL,
	"content" jsonb NOT NULL,
	"access_level" "access_level" DEFAULT 'public',
	"tags" text[] DEFAULT '{}',
	"is_active" boolean DEFAULT true,
	"created_by" uuid,
	"last_updated_by" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Criar tabela conversation_contexts
CREATE TABLE IF NOT EXISTS "conversation_contexts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"context_type" "context_type" NOT NULL,
	"data" jsonb NOT NULL,
	"version" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Criar tabela agent_learnings
CREATE TABLE IF NOT EXISTS "agent_learnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"learning_type" "learning_type" NOT NULL,
	"pattern" jsonb NOT NULL,
	"confidence" numeric(3, 2) DEFAULT '0.5' NOT NULL,
	"success_rate" numeric(3, 2) DEFAULT '0.0' NOT NULL,
	"usage_count" integer DEFAULT 0,
	"is_validated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "confidence_range" CHECK (confidence >= 0 AND confidence <= 1),
	CONSTRAINT "success_rate_range" CHECK (success_rate >= 0 AND success_rate <= 1)
);

-- Criar tabela admin_users
CREATE TABLE IF NOT EXISTS "admin_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255) NOT NULL,
	"role" "role" DEFAULT 'analyst',
	"company_id" uuid NOT NULL,
	"is_active" boolean DEFAULT true,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);

-- Adicionar foreign keys
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_current_agent_id_agents_id_fk" FOREIGN KEY ("current_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "templates" ADD CONSTRAINT "templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "agent_learnings" ADD CONSTRAINT "agent_learnings_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "agent_memories" ADD CONSTRAINT "agent_memories_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "agent_memories" ADD CONSTRAINT "agent_memories_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "conversation_contexts" ADD CONSTRAINT "conversation_contexts_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "shared_memories" ADD CONSTRAINT "shared_memories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "shared_memories" ADD CONSTRAINT "shared_memories_created_by_agents_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "shared_memories" ADD CONSTRAINT "shared_memories_last_updated_by_agents_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_admin_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."admin_users"("id") ON DELETE cascade ON UPDATE no action;
