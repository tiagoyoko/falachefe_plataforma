#!/usr/bin/env tsx

// Carregar variáveis de ambiente
import { config } from 'dotenv';
config({ path: '.env.local' });

import postgres from 'postgres';

async function checkUsersTable() {
  console.log('🔍 Verificando se a tabela users existe...');
  
  const sql = postgres(process.env.DATABASE_URL!);
  
  try {
    // Verificar se a tabela users existe
    const result = await sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `;
    
    if (result.length === 0) {
      console.log('❌ Tabela users não existe!');
      
      // Verificar todas as tabelas existentes
      const allTables = await sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `;
      
      console.log('📋 Tabelas existentes:');
      allTables.forEach(table => console.log(`  - ${table.table_name}`));
      
    } else {
      console.log('✅ Tabela users existe!');
      console.log('📊 Colunas da tabela users:');
      result.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar tabela users:', error);
  } finally {
    await sql.end();
  }
}

checkUsersTable();
