#!/usr/bin/env tsx

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

async function cleanDatabase() {
  console.log("🧹 Limpando banco de dados - removendo tabelas do projeto anterior...");
  
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
    
    // Listar todas as tabelas
    const allTables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    console.log("📋 Tabelas encontradas:");
    allTables.forEach((row: any) => {
      console.log(`  - ${row.table_name}`);
    });

    // Tabelas que DEVEM ser mantidas (do novo projeto Falachefe)
    const keepTables = [
      'companies', 'users', 'agents', 'conversations', 'messages', 'templates',
      'agent_memories', 'shared_memories', 'conversation_contexts', 'agent_learnings',
      'admin_users', 'audit_logs',
      // Tabelas do Better Auth (autenticação)
      'user', 'session', 'account', 'verification'
    ];

    // Tabelas que DEVEM ser removidas (do projeto anterior)
    const tablesToRemove = allTables
      .filter((row: any) => !keepTables.includes(row.table_name))
      .map((row: any) => row.table_name);

    if (tablesToRemove.length === 0) {
      console.log("✅ Nenhuma tabela desnecessária encontrada!");
    } else {
      console.log("\n🗑️  Tabelas que serão removidas:");
      tablesToRemove.forEach(tableName => {
        console.log(`  ❌ ${tableName}`);
      });

      console.log("\n⚠️  ATENÇÃO: Esta operação irá remover permanentemente as tabelas listadas acima!");
      console.log("💡 Para continuar, descomente as linhas de remoção no script.");
      
      // Descomente as linhas abaixo para executar a remoção
      /*
      for (const tableName of tablesToRemove) {
        console.log(`🗑️  Removendo tabela: ${tableName}`);
        await db.execute(sql.raw(`DROP TABLE IF EXISTS "${tableName}" CASCADE`));
      }
      console.log("✅ Tabelas removidas com sucesso!");
      */
    }

    // Verificar tipos/enums que podem ser removidos
    console.log("\n🔍 Verificando tipos/enums...");
    const allTypes = await db.execute(sql`
      SELECT typname 
      FROM pg_type 
      WHERE typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND typtype = 'e'
      ORDER BY typname
    `);
    
    console.log("📋 Enums encontrados:");
    allTypes.forEach((row: any) => {
      console.log(`  - ${row.typname}`);
    });

    // Enums que DEVEM ser mantidos (do novo projeto)
    const keepEnums = [
      'access_level', 'agent_type', 'context_type', 'conversation_priority',
      'conversation_status', 'learning_type', 'memory_type', 'message_status',
      'message_type', 'role', 'sender_type', 'shared_memory_type',
      'subscription_plan', 'template_category', 'template_status'
    ];

    // Enums que DEVEM ser removidos
    const enumsToRemove = allTypes
      .filter((row: any) => !keepEnums.includes(row.typname))
      .map((row: any) => row.typname);

    if (enumsToRemove.length > 0) {
      console.log("\n🗑️  Enums que serão removidos:");
      enumsToRemove.forEach(enumName => {
        console.log(`  ❌ ${enumName}`);
      });
      
      // Descomente as linhas abaixo para executar a remoção de enums
      /*
      for (const enumName of enumsToRemove) {
        console.log(`🗑️  Removendo enum: ${enumName}`);
        await db.execute(sql.raw(`DROP TYPE IF EXISTS "${enumName}" CASCADE`));
      }
      console.log("✅ Enums removidos com sucesso!");
      */
    } else {
      console.log("✅ Nenhum enum desnecessário encontrado!");
    }

    await client.end();
    console.log("\n✅ Verificação de limpeza concluída!");
    console.log("💡 Para executar a remoção, descomente as linhas no script e execute novamente.");
    
  } catch (error) {
    console.error("❌ Erro na limpeza do banco:");
    console.error(error);
    process.exit(1);
  }
}

// Executar limpeza
cleanDatabase();
