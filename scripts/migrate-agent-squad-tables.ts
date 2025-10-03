#!/usr/bin/env tsx

/**
 * Script para migrar as tabelas do Agent Squad Framework
 * Executa o SQL de migração diretamente no banco de dados
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

// Configuração do banco
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL ou POSTGRES_URL não encontrada nas variáveis de ambiente');
  process.exit(1);
}

// Configuração SSL para Supabase
const sslConfig = {
  rejectUnauthorized: false
};

async function migrateAgentSquadTables() {
  console.log('🚀 Iniciando migração das tabelas do Agent Squad Framework...');
  
  // Conectar ao banco
  const sql = postgres(connectionString, {
    ssl: sslConfig,
    max: 1, // Usar apenas uma conexão para migração
  });
  
  const db = drizzle(sql);
  
  try {
    // Ler o arquivo SQL de migração
    const migrationPath = join(process.cwd(), 'drizzle', '0001_agent_squad_tables.sql');
    const migrationSQL = readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 Arquivo de migração carregado:', migrationPath);
    
    // Executar a migração
    console.log('⚡ Executando migração...');
    await sql.unsafe(migrationSQL);
    
    console.log('✅ Migração executada com sucesso!');
    
    // Verificar se as tabelas foram criadas
    console.log('🔍 Verificando tabelas criadas...');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE 'agent_%' OR table_name LIKE 'intent_%' OR table_name LIKE 'streaming_%'
      ORDER BY table_name;
    `;
    
    console.log('📊 Tabelas do Agent Squad encontradas:');
    tables.forEach((table: any) => {
      console.log(`  - ${table.table_name}`);
    });
    
    // Verificar enums criados
    const enums = await sql`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      AND typname LIKE '%agent_squad%' OR typname LIKE '%memory%' OR typname LIKE '%intent%' OR typname LIKE '%streaming%'
      ORDER BY typname;
    `;
    
    console.log('🏷️  Enums criados:');
    enums.forEach((enumType: any) => {
      console.log(`  - ${enumType.typname}`);
    });
    
    console.log('🎉 Migração do Agent Squad Framework concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    throw error;
  } finally {
    // Fechar conexão
    await sql.end();
  }
}

// Executar migração
migrateAgentSquadTables()
  .then(() => {
    console.log('✅ Script de migração finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Falha na migração:', error);
    process.exit(1);
  });
