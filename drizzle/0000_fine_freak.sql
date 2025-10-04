CREATE TYPE "public"."access_level" AS ENUM('public', 'restricted', 'confidential');--> statement-breakpoint
CREATE TYPE "public"."agent_squad_type" AS ENUM('financial', 'marketing_sales', 'hr', 'general', 'orchestrator');--> statement-breakpoint
CREATE TYPE "public"."agent_type" AS ENUM('sales', 'support', 'marketing', 'finance', 'orchestrator');--> statement-breakpoint
CREATE TYPE "public"."company_size" AS ENUM('1-10', '11-50', '51-200', '201-1000', '1000+');--> statement-breakpoint
CREATE TYPE "public"."context_type" AS ENUM('user_intent', 'business_process', 'integration_state', 'workflow_progress');--> statement-breakpoint
CREATE TYPE "public"."conversation_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."conversation_status" AS ENUM('active', 'waiting', 'escalated', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."intent_type" AS ENUM('add_expense', 'add_revenue', 'cashflow_analysis', 'budget_planning', 'financial_query', 'lead_management', 'campaign_analysis', 'sales_report', 'marketing_query', 'employee_management', 'payroll', 'hr_query', 'help', 'settings', 'general_query');--> statement-breakpoint
CREATE TYPE "public"."learning_type" AS ENUM('response_pattern', 'user_behavior', 'error_recovery', 'optimization');--> statement-breakpoint
CREATE TYPE "public"."memory_category" AS ENUM('conversation', 'user_profile', 'business', 'financial', 'learning', 'preferences', 'goals', 'insights');--> statement-breakpoint
CREATE TYPE "public"."memory_type" AS ENUM('fact', 'preference', 'context', 'learning', 'pattern');--> statement-breakpoint
CREATE TYPE "public"."message_status" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed');--> statement-breakpoint
CREATE TYPE "public"."message_type" AS ENUM('text', 'image', 'video', 'document', 'audio', 'myaudio', 'ptt', 'sticker', 'template', 'interactive', 'flow');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('super_admin', 'manager', 'analyst', 'viewer');--> statement-breakpoint
CREATE TYPE "public"."sender_type" AS ENUM('user', 'agent', 'system');--> statement-breakpoint
CREATE TYPE "public"."shared_memory_type" AS ENUM('company_policy', 'user_preference', 'business_rule', 'integration_config', 'common_knowledge');--> statement-breakpoint
CREATE TYPE "public"."subscription_plan" AS ENUM('starter', 'professional', 'enterprise');--> statement-breakpoint
CREATE TYPE "public"."template_category" AS ENUM('marketing', 'utility', 'authentication');--> statement-breakpoint
CREATE TYPE "public"."template_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'paused');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_learnings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"agent_id" uuid NOT NULL,
	"learning_type" "learning_type" NOT NULL,
	"pattern" jsonb NOT NULL,
	"confidence" numeric(3, 2) DEFAULT '0.5' NOT NULL,
	"success_rate" numeric(3, 2) DEFAULT '0.0' NOT NULL,
	"usage_count" integer DEFAULT 0,
	"is_validated" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_memories" (
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
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_squad_financial_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount" integer NOT NULL,
	"description" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"date" timestamp NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" "agent_type" NOT NULL,
	"description" text,
	"system_prompt" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"capabilities" jsonb DEFAULT '{}'::jsonb,
	"config" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"resource" varchar(100) NOT NULL,
	"resource_id" uuid,
	"details" text DEFAULT '{}',
	"ip_address" varchar(45),
	"user_agent" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"domain" varchar(255),
	"uaz_token" text NOT NULL,
	"uaz_admin_token" text NOT NULL,
	"subscription_plan" "subscription_plan" DEFAULT 'starter',
	"is_active" boolean DEFAULT true,
	"settings" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "companies_domain_unique" UNIQUE("domain")
);
--> statement-breakpoint
CREATE TABLE "conversation_contexts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL,
	"context_type" "context_type" NOT NULL,
	"data" jsonb NOT NULL,
	"version" integer DEFAULT 1,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"whatsapp_user_id" uuid NOT NULL,
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
--> statement-breakpoint
CREATE TABLE "financial_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"color" varchar(7),
	"is_default" boolean DEFAULT false NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"user_id" varchar(100),
	"company_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "messages" (
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
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shared_memories" (
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
--> statement-breakpoint
CREATE TABLE "templates" (
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
--> statement-breakpoint
CREATE TABLE "user_onboarding" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"first_name" varchar(255) NOT NULL,
	"last_name" varchar(255) NOT NULL,
	"company_name" varchar(255) NOT NULL,
	"position" varchar(255) NOT NULL,
	"company_size" "company_size" NOT NULL,
	"industry" varchar(255) NOT NULL,
	"whatsapp_phone" varchar(20) NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_onboarding_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean,
	"image" text,
	"role" "role" DEFAULT 'viewer' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"company_id" uuid,
	"last_login_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "verifications" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "whatsapp_users" (
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
	CONSTRAINT "whatsapp_users_phone_number_unique" UNIQUE("phone_number")
);
--> statement-breakpoint
ALTER TABLE "agent_learnings" ADD CONSTRAINT "agent_learnings_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_memories" ADD CONSTRAINT "agent_memories_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_memories" ADD CONSTRAINT "agent_memories_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agents" ADD CONSTRAINT "agents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversation_contexts" ADD CONSTRAINT "conversation_contexts_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_whatsapp_user_id_whatsapp_users_id_fk" FOREIGN KEY ("whatsapp_user_id") REFERENCES "public"."whatsapp_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_current_agent_id_agents_id_fk" FOREIGN KEY ("current_agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financial_categories" ADD CONSTRAINT "financial_categories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_memories" ADD CONSTRAINT "shared_memories_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_memories" ADD CONSTRAINT "shared_memories_created_by_agents_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_memories" ADD CONSTRAINT "shared_memories_last_updated_by_agents_id_fk" FOREIGN KEY ("last_updated_by") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "templates" ADD CONSTRAINT "templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_users" ADD CONSTRAINT "whatsapp_users_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;