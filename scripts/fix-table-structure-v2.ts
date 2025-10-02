#!/usr/bin/env tsx

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

async function fixTableStructureV2() {
  console.log("🔧 Corrigindo estrutura das tabelas (v2)...");
  
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error("❌ Erro: DATABASE_URL ou POSTGRES_URL não está definida");
    process.exit(1);
  }

  try {
    // Criar cliente postgres
    const client = postgres(connectionString);
    const db = drizzle(client);

    // Primeiro, verificar enums existentes
    console.log("🔍 Verificando enums existentes...");
    const existingEnums = await db.execute(sql`
      SELECT typname 
      FROM pg_type 
      WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND typtype = 'e'
      ORDER BY typname
    `);

    const existingEnumNames = existingEnums.map((row: any) => row.typname);
    console.log("✅ Enums existentes:", existingEnumNames);

    // Criar enums necessários um por vez
    console.log("\n🔧 Criando enums necessários...");
    const enumQueries = [
      { name: 'agent_type', values: "('sales', 'support', 'marketing', 'finance', 'orchestrator')" },
      { name: 'conversation_status', values: "('active', 'waiting', 'escalated', 'closed', 'archived')" },
      { name: 'conversation_priority', values: "('low', 'medium', 'high', 'urgent')" },
      { name: 'sender_type', values: "('user', 'agent', 'system')" },
      { name: 'message_type', values: "('text', 'image', 'document', 'template', 'interactive', 'flow')" },
      { name: 'message_status', values: "('pending', 'sent', 'delivered', 'read', 'failed')" },
      { name: 'template_category', values: "('marketing', 'utility', 'authentication')" },
      { name: 'template_status', values: "('draft', 'pending', 'approved', 'rejected', 'paused')" },
      { name: 'memory_type', values: "('fact', 'preference', 'context', 'learning', 'pattern')" },
      { name: 'shared_memory_type', values: "('company_policy', 'user_preference', 'business_rule', 'integration_config', 'common_knowledge')" },
      { name: 'access_level', values: "('public', 'restricted', 'confidential')" },
      { name: 'context_type', values: "('user_intent', 'business_process', 'integration_state', 'workflow_progress')" },
      { name: 'learning_type', values: "('response_pattern', 'user_behavior', 'error_recovery', 'optimization')" },
      { name: 'role', values: "('super_admin', 'manager', 'analyst', 'viewer')" },
      { name: 'subscription_plan', values: "('starter', 'professional', 'enterprise')" }
    ];

    for (const enumDef of enumQueries) {
      if (!existingEnumNames.includes(enumDef.name)) {
        try {
          await db.execute(sql.raw(`CREATE TYPE "${enumDef.name}" AS ENUM${enumDef.values}`));
          console.log(`✅ Enum '${enumDef.name}' criado`);
        } catch (error) {
          console.log(`⚠️  Enum '${enumDef.name}' já existe ou erro:`, (error as Error).message);
        }
      } else {
        console.log(`✅ Enum '${enumDef.name}' já existe`);
      }
    }

    // Verificar novamente os enums após criação
    console.log("\n🔍 Verificando enums após criação...");
    const finalEnums = await db.execute(sql`
      SELECT typname 
      FROM pg_type 
      WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND typtype = 'e'
      ORDER BY typname
    `);

    const finalEnumNames = finalEnums.map((row: any) => row.typname);
    console.log("✅ Enums finais:", finalEnumNames);

    // Criar tabela companies
    console.log("\n🏢 Criando tabela 'companies'...");
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

    // Criar tabela agents
    console.log("\n🤖 Criando tabela 'agents'...");
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

    // Criar foreign key
    console.log("\n🔗 Criando foreign key...");
    await db.execute(sql.raw(`ALTER TABLE "agents" ADD CONSTRAINT "agents_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action`));
    console.log("✅ Foreign key agents.company_id -> companies.id criada");

    // Verificar tabelas criadas
    console.log("\n📊 Verificando tabelas criadas...");
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log("✅ Tabelas existentes:");
    tables.forEach((row: any) => {
      console.log(`  ✅ ${row.table_name}`);
    });

    // Testar inserção de dados de exemplo
    console.log("\n🧪 Testando inserção de dados...");
    const testCompany = await db.execute(sql`
      INSERT INTO "companies" ("name", "uaz_token", "uaz_admin_token") 
      VALUES ('Empresa Teste', 'test_token', 'test_admin_token') 
      RETURNING id, name
    `);
    console.log("✅ Empresa de teste criada:", testCompany[0]);

    const testAgent = await db.execute(sql`
      INSERT INTO "agents" ("company_id", "name", "type", "system_prompt") 
      VALUES (${testCompany[0].id}, 'Agente Teste', 'sales', 'Você é um agente de vendas especializado.') 
      RETURNING id, name, type
    `);
    console.log("✅ Agente de teste criado:", testAgent[0]);

    // Limpar dados de teste
    await db.execute(sql`DELETE FROM "agents" WHERE "company_id" = ${testCompany[0].id}`);
    await db.execute(sql`DELETE FROM "companies" WHERE "id" = ${testCompany[0].id}`);
    console.log("✅ Dados de teste removidos");

    await client.end();
    console.log("\n🎉 Estrutura das tabelas corrigida com sucesso!");
    console.log("🚀 Agora você pode criar as tabelas restantes usando o script de migração.");
    
  } catch (error) {
    console.error("❌ Erro na correção da estrutura:");
    console.error(error);
    process.exit(1);
  }
}

// Executar correção
fixTableStructureV2();
