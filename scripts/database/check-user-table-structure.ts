#!/usr/bin/env tsx

import { config } from 'dotenv';
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

async function checkUserTableStructure() {
  try {
    console.log('🔍 Verificando estrutura da tabela "user"...');
    
    // Verificar colunas da tabela user
    const columns = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'user' 
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);
    
    console.log('📋 Colunas da tabela "user":');
    columns.forEach((col: any, index: number) => {
      console.log(`${index + 1}. ${col.column_name} (${col.data_type}) - ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Verificar se existe tabela users
    const usersExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    console.log(`\n🔍 Tabela "users" existe: ${usersExists[0].exists}`);
    
    // Verificar dados na tabela user
    const userCount = await db.execute(sql`SELECT COUNT(*) as count FROM "user"`);
    console.log(`\n📊 Total de registros na tabela "user": ${userCount[0].count}`);
    
    if (userCount[0].count > 0) {
      console.log('\n📋 Primeiros registros na tabela "user":');
      const sampleUsers = await db.execute(sql`SELECT * FROM "user" LIMIT 3`);
      sampleUsers.forEach((user: any, index: number) => {
        console.log(`\nUsuário ${index + 1}:`);
        console.log(JSON.stringify(user, null, 2));
      });
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar estrutura:', error);
    process.exit(1);
  }
}

checkUserTableStructure();
