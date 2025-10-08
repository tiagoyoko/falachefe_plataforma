/**
 * Script para testar o agente e verificar se está consultando dados do perfil
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Carregar variáveis de ambiente
config({ path: resolve(process.cwd(), '.env.local') })

async function testAgentProfile() {
  console.log('🔍 Testando agente com dados de perfil...')
  
  try {
    // Simular uma requisição para a API de chat
    const response = await fetch('http://localhost:3000/api/chat', {
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

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    console.log('Resposta do agente:', JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('❌ Erro no teste:', error)
  }
}

// Executar teste
testAgentProfile().catch(console.error)


