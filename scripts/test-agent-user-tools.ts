#!/usr/bin/env tsx

import { config } from 'dotenv';
import { userQueryTool, userBasicQueryTool, userOnboardingQueryTool } from '../src/agents/core/user-query-tool';

// Carregar variáveis de ambiente
config({ path: '.env.local' });

async function testAgentUserTools() {
  try {
    console.log('🤖 Testando ferramentas de consulta de usuário para agents...\n');
    
    const testEmail = 'tiagoyoko@gmail.com';
    
    // Teste 1: Consulta completa do usuário
    console.log('📋 Teste 1: Consulta completa do usuário');
    console.log('=' .repeat(50));
    
    const fullUserData = await userQueryTool.execute({
      email: testEmail,
      includeOnboarding: true
    });
    
    if (fullUserData.success) {
      console.log('✅ Consulta completa bem-sucedida:');
      console.log('👤 Dados básicos:', JSON.stringify(fullUserData.data.user, null, 2));
      console.log('📝 Dados de onboarding:', JSON.stringify(fullUserData.data.onboarding, null, 2));
    } else {
      console.log('❌ Erro na consulta completa:', fullUserData.error);
    }
    
    console.log('\n');
    
    // Teste 2: Consulta básica (mais rápida)
    console.log('📋 Teste 2: Consulta básica do usuário');
    console.log('=' .repeat(50));
    
    const basicUserData = await userBasicQueryTool.execute({
      email: testEmail
    });
    
    if (basicUserData.success) {
      console.log('✅ Consulta básica bem-sucedida:');
      console.log('👤 Dados básicos:', JSON.stringify(basicUserData.data, null, 2));
    } else {
      console.log('❌ Erro na consulta básica:', basicUserData.error);
    }
    
    console.log('\n');
    
    // Teste 3: Consulta apenas de onboarding
    console.log('📋 Teste 3: Consulta de dados de onboarding');
    console.log('=' .repeat(50));
    
    const onboardingData = await userOnboardingQueryTool.execute({
      email: testEmail
    });
    
    if (onboardingData.success) {
      console.log('✅ Consulta de onboarding bem-sucedida:');
      console.log('📝 Dados de onboarding:', JSON.stringify(onboardingData.data, null, 2));
    } else {
      console.log('❌ Erro na consulta de onboarding:', onboardingData.error);
    }
    
    console.log('\n');
    
    // Teste 4: Simulação de uso por um agent
    console.log('🤖 Teste 4: Simulação de uso por agent');
    console.log('=' .repeat(50));
    
    console.log('Simulando agent financeiro consultando dados do usuário...');
    
    // Agent precisa saber se o usuário completou onboarding
    const userForAgent = await userQueryTool.execute({
      email: testEmail,
      includeOnboarding: true
    });
    
    if (userForAgent.success) {
      const { user, onboarding } = userForAgent.data;
      
      console.log(`🤖 Agent: "Consultando dados do usuário ${user.email}..."`);
      console.log(`🤖 Agent: "Usuário ${user.name} (${user.role}) está ${user.isActive ? 'ativo' : 'inativo'}"`);
      
      if (onboarding) {
        console.log(`🤖 Agent: "Onboarding completo: ${onboarding.isCompleted ? 'Sim' : 'Não'}"`);
        console.log(`🤖 Agent: "Empresa: ${onboarding.companyName} (${onboarding.companySize} funcionários)"`);
        console.log(`🤖 Agent: "WhatsApp: ${onboarding.whatsappPhone}"`);
        console.log(`🤖 Agent: "Posso prosseguir com atendimento personalizado"`);
      } else {
        console.log(`🤖 Agent: "Dados de onboarding não disponíveis - usando dados básicos"`);
      }
    }
    
    console.log('\n🎉 Todos os testes de ferramentas de agent concluídos!');
    
  } catch (error) {
    console.error('❌ Erro nos testes:', error);
    process.exit(1);
  }
}

testAgentUserTools();
