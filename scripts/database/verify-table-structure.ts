#!/usr/bin/env tsx

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

async function verifyTableStructure() {
  console.log("🔍 Verificando estrutura das tabelas existentes...");
  
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error("❌ Erro: DATABASE_URL ou POSTGRES_URL não está definida");
    process.exit(1);
  }

  try {
    // Criar cliente postgres
    const client = postgres(connectionString);
    const db = drizzle(client);

    // Verificar estrutura da tabela companies
    console.log("\n📊 Verificando tabela 'companies'...");
    const companiesColumns = await db.execute(sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'companies'
      ORDER BY ordinal_position
    `);

    console.log("✅ Colunas atuais da tabela 'companies':");
    companiesColumns.forEach((row: any) => {
      console.log(`  - ${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    // Colunas esperadas para companies
    const expectedCompaniesColumns = [
      'id', 'name', 'domain', 'uaz_token', 'uaz_admin_token', 
      'subscription_plan', 'is_active', 'settings', 'created_at', 'updated_at'
    ];

    const currentCompaniesColumns = companiesColumns.map((row: any) => row.column_name);
    const missingCompaniesColumns = expectedCompaniesColumns.filter(col => !currentCompaniesColumns.includes(col));
    const extraCompaniesColumns = currentCompaniesColumns.filter(col => !expectedCompaniesColumns.includes(col));

    if (missingCompaniesColumns.length > 0) {
      console.log("\n❌ Colunas faltantes na tabela 'companies':");
      missingCompaniesColumns.forEach(col => console.log(`  - ${col}`));
    }
    if (extraCompaniesColumns.length > 0) {
      console.log("\n⚠️  Colunas extras na tabela 'companies':");
      extraCompaniesColumns.forEach(col => console.log(`  - ${col}`));
    }
    if (missingCompaniesColumns.length === 0 && extraCompaniesColumns.length === 0) {
      console.log("✅ Tabela 'companies' está correta!");
    }

    // Verificar estrutura da tabela agents
    console.log("\n📊 Verificando tabela 'agents'...");
    const agentsColumns = await db.execute(sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'agents'
      ORDER BY ordinal_position
    `);

    console.log("✅ Colunas atuais da tabela 'agents':");
    agentsColumns.forEach((row: any) => {
      console.log(`  - ${row.column_name}: ${row.data_type}${row.character_maximum_length ? `(${row.character_maximum_length})` : ''} ${row.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    // Colunas esperadas para agents
    const expectedAgentsColumns = [
      'id', 'company_id', 'name', 'type', 'description', 'system_prompt',
      'is_active', 'capabilities', 'config', 'created_at', 'updated_at'
    ];

    const currentAgentsColumns = agentsColumns.map((row: any) => row.column_name);
    const missingAgentsColumns = expectedAgentsColumns.filter(col => !currentAgentsColumns.includes(col));
    const extraAgentsColumns = currentAgentsColumns.filter(col => !expectedAgentsColumns.includes(col));

    if (missingAgentsColumns.length > 0) {
      console.log("\n❌ Colunas faltantes na tabela 'agents':");
      missingAgentsColumns.forEach(col => console.log(`  - ${col}`));
    }
    if (extraAgentsColumns.length > 0) {
      console.log("\n⚠️  Colunas extras na tabela 'agents':");
      extraAgentsColumns.forEach(col => console.log(`  - ${col}`));
    }
    if (missingAgentsColumns.length === 0 && extraAgentsColumns.length === 0) {
      console.log("✅ Tabela 'agents' está correta!");
    }

    // Verificar constraints e índices
    console.log("\n🔍 Verificando constraints...");
    const constraints = await db.execute(sql`
      SELECT 
        tc.constraint_name,
        tc.table_name,
        tc.constraint_type,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.table_schema = 'public'
      AND tc.table_name IN ('companies', 'agents')
      ORDER BY tc.table_name, tc.constraint_type
    `);

    console.log("✅ Constraints encontradas:");
    constraints.forEach((row: any) => {
      if (row.constraint_type === 'FOREIGN KEY') {
        console.log(`  - ${row.table_name}.${row.column_name} -> ${row.foreign_table_name}.${row.foreign_column_name}`);
      } else {
        console.log(`  - ${row.table_name}: ${row.constraint_type} (${row.constraint_name})`);
      }
    });

    // Verificar se os enums necessários existem
    console.log("\n🔍 Verificando enums necessários...");
    const requiredEnums = [
      'agent_type', 'conversation_status', 'conversation_priority', 
      'sender_type', 'message_type', 'message_status', 'template_category',
      'template_status', 'memory_type', 'shared_memory_type', 'access_level',
      'context_type', 'learning_type', 'role', 'subscription_plan'
    ];

    const existingEnums = await db.execute(sql`
      SELECT typname 
      FROM pg_type 
      WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND typtype = 'e'
      ORDER BY typname
    `);

    const existingEnumNames = existingEnums.map((row: any) => row.typname);
    const missingEnums = requiredEnums.filter(enumName => !existingEnumNames.includes(enumName));

    console.log("✅ Enums existentes:");
    existingEnumNames.forEach(enumName => console.log(`  - ${enumName}`));

    if (missingEnums.length > 0) {
      console.log("\n❌ Enums faltantes:");
      missingEnums.forEach(enumName => console.log(`  - ${enumName}`));
    } else {
      console.log("\n✅ Todos os enums necessários estão presentes!");
    }

    await client.end();
    console.log("\n🎯 Verificação de estrutura concluída!");
    
    // Resumo das ações necessárias
    const totalIssues = missingCompaniesColumns.length + missingAgentsColumns.length + missingEnums.length;
    if (totalIssues > 0) {
      console.log(`\n📋 Resumo: ${totalIssues} problemas encontrados que precisam ser corrigidos.`);
      console.log("💡 Execute o script de correção para resolver os problemas.");
    } else {
      console.log("\n🎉 Todas as tabelas estão com a estrutura correta!");
    }
    
  } catch (error) {
    console.error("❌ Erro na verificação:");
    console.error(error);
    process.exit(1);
  }
}

// Executar verificação
verifyTableStructure();
