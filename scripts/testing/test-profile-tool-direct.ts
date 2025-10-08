/**
 * Script para testar o userProfileTool diretamente
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), '.env.local') })

async function testProfileTool() {
  console.log('🔧 Testando userProfileTool diretamente...')
  
  try {
    const { userProfileTool } = await import('../src/agents/core/user-profile-tool')
    
    const testUserId = 'test-profile-tool-123'
    
    // 1. Criar perfil
    console.log('📝 Criando perfil...')
    await userProfileTool.updateUserProfile(testUserId, {
      personalInfo: {
        name: 'João Silva',
        company: 'TechCorp Ltda',
        position: 'CEO',
        industry: 'Tecnologia'
      },
      businessContext: {
        goals: ['Crescer 50%'],
        priorities: ['Vendas']
      }
    })
    
    // 2. Testar geração de prompt personalizado
    console.log('\n🤖 Testando geração de prompt personalizado...')
    const basePrompt = 'Você é um assistente virtual.'
    const personalizedPrompt = await userProfileTool.generatePersonalizedPrompt(testUserId, basePrompt)
    
    console.log('✅ Prompt personalizado:')
    console.log(personalizedPrompt)
    
    // 3. Testar extração de informações
    console.log('\n📤 Testando extração de informações...')
    await userProfileTool.extractAndStoreUserInfo(testUserId, 'Minha empresa é a TechCorp Ltda e sou CEO')
    
    // 4. Testar consulta do perfil
    console.log('\n🔍 Testando consulta do perfil...')
    const profile = await userProfileTool.getUserProfile({ userId: testUserId })
    console.log('✅ Perfil consultado:', JSON.stringify(profile, null, 2))
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
    console.error('Stack trace:', error instanceof Error ? error.stack : 'N/A')
  }
}

// Executar teste
testProfileTool().catch(console.error)


