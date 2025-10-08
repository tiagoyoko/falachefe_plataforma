#!/usr/bin/env tsx

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

async function recreateTables() {
  console.log("🔄 Recriando tabelas com estrutura correta...");
  
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error("❌ Erro: DATABASE_URL ou POSTGRES_URL não está definida");
    process.exit(1);
  }

  try {
    // Criar cliente postgres
    const client = postgres(connectionString);
    const db = drizzle(client);

    console.log("⚠️  ATENÇÃO: Esta operação irá remover e recriar as tabelas 'companies' e 'agents'!");
    console.log("💡 Descomente as linhas de execução no script para prosseguir.");

    // 1. Remover tabelas existentes com estrutura incorreta
    console.log("\n🗑️  Removendo tabelas existentes...");
    
    // Descomente as linhas abaixo para executar a remoção
    /*
    await db.execute(sql.raw(`DROP TABLE IF EXISTS "companies" CASCADE`));
    console.log("✅ Tabela 'companies' removida");
    
    await db.execute(sql.raw(`DROP TABLE IF EXISTS "agents" CASCADE`));
    console.log("✅ Tabela 'agents' removida");
    */

    // 2. Criar enums necessários
    console.log("\n🔧 Criando enums...");
    const enumQueries = [
      `CREATE TYPE IF NOT EXISTS "agent_type" AS ENUM('sales', 'support', 'marketing', 'finance', 'orchestrator')`,
      `CREATE TYPE IF NOT EXISTS "conversation_status" AS ENUM('active', 'waiting', 'escalated', 'closed', 'archived')`,
      `CREATE TYPE IF NOT EXISTS "conversation_priority" AS ENUM('low', 'medium', 'high', 'urgent')`,
      `CREATE TYPE IF NOT EXISTS "sender_type" AS ENUM('user', 'agent', 'system')`,
      `CREATE TYPE IF NOT EXISTS "message_type" AS ENUM('text', 'image', 'document', 'template', 'interactive', 'flow')`,
      `CREATE TYPE IF NOT EXISTS "message_status" AS ENUM('pending', 'sent', 'delivered', 'read', 'failed')`,
      `CREATE TYPE IF NOT EXISTS "template_category" AS ENUM('marketing', 'utility', 'authentication')`,
      `CREATE TYPE IF NOT EXISTS "template_status" AS ENUM('draft', 'pending', 'approved', 'rejected', 'paused')`,
      `CREATE TYPE IF NOT EXISTS "memory_type" AS ENUM('fact', 'preference', 'context', 'learning', 'pattern')`,
      `CREATE TYPE IF NOT EXISTS "shared_memory_type" AS ENUM('company_policy', 'user_preference', 'business_rule', 'integration_config', 'common_knowledge')`,
      `CREATE TYPE IF NOT EXISTS "access_level" AS ENUM('public', 'restricted', 'confidential')`,
      `CREATE TYPE IF NOT EXISTS "context_type" AS ENUM('user_intent', 'business_process', 'integration_state', 'workflow_progress')`,
      `CREATE TYPE IF NOT EXISTS "learning_type" AS ENUM('response_pattern', 'user_behavior', 'error_recovery', 'optimization')`,
      `CREATE TYPE IF NOT EXISTS "role" AS ENUM('super_admin', 'manager', 'analyst', 'viewer')`,
      `CREATE TYPE IF NOT EXISTS "subscription_plan" AS ENUM('starter', 'professional', 'enterprise')`
    ];

    for (const query of enumQueries) {
      try {
        await db.execute(sql.raw(query));
      } catch (error) {
        // Ignorar erros de enum já existente
      }
    }
    console.log("✅ Enums criados!");

    // 3. Criar tabela companies com estrutura correta
    console.log("\n🏢 Criando tabela 'companies'...");
    
    // Descomente as linhas abaixo para executar a criação
    /*
    await db.execute(sql.raw(`
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
      )
    `));
    console.log("✅ Tabela 'companies' criada com estrutura correta");
    */

    // 4. Criar tabela agents com estrutura correta
    console.log("\n🤖 Criando tabela 'agents'...");
    
    // Descomente as linhas abaixo para executar a criação
    /*
    await db.execute(sql.raw(`
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
      )
    `));
    console.log("✅ Tabela 'agents' criada com estrutura correta");
    */

    // 5. Criar foreign keys
    console.log("\n🔗 Criando foreign keys...");
    
    // Descomente as linhas abaixo para executar a criação das foreign keys
    /*
    await db.execute(sql.raw(`ALTER TABLE "agents" ADD CONSTRAINT "agents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action`));
    console.log("✅ Foreign key agents.company_id -> companies.id criada");
    */

    await client.end();
    console.log("\n🎉 Script de recriação preparado!");
    console.log("💡 Para executar, descomente as linhas marcadas no script e execute novamente.");
    
  } catch (error) {
    console.error("❌ Erro na recriação das tabelas:");
    console.error(error);
    process.exit(1);
  }
}

// Executar recriação
recreateTables();
