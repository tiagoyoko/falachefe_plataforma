#!/usr/bin/env tsx

import { config } from 'dotenv';
import { UserAwareAgent } from '../src/agents/core/agent-with-tools-example';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

async function testOpenAIAgentTools() {
  try {
    console.log('🤖 Testando OpenAI Agent com ferramentas de usuário...\n');
    
    if (!process.env.OPENAI_API_KEY) {
      console.error('❌ OPENAI_API_KEY não encontrada no .env.local');
      process.exit(1);
    }
    
    // Criar agent financeiro
    const financialAgent = new UserAwareAgent('gpt-4o-mini', 'financial');
    
    console.log('💰 Testando Agent Financeiro...');
    console.log('=' .repeat(50));
    
    // Teste 1: Consulta que deve usar ferramentas
    console.log('📋 Teste 1: Consulta que requer dados do usuário');
    const result1 = await financialAgent.processMessage(
      "Preciso de um relatório financeiro personalizado para o usuário tiagoyoko@gmail.com. Quais são os dados dele?",
      "tiagoyoko@gmail.com"
    );
    
    console.log('✅ Resposta do Agent:');
    console.log(result1.response);
    console.log(`🔧 Ferramentas usadas: ${result1.toolsUsed.join(', ')}`);
    console.log('\n');
    
    // Teste 2: Consulta básica
    console.log('📋 Teste 2: Consulta de status');
    const result2 = await financialAgent.processMessage(
      "Qual é o status da conta do usuário?",
      "tiagoyoko@gmail.com"
    );
    
    console.log('✅ Resposta do Agent:');
    console.log(result2.response);
    console.log(`🔧 Ferramentas usadas: ${result2.toolsUsed.join(', ')}`);
    console.log('\n');
    
    // Teste 3: Agent de suporte
    console.log('📋 Teste 3: Agent de Suporte');
    const supportAgent = new UserAwareAgent('gpt-4o-mini', 'support');
    
    const result3 = await supportAgent.processMessage(
      "O usuário está com problemas no sistema. Preciso saber os dados dele para ajudar melhor.",
      "tiagoyoko@gmail.com"
    );
    
    console.log('✅ Resposta do Agent de Suporte:');
    console.log(result3.response);
    console.log(`🔧 Ferramentas usadas: ${result3.toolsUsed.join(', ')}`);
    console.log('\n');
    
    // Teste 4: Agent de vendas
    console.log('📋 Teste 4: Agent de Vendas');
    const salesAgent = new UserAwareAgent('gpt-4o-mini', 'sales');
    
    const result4 = await salesAgent.processMessage(
      "Quero fazer uma proposta comercial personalizada. Preciso saber sobre a empresa do cliente.",
      "tiagoyoko@gmail.com"
    );
    
    console.log('✅ Resposta do Agent de Vendas:');
    console.log(result4.response);
    console.log(`🔧 Ferramentas usadas: ${result4.toolsUsed.join(', ')}`);
    console.log('\n');
    
    console.log('🎉 Todos os testes do OpenAI Agent concluídos!');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
    process.exit(1);
  }
}

testOpenAIAgentTools();
