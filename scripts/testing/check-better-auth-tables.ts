#!/usr/bin/env tsx

/**
 * Script para verificar se as tabelas do Better Auth existem no banco de dados
 */

import { config } from 'dotenv';
import { resolve } from 'path';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), '.env.local') });

async function checkBetterAuthTables() {
  console.log('🔍 Verificando tabelas do Better Auth no banco de dados...\n');

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ DATABASE_URL não configurada!');
    process.exit(1);
  }

  let client;
  try {
    // Criar conexão
    client = postgres(databaseUrl, {
      max: 1,
      ssl: 'require'
    });
    const db = drizzle(client);

    // Verificar tabelas do Better Auth
    const betterAuthTables = [
      'user',
      'session',
      'account',
      'verification'
    ];

    console.log('📋 Verificando tabelas necessárias:\n');

    let allTablesExist = true;
    for (const tableName of betterAuthTables) {
      const result = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = ${tableName}
        )
      `);

      const exists = result[0]?.exists === true;
      console.log(`   ${exists ? '✅' : '❌'} Tabela "${tableName}": ${exists ? 'existe' : 'NÃO existe'}`);
      
      if (!exists) {
        allTablesExist = false;
      }

      // Se a tabela existe, contar registros
      if (exists) {
        try {
          const countResult = await db.execute(sql`
            SELECT COUNT(*) as count FROM ${sql.identifier(tableName)}
          `);
          const count = countResult[0]?.count || 0;
          console.log(`      └─ ${count} registro(s)\n`);
        } catch (error) {
          console.log(`      └─ Erro ao contar registros: ${error instanceof Error ? error.message : 'Erro desconhecido'}\n`);
        }
      } else {
        console.log('');
      }
    }

    console.log('\n' + '='.repeat(80));
    if (allTablesExist) {
      console.log('✅ Todas as tabelas do Better Auth existem!');
    } else {
      console.log('❌ Algumas tabelas do Better Auth estão faltando.');
      console.log('\n📝 Para criar as tabelas:');
      console.log('   1. Execute: npm run db:push');
      console.log('   2. Ou execute: npx drizzle-kit push');
      console.log('   3. Ou execute as migrações manualmente no Supabase');
    }
    console.log('='.repeat(80) + '\n');

    await client.end();
    process.exit(allTablesExist ? 0 : 1);

  } catch (error) {
    console.error('\n❌ Erro ao verificar banco de dados:', error);
    if (client) {
      await client.end();
    }
    process.exit(1);
  }
}

// Executar verificação
checkBetterAuthTables().catch(error => {
  console.error('❌ Erro:', error);
  process.exit(1);
});


