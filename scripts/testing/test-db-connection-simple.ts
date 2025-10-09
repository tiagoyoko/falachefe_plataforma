#!/usr/bin/env tsx

import { config } from 'dotenv';
import { resolve } from 'path';
import postgres from 'postgres';

config({ path: resolve(process.cwd(), '.env.local') });

async function testConnection() {
  console.log('🔍 Testando conexão com o banco de dados...\n');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não configurada!');
    process.exit(1);
  }

  console.log('📋 URL do banco (parcial):', databaseUrl.substring(0, 50) + '...\n');

  let client;
  try {
    client = postgres(databaseUrl, {
      max: 1,
      ssl: 'require',
      connect_timeout: 10
    });

    // Teste simples
    const result = await client`SELECT NOW() as current_time, version() as version`;
    
    console.log('✅ Conexão bem-sucedida!');
    console.log('   Hora atual no banco:', result[0].current_time);
    console.log('   Versão PostgreSQL:', result[0].version.split(' ').slice(0, 2).join(' '));
    
    await client.end();
    console.log('\n✅ Todas as verificações passaram!\n');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erro ao conectar ao banco de dados:');
    
    if (error instanceof Error) {
      console.error('   Tipo:', error.name);
      console.error('   Mensagem:', error.message);
      
      if ('code' in error) {
        console.error('   Código:', (error as any).code);
      }
    }

    console.log('\n📝 Próximos passos:');
    console.log('   1. Acesse https://supabase.com/dashboard');
    console.log('   2. Vá em Settings > Database');
    console.log('   3. Copie a nova Connection String (com a senha)');
    console.log('   4. Atualize as variáveis de ambiente:');
    console.log('      - .env.local (local)');
    console.log('      - Vercel (produção): vercel env add DATABASE_URL');
    console.log('      - Vercel (produção): vercel env add POSTGRES_URL');
    console.log('      - Vercel (produção): vercel env add POSTGRES_URL_NON_POOLING\n');

    if (client) {
      await client.end();
    }
    process.exit(1);
  }
}

testConnection();


