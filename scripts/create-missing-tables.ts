#!/usr/bin/env tsx

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

async function createMissingTables() {
  console.log("🚀 Criando tabelas faltantes do projeto Falachefe...");
  
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error("❌ Erro: DATABASE_URL ou POSTGRES_URL não está definida");
    process.exit(1);
  }

  try {
    // Criar cliente postgres
    const client = postgres(connectionString);
    const db = drizzle(client);

    console.log("📊 Verificando tabelas existentes...");
    
    // Verificar tabelas existentes
    const existingTables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const existingTableNames = existingTables.map((row: any) => row.table_name);
    console.log("✅ Tabelas existentes:", existingTableNames);

    // Lista de todas as tabelas necessárias
    const requiredTables = [
      'companies', 'whatsapp_users', 'agents', 'conversations', 'messages', 'templates',
      'agent_memories', 'shared_memories', 'conversation_contexts', 'agent_learnings',
      'admin_users', 'audit_logs'
    ];

    // Tabelas que faltam
    const missingTables = requiredTables.filter(table => !existingTableNames.includes(table));
    
    if (missingTables.length === 0) {
      console.log("✅ Todas as tabelas já existem!");
      await client.end();
      return;
    }

    console.log(`📋 Tabelas faltantes: ${missingTables.join(', ')}`);

    // Criar enums primeiro
    console.log("\n🔧 Criando enums...");
    const enumQueries = [
      `CREATE TYPE IF NOT EXISTS "access_level" AS ENUM('public', 'restricted', 'confidential')`,
      `CREATE TYPE IF NOT EXISTS "agent_type" AS ENUM('sales', 'support', 'marketing', 'finance', 'orchestrator')`,
      `CREATE TYPE IF NOT EXISTS "context_type" AS ENUM('user_intent', 'business_process', 'integration_state', 'workflow_progress')`,
      `CREATE TYPE IF NOT EXISTS "conversation_priority" AS ENUM('low', 'medium', 'high', 'urgent')`,
      `CREATE TYPE IF NOT EXISTS "conversation_status" AS ENUM('active', 'waiting', 'escalated', 'closed', 'archived')`,
      `CREATE TYPE IF NOT EXISTS "learning_type" AS ENUM('response_pattern', 'user_behavior', 'error_recovery', 'optimization')`,
      `CREATE TYPE IF NOT EXISTS "memory_type" AS ENUM('fact', 'preference', 'context', 'learning', 'pattern')`,
      `CREATE TYPE IF NOT EXISTS "message_status" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed')`,
      `CREATE TYPE IF NOT EXISTS "message_type" AS ENUM('text', 'image', 'document', 'template', 'interactive', 'flow')`,
      `CREATE TYPE IF NOT EXISTS "role" AS ENUM('super_admin', 'manager', 'analyst', 'viewer')`,
      `CREATE TYPE IF NOT EXISTS "sender_type" AS ENUM('user', 'agent', 'system')`,
      `CREATE TYPE IF NOT EXISTS "shared_memory_type" AS ENUM('company_policy', 'user_preference', 'business_rule', 'integration_config', 'common_knowledge')`,
      `CREATE TYPE IF NOT EXISTS "subscription_plan" AS ENUM('starter', 'professional', 'enterprise')`,
      `CREATE TYPE IF NOT EXISTS "template_category" AS ENUM('marketing', 'utility', 'authentication')`,
      `CREATE TYPE IF NOT EXISTS "template_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'paused')`
    ];

    for (const query of enumQueries) {
      try {
        await db.execute(sql.raw(query));
      } catch (error) {
        // Ignorar erros de enum já existente
      }
    }
    console.log("✅ Enums criados!");

    // Criar tabelas faltantes
    console.log("\n📋 Criando tabelas faltantes...");
    
    for (const tableName of missingTables) {
      console.log(`🔨 Criando tabela: ${tableName}`);
      
      try {
        let createQuery = '';
        
        switch (tableName) {
          case 'conversations':
            createQuery = `
              CREATE TABLE "conversations" (
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
              )
            `;
            break;
            
          case 'messages':
            createQuery = `
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
              )
            `;
            break;
            
          case 'templates':
            createQuery = `
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
              )
            `;
            break;
            
          case 'agent_memories':
            createQuery = `
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
                "updated_at" timestamp DEFAULT now() NOT NULL,
                CONSTRAINT "importance_range" CHECK (importance >= 0 AND importance <= 1)
              )
            `;
            break;
            
          case 'shared_memories':
            createQuery = `
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
              )
            `;
            break;
            
          case 'conversation_contexts':
            createQuery = `
              CREATE TABLE "conversation_contexts" (
                "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
                "conversation_id" uuid NOT NULL,
                "context_type" "context_type" NOT NULL,
                "data" jsonb NOT NULL,
                "version" integer DEFAULT 1,
                "is_active" boolean DEFAULT true,
                "created_at" timestamp DEFAULT now() NOT NULL,
                "updated_at" timestamp DEFAULT now() NOT NULL
              )
            `;
            break;
            
          case 'agent_learnings':
            createQuery = `
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
                "updated_at" timestamp DEFAULT now() NOT NULL,
                CONSTRAINT "confidence_range" CHECK (confidence >= 0 AND confidence <= 1),
                CONSTRAINT "success_rate_range" CHECK (success_rate >= 0 AND success_rate <= 1)
              )
            `;
            break;
            
          case 'admin_users':
            createQuery = `
              CREATE TABLE "admin_users" (
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
              )
            `;
            break;
            
          case 'audit_logs':
            createQuery = `
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
              )
            `;
            break;
        }
        
        if (createQuery) {
          await db.execute(sql.raw(createQuery));
          console.log(`  ✅ ${tableName} criada com sucesso`);
        }
        
      } catch (error) {
        console.log(`  ⚠️  Erro ao criar ${tableName}:`, (error as Error).message);
      }
    }

    // Verificar tabelas finais
    console.log("\n📊 Verificando tabelas finais...");
    const finalTables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log("✅ Tabelas finais:");
    finalTables.forEach((row: any) => {
      console.log(`  ✅ ${row.table_name}`);
    });

    await client.end();
    console.log("\n🎉 Criação de tabelas concluída com sucesso!");
    
  } catch (error) {
    console.error("❌ Erro na criação das tabelas:");
    console.error(error);
    process.exit(1);
  }
}

// Executar criação
createMissingTables();
