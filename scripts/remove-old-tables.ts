#!/usr/bin/env tsx

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

async function removeOldTables() {
  console.log("🗑️  Removendo tabelas do projeto anterior...");
  
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error("❌ Erro: DATABASE_URL ou POSTGRES_URL não está definida");
    process.exit(1);
  }

  try {
    // Criar cliente postgres
    const client = postgres(connectionString);
    const db = drizzle(client);

    // Lista das tabelas que devem ser removidas
    const tablesToRemove = [
      'abTestConfigs',
      'abTestResults', 
      'agentCommands',
      'agentKnowledgeAssociations',
      'agentProfiles',
      'agentSettings',
      'categories',
      'classificationResults',
      'classificationStats',
      'conversationMessages',
      'conversationSessions',
      'conversationSummaries',
      'defaultCategories',
      'knowledgeChunks',
      'knowledgeDocuments',
      'knowledgeEmbeddings',
      'onboardingPreferences',
      'onboardingTemplates',
      'ragChunks',
      'ragDocuments',
      'ragEmbeddings',
      'ragSources',
      'spreadsheets',
      'transactions',
      'userSettings',
      'whatsappMessages'
    ];

    console.log(`🗑️  Removendo ${tablesToRemove.length} tabelas do projeto anterior...`);

    for (const tableName of tablesToRemove) {
      try {
        console.log(`🗑️  Removendo tabela: ${tableName}`);
        await db.execute(sql.raw(`DROP TABLE IF EXISTS "${tableName}" CASCADE`));
        console.log(`  ✅ ${tableName} removida com sucesso`);
      } catch (error) {
        console.log(`  ⚠️  Erro ao remover ${tableName}:`, (error as Error).message);
      }
    }

    // Verificar tabelas restantes
    console.log("\n📊 Verificando tabelas restantes...");
    const remainingTables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log("✅ Tabelas mantidas:");
    remainingTables.forEach((row: any) => {
      console.log(`  ✅ ${row.table_name}`);
    });

    await client.end();
    console.log("\n🎉 Limpeza do banco concluída com sucesso!");
    console.log("🚀 Agora você pode executar as migrações do novo projeto.");
    
  } catch (error) {
    console.error("❌ Erro na remoção das tabelas:");
    console.error(error);
    process.exit(1);
  }
}

// Executar remoção
removeOldTables();
