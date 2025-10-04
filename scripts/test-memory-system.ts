#!/usr/bin/env tsx

/**
 * Script de Teste do Sistema de Memória do Agente Falachefe
 * 
 * Este script testa todas as funcionalidades do sistema de memória:
 * - Armazenamento e recuperação de memórias
 * - Contexto de conversação
 * - Perfil do usuário
 * - Sistema de aprendizado
 * - Integração com o agente
 */

import { falachefeMemorySystem } from '../src/agents/memory/memory-system'
import { memoryManager } from '../src/agents/memory/memory-manager'
import { conversationContextManager } from '../src/agents/memory/conversation-context'
import { userProfileManager } from '../src/agents/memory/user-profile'
import { learningSystem } from '../src/agents/memory/learning-system'
import { MemoryCategory } from '../src/agents/memory/types'

async function testMemorySystem() {
  console.log('🧠 Iniciando testes do Sistema de Memória do Falachefe...\n')

  const testUserId = 'test_user_123'
  const testConversationId = 'test_conv_456'

  try {
    // Teste 1: Armazenar memória básica
    console.log('📝 Teste 1: Armazenando memória básica...')
    const memoryData = {
      userId: testUserId,
      conversationId: testConversationId,
      category: MemoryCategory.USER_PROFILE,
      key: 'user_preferences',
      value: {
        name: 'João Silva',
        preferredLanguage: 'pt-BR',
        businessType: 'restaurante',
        location: 'São Paulo'
      },
      importance: 0.8
    }

    await memoryManager.store(memoryData)
    console.log('✅ Memória armazenada com sucesso')

    // Teste 2: Recuperar memórias
    console.log('\n🔍 Teste 2: Recuperando memórias...')
    const retrievedMemories = await memoryManager.retrieve({
      userId: testUserId,
      conversationId: testConversationId,
      category: MemoryCategory.USER_PROFILE
    })
    console.log('✅ Memórias recuperadas:', retrievedMemories.length)
    console.log('📊 Dados recuperados:', JSON.stringify(retrievedMemories[0]?.value, null, 2))

    // Teste 3: Atualizar contexto de conversação
    console.log('\n💬 Teste 3: Atualizando contexto de conversação...')
    await conversationContextManager.addMessage(
      testConversationId,
      testUserId,
      'user',
      'Olá, preciso de ajuda com meu restaurante'
    )
    console.log('✅ Contexto de conversação atualizado')

    // Teste 4: Criar perfil do usuário
    console.log('\n👤 Teste 4: Criando perfil do usuário...')
    await userProfileManager.updateUserProfile(testUserId, {
      personalInfo: {
        name: 'João Silva',
        email: 'joao@restaurante.com',
        businessType: 'restaurante',
        location: 'São Paulo',
        experience: 'intermediário'
      },
      preferences: {
        language: 'pt-BR',
        notifications: true,
        theme: 'light'
      },
      businessContext: {
        industry: 'food_service',
        size: 'small',
        goals: ['crescimento', 'lucratividade']
      }
    })
    console.log('✅ Perfil do usuário criado')

    // Teste 5: Processar mensagem com memória
    console.log('\n🤖 Teste 5: Processando mensagem com sistema de memória...')
    const testMessage = 'Preciso de dicas para aumentar as vendas do meu restaurante'
    
    const memoryResponse = await falachefeMemorySystem.processMessageWithMemory(
      testUserId,
      testConversationId,
      testMessage,
      'user'
    )

    console.log('✅ Mensagem processada com memória')
    console.log('📊 Contexto personalizado aplicado:')
    console.log('   - Memórias relevantes:', memoryResponse.context.relevantMemories.length)
    console.log('   - Insights gerados:', memoryResponse.context.insights.length)
    console.log('   - Recomendações:', memoryResponse.context.recommendations.length)
    console.log('   - Deve armazenar:', memoryResponse.shouldStore)

    // Teste 6: Sistema de aprendizado
    console.log('\n🎓 Teste 6: Testando sistema de aprendizado...')
    const learningResult = await learningSystem.analyzeInteractions(
      testUserId,
      testConversationId
    )

    console.log('✅ Sistema de aprendizado testado')
    console.log('📊 Insights gerados:', learningResult.length)
    console.log('💡 Primeiro insight:', learningResult[0]?.summary || 'Nenhum insight')

    // Teste 7: Limpeza de memórias expiradas
    console.log('\n🧹 Teste 7: Testando limpeza de memórias...')
    const cleanupResult = await memoryManager.cleanupExpiredMemories()
    console.log('✅ Limpeza executada:', cleanupResult, 'memórias removidas')

    console.log('\n🎉 Todos os testes do sistema de memória foram executados com sucesso!')
    console.log('\n📋 Resumo dos testes:')
    console.log('   ✅ Armazenamento de memórias')
    console.log('   ✅ Recuperação de memórias')
    console.log('   ✅ Contexto de conversação')
    console.log('   ✅ Perfil do usuário')
    console.log('   ✅ Processamento com memória')
    console.log('   ✅ Sistema de aprendizado')
    console.log('   ✅ Limpeza de memórias')

  } catch (error) {
    console.error('❌ Erro durante os testes:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
    process.exit(1)
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  testMemorySystem()
    .then(() => {
      console.log('\n✅ Script de teste concluído')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Falha no script de teste:', error)
      process.exit(1)
    })
}

export { testMemorySystem }
