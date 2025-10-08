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

async function testDatabaseConnection() {
  console.log("🔍 Testando conexão com o banco de dados...");
  
  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error("❌ Erro: DATABASE_URL ou POSTGRES_URL não está definida");
    console.log("📝 Por favor, configure as variáveis de ambiente no arquivo .env.local");
    process.exit(1);
  }

  console.log("📡 String de conexão encontrada");
  console.log("🔗 Conectando ao banco de dados...");

  try {
    // Criar cliente postgres
    const client = postgres(connectionString);
    
    // Criar instância do drizzle
    const db = drizzle(client, { 
      schema: {
        ...schema,
        ...memorySchema,
        ...authSchema,
      }
    });

    // Testar conexão básica
    console.log("🧪 Testando query básica...");
    const result = await db.execute(sql`SELECT 1 as test`);
    console.log("✅ Conexão básica funcionando:", result);

    // Testar se as tabelas existem
    console.log("🧪 Verificando tabelas do schema...");
    const tablesResult = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log("📊 Tabelas encontradas:");
    tablesResult.forEach((row: any) => {
      console.log(`  - ${row.table_name}`);
    });

    // Testar inserção em uma tabela (se existir)
    try {
      console.log("🧪 Testando inserção na tabela companies...");
      const testCompany = await db.insert(schema.companies).values({
        name: "Test Company",
        uazToken: "test-token",
        uazAdminToken: "test-admin-token",
      }).returning();
      
      console.log("✅ Inserção funcionando:", testCompany);
      
      // Limpar o teste
      await db.delete(schema.companies).where(sql`name = 'Test Company'`);
      console.log("🧹 Dados de teste removidos");
      
    } catch (error) {
      console.log("⚠️  Inserção falhou (tabela pode não existir ainda):", (error as Error).message);
    }

    // Fechar conexão
    await client.end();
    console.log("✅ Conexão com banco de dados validada com sucesso!");
    console.log("🚀 Pronto para executar migrações!");
    
  } catch (error) {
    console.error("❌ Erro na conexão com banco de dados:");
    console.error(error);
    process.exit(1);
  }
}

// Executar teste
testDatabaseConnection();
