/**
 * Script para testar e debugar o sistema de perfil de usuário
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), '.env.local') })

import { userProfileManager } from '../src/agents/memory/user-profile'
import { memoryManager } from '../src/agents/memory/memory-manager'

async function testUserProfile() {
  const testUserId = 'test-user-debug-123'
  
  console.log('🔍 Testando sistema de perfil de usuário...')
  console.log('User ID:', testUserId)
  
  try {
    // 1. Verificar se há perfil existente
    console.log('\n1. Verificando perfil existente...')
    const existingProfile = await userProfileManager.getUserProfile(testUserId)
    console.log('Perfil existente:', existingProfile)
    
    // 2. Criar/atualizar perfil com dados de exemplo
    console.log('\n2. Criando perfil com dados de exemplo...')
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
    console.log('Perfil atualizado:', JSON.stringify(updatedProfile, null, 2))
    
    // 3. Verificar se foi salvo corretamente
    console.log('\n3. Verificando se foi salvo...')
    const savedProfile = await userProfileManager.getUserProfile(testUserId)
    console.log('Perfil salvo:', JSON.stringify(savedProfile, null, 2))
    
    // 4. Testar resumo do perfil
    console.log('\n4. Testando resumo do perfil...')
    const summary = await userProfileManager.getProfileSummary(testUserId)
    console.log('Resumo:', summary)
    
    // 5. Testar preferências de comunicação
    console.log('\n5. Testando preferências de comunicação...')
    const commPrefs = await userProfileManager.getCommunicationPreferences(testUserId)
    console.log('Preferências:', commPrefs)
    
    // 6. Verificar memórias armazenadas
    console.log('\n6. Verificando memórias armazenadas...')
    const memories = await memoryManager.retrieve({
      userId: testUserId,
      limit: 10
    })
    console.log('Memórias encontradas:', memories.length)
    memories.forEach((memory, index) => {
      console.log(`  ${index + 1}. ${memory.key}: ${JSON.stringify(memory.value)}`)
    })
    
    console.log('\n✅ Teste concluído com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
  }
}

// Executar teste
testUserProfile().catch(console.error)
