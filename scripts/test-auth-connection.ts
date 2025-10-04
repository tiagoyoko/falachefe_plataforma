#!/usr/bin/env tsx

/**
 * Script para testar conectividade com Better Auth
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), '.env.local') });

const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log('🔍 Testando conectividade com Better Auth...\n');
console.log(`Base URL: ${baseURL}`);

async function testAuthEndpoints() {
  const endpoints = [
    '/api/auth/session',
    '/api/auth/sign-in/email',
    '/api/auth/sign-up/email',
    '/api/auth/sign-out',
  ];

  for (const endpoint of endpoints) {
    try {
      const url = `${baseURL}${endpoint}`;
      console.log(`\n📡 Testando: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2)}`);
      
      if (response.status === 405) {
        console.log('   ✅ Endpoint existe (Method Not Allowed é esperado para GET)');
      } else if (response.status === 200) {
        console.log('   ✅ Endpoint funcionando');
      } else {
        console.log('   ⚠️  Status inesperado');
      }
      
    } catch (error) {
      console.log(`   ❌ Erro: ${error.message}`);
    }
  }
}

async function testCORS() {
  console.log('\n🌐 Testando CORS...');
  
  try {
    const response = await fetch(`${baseURL}/api/auth/session`, {
      method: 'OPTIONS',
      headers: {
        'Origin': baseURL,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type',
      },
    });
    
    console.log(`   Status: ${response.status}`);
    console.log(`   CORS Headers:`);
    console.log(`   - Access-Control-Allow-Origin: ${response.headers.get('Access-Control-Allow-Origin')}`);
    console.log(`   - Access-Control-Allow-Methods: ${response.headers.get('Access-Control-Allow-Methods')}`);
    console.log(`   - Access-Control-Allow-Headers: ${response.headers.get('Access-Control-Allow-Headers')}`);
    
  } catch (error) {
    console.log(`   ❌ Erro CORS: ${error.message}`);
  }
}

async function main() {
  await testAuthEndpoints();
  await testCORS();
  
  console.log('\n📋 Próximos passos:');
  console.log('1. Verifique se o servidor está rodando');
  console.log('2. Abra o console do navegador para ver erros');
  console.log('3. Teste acessar diretamente: http://localhost:3000/api/auth/session');
}

main().catch(console.error);
