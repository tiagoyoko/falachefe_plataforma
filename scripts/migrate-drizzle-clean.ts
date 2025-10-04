#!/usr/bin/env tsx

import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from '../src/lib/db';

async function runMigrations() {
  try {
    console.log('🚀 Iniciando migração do Drizzle...');
    
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Migração concluída com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  }
}

runMigrations();

