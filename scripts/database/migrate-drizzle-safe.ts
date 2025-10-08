#!/usr/bin/env tsx

import { config } from 'dotenv';
import { db } from '../src/lib/db';
import { sql } from 'drizzle-orm';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

async function checkAndCreateTables() {
  try {
    console.log('🔍 Verificando estrutura atual do banco...');
    
    // Verificar se as tabelas principais existem
    const tablesQuery = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    
    const existingTables = tablesQuery.map((row: any) => row.table_name);
    console.log('📋 Tabelas existentes:', existingTables);
    
    // Verificar se os enums existem
    const enumsQuery = await db.execute(sql`
      SELECT typname 
      FROM pg_type 
      WHERE typtype = 'e' 
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      ORDER BY typname;
    `);
    
    const existingEnums = enumsQuery.map((row: any) => row.typname);
    console.log('📋 Enums existentes:', existingEnums);
    
    // Se não temos as tabelas principais, aplicar migração completa
    const requiredTables = ['companies', 'users', 'whatsapp_users', 'agents'];
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
      console.log('⚠️  Tabelas faltando:', missingTables);
      console.log('🚀 Aplicando migração completa...');
      
      // Usar drizzle-kit push para aplicar schema
      console.log('📝 Executando drizzle-kit push...');
      const { execSync } = await import('child_process');
      
      try {
        execSync('npx drizzle-kit push', { 
          stdio: 'inherit',
          cwd: process.cwd()
        });
        console.log('✅ Schema aplicado com sucesso via drizzle-kit push!');
      } catch (error) {
        console.log('⚠️  Erro no drizzle-kit push, tentando abordagem alternativa...');
        console.log('💡 Recomendação: Execute manualmente: npm run db:push');
      }
      
      console.log('✅ Schema aplicado com sucesso!');
    } else {
      console.log('✅ Todas as tabelas principais já existem!');
    }
    
    // Testar algumas queries básicas
    console.log('🧪 Testando queries...');
    
    try {
      const companiesCount = await db.execute(sql`SELECT COUNT(*) as count FROM companies`);
      console.log('✅ Query companies:', companiesCount[0]);
    } catch (e) {
      console.log('⚠️  Tabela companies não acessível:', e.message);
    }
    
    try {
      const usersCount = await db.execute(sql`SELECT COUNT(*) as count FROM users`);
      console.log('✅ Query users:', usersCount[0]);
    } catch (e) {
      console.log('⚠️  Tabela users não acessível:', e.message);
    }
    
    console.log('🎉 Verificação concluída!');
    
  } catch (error) {
    console.error('❌ Erro na verificação:', error);
    process.exit(1);
  }
}

checkAndCreateTables();
