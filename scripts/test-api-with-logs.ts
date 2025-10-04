#!/usr/bin/env tsx

/**
 * Script para testar a API com logs detalhados
 */

async function testAPIWithLogs() {
  console.log('🧪 Testando API com logs detalhados...\n')

  const testMessage = "Oi, qual é o meu nome?"
  const testUserId = "test-user-123"
  const testConversationId = "test-conv-456"

  console.log('📤 Enviando requisição para API...')
  console.log('📝 Mensagem:', testMessage)
  console.log('👤 User ID:', testUserId)
  console.log('💬 Conversation ID:', testConversationId)

  try {
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: testMessage,
        userId: testUserId,
        conversationId: testConversationId
      })
    })

    console.log('📊 Status da resposta:', response.status)
    console.log('📊 Headers da resposta:', Object.fromEntries(response.headers.entries()))

    const data = await response.json()
    console.log('📥 Resposta completa:', JSON.stringify(data, null, 2))

    // Análise específica
    console.log('\n🔍 Análise da resposta:')
    console.log('- Content:', data.content)
    console.log('- Tools Used:', data.metadata?.tools_used || 'N/A')
    console.log('- User Context:', data.metadata?.user_context || 'N/A')
    console.log('- Agent ID:', data.agentId)
    console.log('- Confidence:', data.confidence)

    if (data.metadata?.tools_used === 0) {
      console.log('\n❌ PROBLEMA: Nenhuma tool foi usada!')
      console.log('🔧 Possíveis causas:')
      console.log('  1. toolChoice: "required" não está funcionando')
      console.log('  2. As tools não estão sendo registradas corretamente')
      console.log('  3. As instruções não estão sendo seguidas')
    } else {
      console.log('\n✅ Tools foram usadas:', data.metadata?.tools_used)
    }

  } catch (error) {
    console.error('❌ Erro na requisição:', error)
  }

  console.log('\n🎉 Teste da API concluído!')
}

// Executar teste
testAPIWithLogs().catch(console.error)

