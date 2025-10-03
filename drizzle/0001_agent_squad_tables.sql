-- Agent Squad Framework Tables Migration
-- Based on AWS Labs Agent Squad Framework

-- Create enums
CREATE TYPE "public"."agent_squad_type" AS ENUM('financial', 'marketing_sales', 'hr', 'general', 'orchestrator');
CREATE TYPE "public"."memory_category" AS ENUM('individual', 'shared', 'conversation', 'context');
CREATE TYPE "public"."intent_type" AS ENUM('add_expense', 'add_revenue', 'cashflow_analysis', 'budget_planning', 'financial_query', 'lead_management', 'campaign_analysis', 'sales_report', 'marketing_query', 'employee_management', 'payroll', 'hr_query', 'general_query', 'orchestrator_routing');
CREATE TYPE "public"."streaming_type" AS ENUM('message', 'status', 'error', 'typing');

-- Agent Squad Agents table
CREATE TABLE IF NOT EXISTS "agent_squad_agents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "agent_squad_type" NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"config" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Agent Squad Memory table
CREATE TABLE IF NOT EXISTS "agent_squad_memory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar(100) NOT NULL,
	"agent_id" uuid,
	"category" "memory_category" NOT NULL,
	"memory_data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"ttl" integer DEFAULT 3600 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Agent Squad Intent Classification table
CREATE TABLE IF NOT EXISTS "agent_squad_intents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar(100) NOT NULL,
	"message_id" varchar(100) NOT NULL,
	"intent_type" "intent_type" NOT NULL,
	"confidence" real NOT NULL,
	"context" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Agent Squad Streaming Messages table
CREATE TABLE IF NOT EXISTS "agent_squad_streaming" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" varchar(100) NOT NULL,
	"agent_id" uuid,
	"type" "streaming_type" NOT NULL,
	"content" text NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

-- Agent Squad Financial Data table
CREATE TABLE IF NOT EXISTS "agent_squad_financial_data" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(20) NOT NULL,
	"amount" real NOT NULL,
	"description" text NOT NULL,
	"category" varchar(50) NOT NULL,
	"date" timestamp NOT NULL,
	"user_id" varchar(100) NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "idx_agent_squad_agents_type" ON "agent_squad_agents" ("type");
CREATE INDEX IF NOT EXISTS "idx_agent_squad_agents_active" ON "agent_squad_agents" ("is_active");
CREATE INDEX IF NOT EXISTS "idx_agent_squad_memory_conversation" ON "agent_squad_memory" ("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_agent_squad_memory_agent" ON "agent_squad_memory" ("agent_id");
CREATE INDEX IF NOT EXISTS "idx_agent_squad_memory_category" ON "agent_squad_memory" ("category");
CREATE INDEX IF NOT EXISTS "idx_agent_squad_intents_conversation" ON "agent_squad_intents" ("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_agent_squad_intents_message" ON "agent_squad_intents" ("message_id");
CREATE INDEX IF NOT EXISTS "idx_agent_squad_streaming_conversation" ON "agent_squad_streaming" ("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_agent_squad_streaming_agent" ON "agent_squad_streaming" ("agent_id");
CREATE INDEX IF NOT EXISTS "idx_agent_squad_financial_user" ON "agent_squad_financial_data" ("user_id");
CREATE INDEX IF NOT EXISTS "idx_agent_squad_financial_date" ON "agent_squad_financial_data" ("date");
CREATE INDEX IF NOT EXISTS "idx_agent_squad_financial_type" ON "agent_squad_financial_data" ("type");

-- Add foreign key constraints
ALTER TABLE "agent_squad_memory" ADD CONSTRAINT "agent_squad_memory_agent_id_agent_squad_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "agent_squad_agents"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "agent_squad_streaming" ADD CONSTRAINT "agent_squad_streaming_agent_id_agent_squad_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "agent_squad_agents"("id") ON DELETE set null ON UPDATE no action;
