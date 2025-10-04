/**
 * Falachefe Secretary Agent - Simplified OpenAI Integration
 * 
 * This agent provides business management assistance using OpenAI API directly
 * for reliable and simple integration without complex SDK dependencies.
 */

/**
 * Load agent profile from markdown file
 */
function getAgentProfile(): string {
  return `Você é a Secretária Virtual do Falachefe, uma assistente pessoal especializada em gestão empresarial.

IDENTIDADE:
- Nome: Secretária Virtual do Falachefe
- Papel: Assistente pessoal especializada em gestão empresarial
- Tom: Profissional, amigável, prestativa e eficiente
- Linguagem: Português brasileiro (formal mas acessível)

CONTEXTO DA EMPRESA:
O Falachefe é uma plataforma SaaS completa de gestão empresarial que oferece:
- Gestão financeira integrada
- Controle de clientes e fornecedores
- Organização de tarefas e projetos
- Relatórios e análises detalhadas
- Dashboard em tempo real
- Integração com múltiplos sistemas

ESPECIALIZAÇÕES:
💰 Gestão Financeira: Controle de despesas/receitas, análise de fluxo de caixa, planejamento orçamentário, relatórios financeiros
📋 Organização de Negócios: Gestão de contatos, agendamento, organização de tarefas, relatórios de atividade
🏢 Suporte e Informações: Informações sobre o Falachefe, suporte técnico, treinamento, configurações

COMPORTAMENTO:
- Seja proativa e ofereça ajuda
- Use emojis moderadamente
- Estruture respostas com títulos e listas
- Sempre ofereça próximos passos
- Mantenha tom positivo e encorajador
- Foque no valor empresarial

DIRETRIZES:
- Confirme o entendimento da pergunta
- Ofereça opções quando apropriado
- Sugira próximos passos concretos
- Seja didática com exemplos práticos
- Não invente funcionalidades inexistentes
- Mantenha foco na produtividade empresarial

Responda sempre de forma útil, prática e focada em ajudar o usuário a maximizar a eficiência dos seus negócios através do Falachefe.`
}

/**
 * Classify message intent based on content
 */
function classifyMessageIntent(message: string): string {
  const lowerMessage = message.toLowerCase()
  
  if (lowerMessage.includes('financeiro') || lowerMessage.includes('dinheiro') || lowerMessage.includes('receita') || lowerMessage.includes('despesa') || lowerMessage.includes('fluxo') || lowerMessage.includes('caixa')) {
    return 'financial'
  } else if (lowerMessage.includes('contato') || lowerMessage.includes('cliente') || lowerMessage.includes('fornecedor') || lowerMessage.includes('tarefa') || lowerMessage.includes('projeto')) {
    return 'organization'
  } else if (lowerMessage.includes('falachefe') || lowerMessage.includes('empresa') || lowerMessage.includes('suporte') || lowerMessage.includes('ajuda') || lowerMessage.includes('como usar')) {
    return 'information'
  } else if (lowerMessage.includes('olá') || lowerMessage.includes('oi') || lowerMessage.includes('bom dia') || lowerMessage.includes('boa tarde') || lowerMessage.includes('boa noite') || lowerMessage.includes('tudo bem')) {
    return 'greeting'
  } else if (lowerMessage.includes('meu nome é') || lowerMessage.includes('me chamo') || lowerMessage.includes('sou o') || lowerMessage.includes('sou a')) {
    return 'introduction'
  }
  
  return 'general'
}

/**
 * Extract name from message
 */
function extractName(message: string): string {
  const patterns = [
    /meu nome é (\w+)/i,
    /me chamo (\w+)/i,
    /sou o (\w+)/i,
    /sou a (\w+)/i,
    /my name is (\w+)/i,
    /i am (\w+)/i,
    /nome é (\w+)/i,
    /chamo (\w+)/i
  ]
  
  for (const pattern of patterns) {
    const match = message.match(pattern)
    if (match && match[1]) {
      return match[1].charAt(0).toUpperCase() + match[1].slice(1)
    }
  }
  
  // Fallback: try to find capitalized words
  const words = message.split(' ')
  for (const word of words) {
    if (word.length > 2 && /^[A-Z]/.test(word) && /^[a-zA-Z]+$/.test(word)) {
      return word
    }
  }
  
  return 'Usuário'
}

/**
 * Falachefe Secretary Agent Class
 */
export class FalachefeSecretaryAgent {
  private agentProfile: string

  constructor() {
    this.agentProfile = getAgentProfile()
    console.log('🤖 Falachefe Secretary Agent initialized')
  }

  /**
   * Process a message using OpenAI API directly
   */
  async processMessage(message: string): Promise<{
    response: string
    agentId: string
    confidence: number
    processingTime: number
    metadata: any
  }> {
    const startTime = Date.now()
    
    console.log('🚀 Processing message with OpenAI API:', message.substring(0, 50) + '...')
    
    try {
      // Use OpenAI API directly for simplicity and reliability
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: this.agentProfile
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`)
      }

      const data = await response.json()
      const responseContent = data.choices[0]?.message?.content || 'Desculpe, não consegui processar sua mensagem.'
      
      const processingTime = Date.now() - startTime
      const intent = classifyMessageIntent(message)
      
      console.log('✅ OpenAI API Response generated successfully:', {
        processingTime: `${processingTime}ms`,
        intent,
        tokens: data.usage?.total_tokens || 0
      })
      
      return {
        response: responseContent,
        agentId: 'falachefe-secretary-openai',
        confidence: 0.95, // High confidence as it's LLM-generated
        processingTime,
        metadata: {
          type: intent,
          capabilities: ['financial', 'organization', 'support', 'information', 'general'],
          api: 'openai-direct',
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          tokens_used: data.usage?.total_tokens || 0,
          extracted_name: extractName(message)
        }
      }
      
    } catch (error) {
      console.error('❌ OpenAI API Error:', error)
      throw error
    }
  }
}

// Export singleton instance
export const falachefeSecretaryAgent = new FalachefeSecretaryAgent()