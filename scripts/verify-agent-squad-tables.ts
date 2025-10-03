#!/usr/bin/env tsx

/**
 * Script para verificar se as tabelas do Agent Squad Framework foram criadas corretamente
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

// Configuração do banco
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL ou POSTGRES_URL não encontrada nas variáveis de ambiente');
  process.exit(1);
}

// Configuração SSL para Supabase
const sslConfig = {
  rejectUnauthorized: false
};

async function verifyAgentSquadTables() {
  console.log('🔍 Verificando tabelas do Agent Squad Framework...');
  
  // Conectar ao banco
  const sql = postgres(connectionString, {
    ssl: sslConfig,
    max: 1,
  });
  
  try {
    // Verificar tabelas principais
    const tables = await sql`
      SELECT 
        table_name,
        table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (
        table_name LIKE 'agent_%' OR 
        table_name LIKE 'intent_%' OR 
        table_name LIKE 'streaming_%'
      )
      ORDER BY table_name;
    `;
    
    console.log('📊 Tabelas encontradas:');
    tables.forEach((table: any) => {
      console.log(`  ✅ ${table.table_name} (${table.table_type})`);
    });
    
    // Verificar colunas das tabelas principais
    const agentSquadAgents = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'agent_squad_agents'
      ORDER BY ordinal_position;
    `;
    
    console.log('\n🏗️  Estrutura da tabela agent_squad_agents:');
    agentSquadAgents.forEach((col: any) => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    // Verificar enums
    const enums = await sql`
      SELECT 
        t.typname as enum_name,
        e.enumlabel as enum_value
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typtype = 'e' 
      AND (
        t.typname LIKE '%agent_squad%' OR 
        t.typname LIKE '%memory%' OR 
        t.typname LIKE '%intent%' OR 
        t.typname LIKE '%streaming%'
      )
      ORDER BY t.typname, e.enumsortorder;
    `;
    
    console.log('\n🏷️  Enums criados:');
    let currentEnum = '';
    enums.forEach((enumItem: any) => {
      if (enumItem.enum_name !== currentEnum) {
        currentEnum = enumItem.enum_name;
        console.log(`  ${currentEnum}:`);
      }
      console.log(`    - ${enumItem.enum_value}`);
    });
    
    // Verificar índices
    const indexes = await sql`
      SELECT 
        indexname,
        tablename,
        indexdef
      FROM pg_indexes 
      WHERE schemaname = 'public'
      AND (
        tablename LIKE 'agent_%' OR 
        tablename LIKE 'intent_%' OR 
        tablename LIKE 'streaming_%'
      )
      ORDER BY tablename, indexname;
    `;
    
    console.log('\n📈 Índices criados:');
    indexes.forEach((idx: any) => {
      console.log(`  - ${idx.indexname} (${idx.tablename})`);
    });
    
    // Testar inserção de dados de exemplo
    console.log('\n🧪 Testando inserção de dados...');
    
    // Inserir um agente de exemplo
    const testAgent = await sql`
      INSERT INTO agent_squad_agents (type, name, description, capabilities, config)
      VALUES (
        'financial',
        'Financial Agent Test',
        'Agente financeiro para testes',
        '["expense_tracking", "revenue_analysis", "budget_planning"]'::jsonb,
        '{"model": "gpt-4", "temperature": 0.7}'::jsonb
      )
      RETURNING id, name, type;
    `;
    
    console.log('✅ Agente de teste inserido:', testAgent[0]);
    
    // Inserir memória de exemplo
    const testMemory = await sql`
      INSERT INTO agent_squad_memory (conversation_id, agent_id, category, memory_data)
      VALUES (
        'test-conversation-123',
        ${testAgent[0].id},
        'individual',
        '{"context": "teste de memória", "timestamp": "2025-01-29"}'::jsonb
      )
      RETURNING id, conversation_id, category;
    `;
    
    console.log('✅ Memória de teste inserida:', testMemory[0]);
    
    // Inserir classificação de intenção de exemplo
    const testIntent = await sql`
      INSERT INTO agent_squad_intents (conversation_id, message_id, intent_type, confidence, context)
      VALUES (
        'test-conversation-123',
        'msg-123',
        'add_expense',
        0.95,
        '{"amount": 100, "category": "office_supplies"}'::jsonb
      )
      RETURNING id, intent_type, confidence;
    `;
    
    console.log('✅ Classificação de intenção inserida:', testIntent[0]);
    
    // Limpar dados de teste
    await sql`DELETE FROM agent_squad_intents WHERE conversation_id = 'test-conversation-123'`;
    await sql`DELETE FROM agent_squad_memory WHERE conversation_id = 'test-conversation-123'`;
    await sql`DELETE FROM agent_squad_agents WHERE name = 'Financial Agent Test'`;
    
    console.log('🧹 Dados de teste removidos');
    
    console.log('\n🎉 Verificação concluída com sucesso!');
    console.log('✅ Todas as tabelas do Agent Squad Framework estão funcionando corretamente');
    
  } catch (error) {
    console.error('❌ Erro durante a verificação:', error);
    throw error;
  } finally {
    // Fechar conexão
    await sql.end();
  }
}

// Executar verificação
verifyAgentSquadTables()
  .then(() => {
    console.log('✅ Script de verificação finalizado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Falha na verificação:', error);
    process.exit(1);
  });
