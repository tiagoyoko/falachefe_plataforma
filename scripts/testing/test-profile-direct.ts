/**
 * Script para testar diretamente o sistema de perfil do agente
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), '.env.local') })

async function testProfileDirect() {
  console.log('🔍 Testando sistema de perfil diretamente...')
  
  try {
    // Importar após carregar as variáveis de ambiente
    const { userProfileManager } = await import('../src/agents/memory/user-profile')
    const { memoryManager } = await import('../src/agents/memory/memory-manager')
    
    const testUserId = 'test-user-direct-123'
    
    console.log('📝 Criando perfil de teste...')
    
    // 1. Criar perfil com dados de exemplo
    const profileData = {
      personalInfo: {
        name: 'João Silva',
        company: 'TechCorp Ltda',
        position: 'CEO',
        industry: 'Tecnologia',
        companySize: 'Pequena'
      },
      businessContext: {
        businessType: 'SaaS',
        mainChallenges: ['Gestão financeira', 'Controle de clientes'],
        goals: ['Crescer 50% este ano', 'Automatizar processos'],
        priorities: ['Vendas', 'Produtividade']
      },
      preferences: {
        communicationStyle: 'mixed' as const,
        language: 'pt-BR',
        notificationPreferences: {
          useEmojis: true,
          sendReminders: true
        }
      }
    }
    
    const updatedProfile = await userProfileManager.updateUserProfile(testUserId, profileData)
    console.log('✅ Perfil criado:', JSON.stringify(updatedProfile, null, 2))
    
    // 2. Testar consulta do perfil
    console.log('\n🔍 Consultando perfil...')
    const savedProfile = await userProfileManager.getUserProfile(testUserId)
    console.log('✅ Perfil consultado:', JSON.stringify(savedProfile, null, 2))
    
    // 3. Testar resumo do perfil
    console.log('\n📋 Testando resumo do perfil...')
    const summary = await userProfileManager.getProfileSummary(testUserId)
    console.log('✅ Resumo:', summary)
    
    // 4. Testar preferências de comunicação
    console.log('\n💬 Testando preferências de comunicação...')
    const commPrefs = await userProfileManager.getCommunicationPreferences(testUserId)
    console.log('✅ Preferências:', commPrefs)
    
    // 5. Verificar memórias armazenadas
    console.log('\n🧠 Verificando memórias armazenadas...')
    const memories = await memoryManager.retrieve({
      userId: testUserId,
      limit: 10
    })
    console.log(`✅ ${memories.length} memórias encontradas:`)
    memories.forEach((memory, index) => {
      console.log(`  ${index + 1}. ${memory.key}: ${JSON.stringify(memory.value)}`)
    })
    
    console.log('\n🎉 Teste concluído com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
  }
}

// Executar teste
testProfileDirect().catch(console.error)


