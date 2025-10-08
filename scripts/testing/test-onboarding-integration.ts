/**
 * Script para testar a integração entre onboarding e sistema de perfil do agente
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), '.env.local') })

async function testOnboardingIntegration() {
  console.log('🔍 Testando integração entre onboarding e sistema de perfil...')
  
  try {
    // 1. Simular dados de onboarding
    const onboardingData = {
      firstName: 'João',
      lastName: 'Silva',
      companyName: 'TechCorp Ltda',
      position: 'CEO',
      companySize: '11-50',
      industry: 'Tecnologia',
      whatsappPhone: '+5511999999999',
      isCompleted: true,
      completedAt: new Date().toISOString()
    }

    console.log('📝 Dados de onboarding:', onboardingData)

    // 2. Simular requisição para API de onboarding
    console.log('\n📤 Enviando dados para API de onboarding...')
    const response = await fetch('http://localhost:3000/api/onboarding', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Simular headers de autenticação (em um teste real, você precisaria de um token válido)
        'Authorization': 'Bearer test-token'
      },
      body: JSON.stringify(onboardingData)
    })

    console.log('📥 Resposta da API:', response.status, response.statusText)
    
    if (response.ok) {
      const result = await response.json()
      console.log('✅ Onboarding salvo:', result)
    } else {
      const error = await response.json()
      console.log('❌ Erro no onboarding:', error)
    }

    // 3. Testar consulta de perfil via API
    console.log('\n🔍 Testando consulta de perfil...')
    const profileResponse = await fetch('http://localhost:3000/api/user-profile?userId=test-user-123&includeSummary=true')
    
    if (profileResponse.ok) {
      const profileData = await profileResponse.json()
      console.log('✅ Perfil encontrado:', JSON.stringify(profileData, null, 2))
    } else {
      const error = await profileResponse.json()
      console.log('❌ Erro ao consultar perfil:', error)
    }

    // 4. Testar agente com dados do perfil
    console.log('\n🤖 Testando agente com dados do perfil...')
    const chatResponse = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Qual é o nome da minha empresa?',
        userId: 'test-user-123',
        conversationId: 'test-conv-123',
        includeUserProfile: true
      })
    })

    if (chatResponse.ok) {
      const chatData = await chatResponse.json()
      console.log('✅ Resposta do agente:', chatData.content)
    } else {
      const error = await chatResponse.json()
      console.log('❌ Erro no chat:', error)
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

// Executar teste
testOnboardingIntegration().catch(console.error)


