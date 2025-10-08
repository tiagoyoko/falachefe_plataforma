/**
 * Script para debugar o sistema de perfil em detalhes
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), '.env.local') })

async function testProfileDebug() {
  console.log('🔍 Debugando sistema de perfil...')
  
  try {
    const { userProfileManager } = await import('../src/agents/memory/user-profile')
    const { memoryManager } = await import('../src/agents/memory/memory-manager')
    
    const testUserId = 'debug-user-123'
    
    console.log('📝 Testando updateUserProfile diretamente...')
    
    // Testar updateUserProfile diretamente
    const result = await userProfileManager.updateUserProfile(testUserId, {
      personalInfo: {
        name: 'João Silva',
        company: 'TechCorp Ltda',
        position: 'CEO',
        industry: 'Tecnologia',
        companySize: 'Pequena'
      },
      businessContext: {
        businessType: 'SaaS',
        mainChallenges: ['Gestão financeira'],
        goals: ['Crescer 50%'],
        priorities: ['Vendas']
      }
    })
    
    console.log('✅ Resultado do updateUserProfile:', JSON.stringify(result, null, 2))
    
    // Verificar se foi salvo no banco
    console.log('\n🔍 Verificando dados no banco...')
    const savedProfile = await userProfileManager.getUserProfile(testUserId)
    console.log('✅ Perfil salvo:', JSON.stringify(savedProfile, null, 2))
    
    // Verificar memórias
    console.log('\n🧠 Verificando memórias...')
    const memories = await memoryManager.retrieve({
      userId: testUserId,
      limit: 10
    })
    console.log(`✅ ${memories.length} memórias encontradas:`)
    memories.forEach((memory, index) => {
      console.log(`  ${index + 1}. ${memory.key}: ${JSON.stringify(memory.value)}`)
    })
    
    // Testar resumo
    console.log('\n📋 Testando resumo...')
    const summary = await userProfileManager.getProfileSummary(testUserId)
    console.log('✅ Resumo:', summary)
    
  } catch (error) {
    console.error('❌ Erro no debug:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
  }
}

// Executar teste
testProfileDebug().catch(console.error)


