import { BaseAgent } from '../core/types'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export class FinancialAgentDirect extends BaseAgent {
  private id: string = 'leo-financial-agent'
  private type: string = 'financial'
  private name: string = 'Leo - Mentor Financeiro'
  private description: string = 'Mentor experiente, organizado e confiável. Ajuda empreendedores a entender números, evitar erros financeiros e planejar o caixa.'
  private version: string = '1.0.0'
  private weight: number = 1
  private specializations: string[] = ['budget_planning', 'cashflow_analysis']
  private config: Record<string, any> = {
    model: 'gpt-5',
    temperature: 0.7,
    maxTokens: 2000
  }
  private autoRecovery: boolean = true
  private maxRetries: number = 3
  private timeout: number = 30000

  async initialize(config: Record<string, any>): Promise<void> {
    console.log('Financial Agent (Direct) initialized with config:', config)
  }

  async process(message: string, context: Record<string, any>): Promise<any> {
    console.log(`Financial Agent processing message: ${message}`)
    
    const startTime = Date.now()
    
    try {
      // Usar OpenAI para gerar resposta específica
      const response = await this.generateAIResponse(message, context)
      
      const processingTime = Date.now() - startTime
      
      return {
        agent: {
          id: this.id,
          type: this.type,
          name: this.name
        },
        response: {
          message: response.message,
          analysis: {
            type: 'financial_analysis',
            confidence: response.confidence,
            topic: response.topic,
            recommendations: response.recommendations,
            nextSteps: response.nextSteps,
            details: response.details
          },
          timestamp: new Date().toISOString(),
          context: context
        },
        metadata: {
          processingTime,
          model: this.config.model,
          version: this.version,
          aiGenerated: true
        }
      }
    } catch (error) {
      console.error('Erro ao processar com OpenAI:', error)
      
      // Fallback para resposta local se OpenAI falhar
      const analysis = this.analyzeMessage(message)
      const processingTime = Date.now() - startTime
      
      return {
        agent: {
          id: this.id,
          type: this.type,
          name: this.name
        },
        response: {
          message: `⚠️ Erro na API OpenAI, usando resposta local:\n\n${analysis.response}`,
          analysis: {
            type: 'financial_analysis',
            confidence: analysis.confidence * 0.8, // Reduzir confiança para fallback
            topic: analysis.topic,
            recommendations: analysis.recommendations,
            nextSteps: analysis.nextSteps,
            details: analysis.details
          },
          timestamp: new Date().toISOString(),
          context: context
        },
        metadata: {
          processingTime,
          model: this.config.model,
          version: this.version,
          aiGenerated: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }
    }
  }

  private async generateAIResponse(message: string, context: Record<string, any>): Promise<any> {
    const systemPrompt = `Você é o Leo, um agente financeiro especializado em português brasileiro, utilizando o modelo GPT-5 para fornecer análises financeiras avançadas e precisas.

PERSONA - LEO:
Perfil: Mentor experiente, organizado e confiável
Idade simbólica: 40 anos
Personalidade: Racional, objetivo, passa segurança
Tom de voz: Claro e firme, mas amigável
Objetivo: Ajudar o empreendedor a entender números, evitar erros financeiros e planejar o caixa

EXEMPLO DE FALA:
"Calma, vamos olhar juntos os números. O que entra e o que sai. Assim você decide com clareza."

CAPACIDADES DO GPT-5:
- Contexto expandido (até 400.000 tokens) para análises mais profundas
- Capacidades multimodais para interpretar dados complexos
- Raciocínio avançado para cálculos financeiros precisos
- Análise de cenários múltiplos simultaneamente
- Compreensão contextual superior para recomendações personalizadas

INSTRUÇÕES COMO LEO:
- Responda sempre em português brasileiro
- Use o tom do Leo: claro, firme, mas amigável
- Seja prático, objetivo e detalhado como um mentor experiente
- Forneça conselhos específicos e acionáveis com cálculos quando apropriado
- Use formatação markdown para organizar as respostas
- Inclua exemplos concretos com números reais
- Seja empático, encorajador e profissional
- Aproveite o contexto expandido para análises mais profundas
- Sempre tranquilize o usuário e ofereça clareza nos números

ESPECIALIDADES AVANÇADAS:
- Planejamento financeiro personalizado com projeções
- Análise de fluxo de caixa com cenários múltiplos
- Estratégias de investimento adaptadas ao perfil de risco
- Gestão de dívidas com planos de quitação otimizados
- Cálculo de reserva de emergência baseado em dados reais
- Análise de produtos financeiros brasileiros
- Projeções de aposentadoria e metas de longo prazo
- Análise de riscos e oportunidades de mercado

FORMATO DE RESPOSTA:
- Resposta principal clara e estruturada com análise profunda
- Recomendações específicas com cálculos detalhados
- Próximos passos práticos e mensuráveis
- Análise de riscos e oportunidades
- Projeções e cenários quando apropriado
- Nível de confiança (0-1) baseado na análise
- Tópico identificado com subcategorias

Contexto do usuário: ${JSON.stringify(context, null, 2)}`

    const result = await generateText({
      model: openai(this.config.model),
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: this.config.temperature
    })

    // Extrair informações estruturadas da resposta
    const responseText = result.text
    
    // Identificar tópico baseado na resposta
    const topic = this.identifyTopicFromResponse(responseText)
    
    // Gerar recomendações baseadas na resposta
    const recommendations = this.extractRecommendations(responseText)
    
    // Gerar próximos passos
    const nextSteps = this.extractNextSteps(responseText)
    
    return {
      message: responseText,
      confidence: 0.9, // Alta confiança para respostas da OpenAI
      topic,
      recommendations,
      nextSteps,
      details: {
        model: this.config.model,
        temperature: this.config.temperature,
        tokensUsed: result.usage?.totalTokens || 0
      }
    }
  }

  private identifyTopicFromResponse(response: string): string {
    const lowerResponse = response.toLowerCase()
    
    if (lowerResponse.includes('fluxo de caixa') || lowerResponse.includes('cash flow')) return 'cash_flow'
    if (lowerResponse.includes('orçamento') || lowerResponse.includes('budget')) return 'budget'
    if (lowerResponse.includes('investimento') || lowerResponse.includes('investment')) return 'investment'
    if (lowerResponse.includes('dívida') || lowerResponse.includes('debt')) return 'debt_management'
    if (lowerResponse.includes('poupança') || lowerResponse.includes('savings')) return 'savings'
    
    return 'general'
  }

  private extractRecommendations(response: string): string[] {
    const recommendations: string[] = []
    const lines = response.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      if (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*')) {
        recommendations.push(trimmed.substring(1).trim())
      }
    }
    
    return recommendations.slice(0, 5) // Máximo 5 recomendações
  }

  private extractNextSteps(response: string): string[] {
    const nextSteps: string[] = []
    const lines = response.split('\n')
    
    let inNextSteps = false
    for (const line of lines) {
      const trimmed = line.trim().toLowerCase()
      
      if (trimmed.includes('próximos passos') || trimmed.includes('como fazer') || trimmed.includes('passos')) {
        inNextSteps = true
        continue
      }
      
      if (inNextSteps && (trimmed.startsWith('•') || trimmed.startsWith('-') || trimmed.startsWith('*'))) {
        nextSteps.push(line.trim().substring(1).trim())
      }
      
      if (inNextSteps && trimmed === '') {
        break
      }
    }
    
    return nextSteps.slice(0, 4) // Máximo 4 próximos passos
  }

  private analyzeMessage(message: string): any {
    const lowerMessage = message.toLowerCase()
    
    // Detectar perguntas sobre habilidades primeiro
    if (lowerMessage.includes('habilidades') || lowerMessage.includes('o que você faz') || 
        lowerMessage.includes('capacidades') || lowerMessage.includes('o que vc faz') ||
        lowerMessage.includes('o que voce faz') || lowerMessage.includes('o que faz')) {
      return this.getCapabilitiesResponse(message)
    }
    
    // Detectar tópicos específicos
    if (lowerMessage.includes('fluxo de caixa') || lowerMessage.includes('cash flow')) {
      return this.getCashFlowResponse(message)
    }
    
    if (lowerMessage.includes('orçamento') || lowerMessage.includes('budget')) {
      return this.getBudgetResponse(message)
    }
    
    if (lowerMessage.includes('investimento') || lowerMessage.includes('investment')) {
      return this.getInvestmentResponse(message)
    }
    
    if (lowerMessage.includes('dívida') || lowerMessage.includes('debt') || lowerMessage.includes('empréstimo')) {
      return this.getDebtResponse(message)
    }
    
    if (lowerMessage.includes('poupança') || lowerMessage.includes('savings') || lowerMessage.includes('reserva')) {
      return this.getSavingsResponse(message)
    }
    
    // Resposta genérica para outros tópicos
    return this.getGenericResponse(message)
  }

  private getCashFlowResponse(message: string): any {
    return {
      response: `Para criar um fluxo de caixa eficaz, siga estes passos fundamentais:

**1. Identifique suas fontes de receita:**
• Salários e renda fixa
• Vendas de produtos/serviços
• Investimentos e dividendos
• Outras fontes de renda

**2. Mapeie suas despesas:**
• Despesas fixas (aluguel, financiamentos, seguros)
• Despesas variáveis (alimentação, transporte, lazer)
• Despesas sazonais (impostos, manutenções)

**3. Crie categorias organizadas:**
• Receitas operacionais
• Receitas não operacionais
• Despesas operacionais
• Despesas financeiras
• Investimentos

**4. Use ferramentas adequadas:**
• Planilhas (Excel, Google Sheets)
• Aplicativos financeiros (Mobills, GuiaBolso)
• Software contábil (se necessário)

**5. Monitore regularmente:**
• Revisão semanal/mensal
• Ajustes conforme necessário
• Projeções futuras (3-6-12 meses)`,
      confidence: 0.95,
      topic: 'cash_flow',
      recommendations: [
        'Comece com um período de 3 meses para entender padrões',
        'Use categorias simples no início, refine depois',
        'Mantenha consistência nos registros',
        'Revise e ajuste mensalmente'
      ],
      nextSteps: [
        'Baixar template de fluxo de caixa',
        'Listar todas as fontes de receita',
        'Categorizar despesas por tipo',
        'Configurar lembretes para atualização'
      ],
      details: {
        tools: ['Planilhas', 'Apps financeiros', 'Software contábil'],
        timeframe: '3-12 meses',
        frequency: 'Semanal/Mensal'
      }
    }
  }

  private getBudgetResponse(message: string): any {
    return {
      response: `Para criar um orçamento eficaz, siga a regra 50-30-20:

**50% - Necessidades essenciais:**
• Moradia (aluguel/financiamento)
• Alimentação
• Transporte
• Saúde
• Contas básicas

**30% - Desejos e lazer:**
• Entretenimento
• Viagens
• Hobbies
• Compras não essenciais

**20% - Poupança e investimentos:**
• Reserva de emergência
• Aposentadoria
• Investimentos
• Pagamento de dívidas

**Dicas importantes:**
• Comece rastreando gastos por 1-2 meses
• Use apps de controle financeiro
• Revise mensalmente
• Ajuste conforme necessário`,
      confidence: 0.90,
      topic: 'budget',
      recommendations: [
        'Use a regra 50-30-20 como base',
        'Rastreie gastos antes de criar o orçamento',
        'Revise mensalmente e ajuste',
        'Mantenha reserva de emergência'
      ],
      nextSteps: [
        'Rastrear gastos por 30 dias',
        'Categorizar despesas',
        'Definir metas de poupança',
        'Configurar controle mensal'
      ]
    }
  }

  private getInvestmentResponse(message: string): any {
    return {
      response: `Para começar a investir de forma segura:

**1. Prepare-se primeiro:**
• Reserve de emergência (3-6 meses de gastos)
• Quite dívidas de alto juro
• Tenha objetivos claros

**2. Opções para iniciantes:**
• **Tesouro Selic** - Baixo risco, liquidez diária
• **CDB** - Renda fixa, cobertura do FGC
• **Fundos DI** - Diversificação automática
• **ETFs** - Baixo custo, diversificação

**3. Estratégia conservadora:**
• 70% Renda Fixa (Tesouro, CDB)
• 20% Fundos balanceados
• 10% Ações/ETFs

**4. Dicas importantes:**
• Comece com valores pequenos
• Invista regularmente (mensalmente)
• Diversifique sempre
• Mantenha foco no longo prazo`,
      confidence: 0.88,
      topic: 'investment',
      recommendations: [
        'Comece com reserva de emergência',
        'Use estratégia conservadora inicialmente',
        'Invista regularmente',
        'Diversifique sempre'
      ],
      nextSteps: [
        'Criar reserva de emergência',
        'Definir objetivos de investimento',
        'Escolher corretora confiável',
        'Começar com valores pequenos'
      ]
    }
  }

  private getDebtResponse(message: string): any {
    return {
      response: `Para gerenciar dívidas de forma eficaz:

**1. Avalie sua situação:**
• Liste todas as dívidas
• Anote juros e prazos
• Calcule capacidade de pagamento

**2. Estratégias de pagamento:**
• **Avalanche** - Pague primeiro as de maior juro
• **Bola de neve** - Pague primeiro as menores
• **Consolidação** - Una dívidas em uma só

**3. Negocie com credores:**
• Peça desconto por pagamento à vista
• Negocie parcelas menores
• Considere refinanciamento

**4. Evite novas dívidas:**
• Use apenas dinheiro quando possível
• Evite cartão de crédito
• Mantenha orçamento rigoroso`,
      confidence: 0.92,
      topic: 'debt_management',
      recommendations: [
        'Liste todas as dívidas com juros',
        'Use estratégia avalanche ou bola de neve',
        'Negocie com credores',
        'Evite contrair novas dívidas'
      ],
      nextSteps: [
        'Fazer lista completa de dívidas',
        'Calcular capacidade de pagamento',
        'Escolher estratégia de pagamento',
        'Negociar com credores'
      ]
    }
  }

  private getSavingsResponse(message: string): any {
    return {
      response: `Para criar uma estratégia de poupança eficaz:

**1. Defina objetivos claros:**
• Reserva de emergência (3-6 meses)
• Objetivos de curto prazo (1-2 anos)
• Objetivos de longo prazo (5+ anos)

**2. Estratégia de poupança:**
• **Automática** - Transferência automática mensal
• **Percentual** - 20% da renda líquida
• **Valor fixo** - Valor determinado mensalmente

**3. Onde guardar:**
• **Conta corrente** - Acesso imediato (emergência)
• **Poupança** - Liquidez + rendimento
• **CDB** - Melhor rendimento, liquidez diária
• **Tesouro Selic** - Segurança máxima

**4. Dicas importantes:**
• Comece pequeno, mas seja consistente
• Automatize o processo
• Revise objetivos regularmente
• Celebre conquistas`,
      confidence: 0.90,
      topic: 'savings',
      recommendations: [
        'Defina objetivos específicos',
        'Automatize a poupança',
        'Use conta separada para poupança',
        'Revise objetivos regularmente'
      ],
      nextSteps: [
        'Definir objetivos de poupança',
        'Calcular valor mensal necessário',
        'Configurar transferência automática',
        'Escolher melhor opção de rendimento'
      ]
    }
  }

  private getCapabilitiesResponse(message: string): any {
    return {
      response: `Olá! Sou o Leo, seu mentor financeiro experiente. Calma, vamos olhar juntos os números. Aqui estão minhas principais habilidades:

**📊 Planejamento Financeiro:**
• Criação de orçamento personalizado
• Controle de gastos e receitas
• Definição de metas financeiras
• Análise de fluxo de caixa

**💰 Investimentos:**
• Estratégias conservadoras e moderadas
• Diversificação de carteira
• Análise de riscos
• Recomendações de produtos financeiros

**💳 Gestão de Dívidas:**
• Estratégias de pagamento (bola de neve/avalanche)
• Negociação com credores
• Consolidação de débitos
• Planejamento de quitação

**🏦 Poupança e Reservas:**
• Cálculo de reserva de emergência
• Objetivos de curto e longo prazo
• Produtos financeiros adequados
• Estratégias de acumulação

**📈 Análise Financeira:**
• Indicadores de saúde financeira
• Relatórios de performance
• Projeções e cenários
• Acompanhamento de metas

**🎯 Como posso ajudar:**
• Responder perguntas específicas
• Dar orientações práticas
• Sugerir próximos passos
• Acompanhar seu progresso

O que entra e o que sai - assim você decide com clareza. Qual área te interessa mais?`,
      confidence: 0.9,
      topic: 'capabilities',
      recommendations: [
        'Escolha uma área específica',
        'Faça perguntas detalhadas',
        'Mencione sua situação atual',
        'Defina seus objetivos'
      ],
      nextSteps: [
        'Escolher área de interesse',
        'Fazer pergunta específica',
        'Compartilhar contexto',
        'Receber orientação personalizada'
      ],
      details: 'Resposta detalhada sobre capacidades do assistente financeiro'
    }
  }

  private getGenericResponse(message: string): any {
    return {
      response: `Olá! Sou o Leo, seu mentor financeiro experiente. Calma, vamos olhar juntos os números. Posso ajudar com:

**📊 Planejamento Financeiro:**
• Criação de orçamento
• Controle de gastos
• Definição de metas

**💰 Investimentos:**
• Estratégias conservadoras
• Diversificação de carteira
• Análise de riscos

**💳 Gestão de Dívidas:**
• Estratégias de pagamento
• Negociação com credores
• Consolidação de débitos

**🏦 Poupança:**
• Reserva de emergência
• Objetivos de curto/longo prazo
• Produtos financeiros adequados

O que entra e o que sai - assim você decide com clareza. Como posso ajudá-lo especificamente hoje?`,
      confidence: 0.75,
      topic: 'general',
      recommendations: [
        'Seja específico sobre sua necessidade',
        'Mencione seu perfil de risco',
        'Informe seu horizonte temporal',
        'Compartilhe sua situação atual'
      ],
      nextSteps: [
        'Definir objetivo específico',
        'Avaliar situação atual',
        'Escolher área de foco',
        'Começar implementação'
      ]
    }
  }

  async shutdown(): Promise<void> {
    console.log('Financial Agent (Direct) shutting down')
  }

  async isHealthy(): Promise<boolean> {
    return true
  }

  getCapabilities(): string[] {
    return this.specializations
  }

  getCurrentLoad(): number {
    return Math.random() * 0.5 // 0-50% load
  }

  getMemoryUsage(): number {
    return Math.random() * 100 // 0-100MB
  }

  // Getters para compatibilidade
  get agentId(): string {
    return this.id
  }

  get agentType(): string {
    return this.type
  }

  get agentName(): string {
    return this.name
  }

  get agentDescription(): string {
    return this.description
  }

  get agentVersion(): string {
    return this.version
  }

  get agentWeight(): number {
    return this.weight
  }

  get agentSpecializations(): string[] {
    return this.specializations
  }

  get agentConfig(): Record<string, any> {
    return this.config
  }
}
