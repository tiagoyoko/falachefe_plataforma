#!/usr/bin/env tsx

import { config } from 'dotenv';
import { eq } from 'drizzle-orm';
import { db } from '../src/lib/db';
import { companies, users, agents } from '../src/lib/schema-consolidated';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

async function testDrizzleConnection() {
  try {
    console.log('🔍 Testando conexão com Drizzle...');
    
    // Teste básico de conexão
    const result = await db.execute('SELECT 1 as test');
    console.log('✅ Conexão com banco estabelecida:', result);
    
    // Teste de query simples
    const companiesCount = await db.select().from(companies).limit(1);
    console.log('✅ Query de companies executada:', companiesCount.length, 'registros');
    
    // Teste de query com joins
    const agentsWithCompany = await db
      .select({
        agentName: agents.name,
        agentType: agents.type,
        companyName: companies.name
      })
      .from(agents)
      .leftJoin(companies, eq(agents.companyId, companies.id))
      .limit(1);
    
    console.log('✅ Query com join executada:', agentsWithCompany.length, 'registros');
    
    console.log('🎉 Todos os testes de conexão passaram!');
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    process.exit(1);
  }
}

testDrizzleConnection();

