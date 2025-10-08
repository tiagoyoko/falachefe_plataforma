#!/usr/bin/env tsx

import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { sql } from "drizzle-orm";
import * as schema from "../src/lib/schema";
import * as memorySchema from "../src/lib/memory-schema";
import * as authSchema from "../src/lib/auth-schema";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

async function setupDatabase() {
  console.log("🚀 Configurando banco de dados...");
  
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

    console.log("📊 Verificando estrutura atual do banco...");
    
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
      console.log("📋 Tabelas existentes encontradas:");
      existingTables.forEach((row: any) => {
        console.log(`  ✅ ${row.table_name}`);
      });
      
      console.log("⚠️  Tabelas já existem. Execute 'npm run db:generate' e 'npm run db:migrate' para atualizar.");
    } else {
      console.log("📝 Nenhuma tabela encontrada. Execute as migrações:");
      console.log("   1. npm run db:generate");
      console.log("   2. npm run db:migrate");
    }

    // Testar conexão básica
    console.log("🧪 Testando conexão...");
    await db.execute(sql`SELECT 1`);
    console.log("✅ Conexão funcionando!");

    // Verificar extensões necessárias
    console.log("🔧 Verificando extensões PostgreSQL...");
    const extensions = await db.execute(sql`
      SELECT extname 
      FROM pg_extension 
      WHERE extname IN ('uuid-ossp', 'pgcrypto')
    `);
    
    console.log("📦 Extensões disponíveis:");
    extensions.forEach((row: any) => {
      console.log(`  ✅ ${row.extname}`);
    });

    if (extensions.length === 0) {
      console.log("⚠️  Extensões uuid-ossp e pgcrypto podem ser necessárias");
      console.log("   Execute no Supabase SQL Editor:");
      console.log("   CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";");
      console.log("   CREATE EXTENSION IF NOT EXISTS pgcrypto;");
    }

    await client.end();
    console.log("✅ Verificação do banco de dados concluída!");
    
  } catch (error) {
    console.error("❌ Erro na configuração do banco:");
    console.error(error);
    process.exit(1);
  }
}

// Executar setup
setupDatabase();
