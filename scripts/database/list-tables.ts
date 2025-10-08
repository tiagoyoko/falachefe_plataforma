#!/usr/bin/env tsx

import { config } from 'dotenv';
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

async function listTables() {
  try {
    console.log('🔍 Listando tabelas existentes no banco...');
    
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    console.log('📋 Tabelas encontradas:');
    tables.forEach((table: any, index: number) => {
      console.log(`${index + 1}. ${table.table_name}`);
    });
    
    console.log(`\n📊 Total: ${tables.length} tabelas`);
    
    // Verificar se as tabelas específicas existem
    const requiredTables = ['users', 'user_onboarding', 'user'];
    console.log('\n🔍 Verificando tabelas específicas:');
    
    for (const tableName of requiredTables) {
      const exists = tables.some((table: any) => table.table_name === tableName);
      console.log(`${exists ? '✅' : '❌'} ${tableName}: ${exists ? 'EXISTE' : 'NÃO EXISTE'}`);
    }
    
  } catch (error) {
    console.error('❌ Erro ao listar tabelas:', error);
    process.exit(1);
  }
}

listTables();
