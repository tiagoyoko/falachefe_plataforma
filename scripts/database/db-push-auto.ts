#!/usr/bin/env tsx

import { config } from 'dotenv';
import { spawn } from 'child_process';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

console.log('🔧 Carregando variáveis de ambiente...');
console.log('📡 DATABASE_URL configurada:', !!process.env.DATABASE_URL);
console.log('📡 POSTGRES_URL configurada:', !!process.env.POSTGRES_URL);

try {
  console.log('🚀 Executando drizzle-kit push com respostas automáticas...');
  
  const child = spawn('npx', ['drizzle-kit', 'push'], {
    stdio: ['pipe', 'inherit', 'inherit'],
    cwd: process.cwd(),
    env: {
      ...process.env,
      NODE_TLS_REJECT_UNAUTHORIZED: '0'
    }
  });

  // Responder automaticamente às perguntas
  child.stdin.write('accounts\n'); // Criar tabela accounts
  child.stdin.write('users\n'); // Criar tabela users  
  child.stdin.write('whatsapp_users\n'); // Criar tabela whatsapp_users
  child.stdin.write('sessions\n'); // Criar tabela sessions
  child.stdin.write('verifications\n'); // Criar tabela verifications
  
  child.stdin.end();

  child.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Drizzle-kit push executado com sucesso!');
    } else {
      console.log(`❌ Drizzle-kit push falhou com código: ${code}`);
    }
  });

} catch (error) {
  console.error('❌ Erro no drizzle-kit push:', error.message);
  process.exit(1);
}
