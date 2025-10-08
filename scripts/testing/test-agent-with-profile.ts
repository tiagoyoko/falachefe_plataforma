/**
 * Script para testar o agente com dados do perfil
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), '.env.local') })

async function testAgentWithProfile() {
  console.log('🤖 Testando agente com dados do perfil...')
  
  try {
    // 1. Criar perfil de teste
    const { userProfileManager } = await import('../src/agents/memory/user-profile')
    
    const testUserId = 'test-agent-user-123'
    
    console.log('📝 Criando perfil de teste...')
    await userProfileManager.updateUserProfile(testUserId, {
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
      }
    })
    
    console.log('✅ Perfil criado com sucesso!')
    
    // 2. Testar agente via API
    console.log('\n🤖 Testando agente...')
    
    const testMessages = [
      'Qual é o nome da minha empresa?',
      'Qual é o meu cargo?',
      'Quais são os meus objetivos?',
      'Me conte sobre os desafios da minha empresa'
    ]
    
    for (const message of testMessages) {
      console.log(`\n📤 Enviando: "${message}"`)
      
      try {
        const response = await fetch('http://localhost:3001/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            userId: testUserId,
            conversationId: 'test-conv-123',
            includeUserProfile: true
          })
        })

        if (response.ok) {
          const data = await response.json()
          console.log(`✅ Resposta: ${data.content}`)
        } else {
          const error = await response.json()
          console.log(`❌ Erro: ${error.message || 'Erro desconhecido'}`)
        }
      } catch (error) {
        console.log(`❌ Erro na requisição: ${error}`)
      }
      
      // Aguardar um pouco entre as mensagens
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

// Executar teste
testAgentWithProfile().catch(console.error)


