#!/usr/bin/env tsx

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";
import * as schema from "../src/lib/schema";
import * as memorySchema from "../src/lib/memory-schema";
import * as authSchema from "../src/lib/auth-schema";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

async function migrateDatabase() {
  console.log("🚀 Executando migração do banco de dados...");
  
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error("❌ Erro: DATABASE_URL ou POSTGRES_URL não está definida");
    process.exit(1);
  }

  try {
    // Criar cliente postgres
    const client = postgres(connectionString);
    const db = drizzle(client, { 
      schema: {
        ...schema,
        ...memorySchema,
        ...authSchema,
      }
    });

    console.log("📊 Verificando tabelas existentes...");
    
    // Verificar se as tabelas já existem
    const existingTables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN (
        'companies', 'users', 'agents', 'conversations', 'messages', 'templates',
        'agent_memories', 'shared_memories', 'conversation_contexts', 'agent_learnings',
        'admin_users', 'audit_logs'
      )
      ORDER BY table_name
    `);

    if (existingTables.length > 0) {
      console.log("⚠️  Tabelas já existem:");
      existingTables.forEach((row: any) => {
        console.log(`  ✅ ${row.table_name}`);
      });
      console.log("💡 Para recriar as tabelas, primeiro remova as existentes ou use um banco limpo.");
    } else {
      console.log("📝 Nenhuma tabela encontrada. Criando estrutura do banco...");
      
      // Criar enums
      console.log("🔧 Criando enums...");
      await db.execute(sql`CREATE TYPE "public"."access_level" AS ENUM('public', 'restricted', 'confidential')`);
      await db.execute(sql`CREATE TYPE "public"."agent_type" AS ENUM('sales', 'support', 'marketing', 'finance', 'orchestrator')`);
      await db.execute(sql`CREATE TYPE "public"."context_type" AS ENUM('user_intent', 'business_process', 'integration_state', 'workflow_progress')`);
      await db.execute(sql`CREATE TYPE "public"."conversation_priority" AS ENUM('low', 'medium', 'high', 'urgent')`);
      await db.execute(sql`CREATE TYPE "public"."conversation_status" AS ENUM('active', 'waiting', 'escalated', 'closed', 'archived')`);
      await db.execute(sql`CREATE TYPE "public"."learning_type" AS ENUM('response_pattern', 'user_behavior', 'error_recovery', 'optimization')`);
      await db.execute(sql`CREATE TYPE "public"."memory_type" AS ENUM('fact', 'preference', 'context', 'learning', 'pattern')`);
      await db.execute(sql`CREATE TYPE "public"."message_status" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed')`);
      await db.execute(sql`CREATE TYPE "public"."message_type" AS ENUM('text', 'image', 'document', 'template', 'interactive', 'flow')`);
      await db.execute(sql`CREATE TYPE "public"."role" AS ENUM('super_admin', 'manager', 'analyst', 'viewer')`);
      await db.execute(sql`CREATE TYPE "public"."sender_type" AS ENUM('user', 'agent', 'system')`);
      await db.execute(sql`CREATE TYPE "public"."shared_memory_type" AS ENUM('company_policy', 'user_preference', 'business_rule', 'integration_config', 'common_knowledge')`);
      await db.execute(sql`CREATE TYPE "public"."subscription_plan" AS ENUM('starter', 'professional', 'enterprise')`);
      await db.execute(sql`CREATE TYPE "public"."template_category" AS ENUM('marketing', 'utility', 'authentication')`);
      await db.execute(sql`CREATE TYPE "public"."template_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'paused')`);
      
      console.log("✅ Enums criados com sucesso!");
      console.log("📋 Para criar as tabelas, execute o arquivo de migração gerado manualmente ou use o Drizzle Studio.");
    }

    await client.end();
    console.log("✅ Verificação de migração concluída!");
    
  } catch (error) {
    console.error("❌ Erro na migração:");
    console.error(error);
    process.exit(1);
  }
}

// Executar migração
migrateDatabase();
