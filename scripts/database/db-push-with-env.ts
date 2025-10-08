#!/usr/bin/env tsx

import { config } from 'dotenv';
import { execSync } from 'child_process';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

console.log('🔧 Carregando variáveis de ambiente...');
console.log('📡 DATABASE_URL configurada:', !!process.env.DATABASE_URL);
console.log('📡 POSTGRES_URL configurada:', !!process.env.POSTGRES_URL);

try {
  console.log('🚀 Executando drizzle-kit push...');
  
  execSync('npx drizzle-kit push', { 
    stdio: 'inherit',
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_TLS_REJECT_UNAUTHORIZED: '0' // Desabilitar verificação SSL para Supabase
    }
  });
  
  console.log('✅ Drizzle-kit push executado com sucesso!');
  
} catch (error) {
  console.error('❌ Erro no drizzle-kit push:', error.message);
  
  // Tentar abordagem alternativa com variáveis de ambiente explícitas
  console.log('🔄 Tentando abordagem alternativa...');
  
  try {
    const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    execSync(`DATABASE_URL="${databaseUrl}" npx drizzle-kit push`, { 
      stdio: 'inherit',
      cwd: process.cwd(),
      env: {
        ...process.env,
        NODE_TLS_REJECT_UNAUTHORIZED: '0'
      }
    });
    
    console.log('✅ Abordagem alternativa funcionou!');
    
  } catch (altError) {
    console.error('❌ Abordagem alternativa também falhou:', altError.message);
    console.log('💡 Recomendação: Verifique se a DATABASE_URL está correta');
    process.exit(1);
  }
}
