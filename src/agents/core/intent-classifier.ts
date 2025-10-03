/**
 * Intent Classifier - Advanced intent classification system
 * Based on AWS Labs Agent Squad Framework
 */

import { ConversationContext } from './agent-orchestrator'

export interface IntentClassification {
  intent: string
  domain: string
  confidence: number
  reasoning: string
  suggestedAgent: string
  entities?: Record<string, any>
  sentiment?: 'positive' | 'negative' | 'neutral'
  urgency?: 'low' | 'medium' | 'high'
}

export interface ClassificationResult {
  result: IntentClassification
  timestamp: number
  cacheHit: boolean
}

export interface ClassificationConfig {
  model: string
  temperature: number
  cacheEnabled: boolean
  cacheTTL: number
  minConfidence: number
  enableSentimentAnalysis: boolean
  enableEntityExtraction: boolean
}

export interface ClassificationPrompts {
  financial: string
  marketing: string
  hr: string
  system: string
  general: string
}

export class IntentClassifier {
  private cache: Map<string, ClassificationResult> = new Map()
  private config: ClassificationConfig
  private prompts: ClassificationPrompts
  private logger: Console

  constructor(config: ClassificationConfig) {
    this.config = config
    this.logger = console
    this.prompts = this.initializePrompts()
  }

  private initializePrompts(): ClassificationPrompts {
    return {
      financial: `
        Analise a seguinte mensagem e contexto para classificar a intenção financeira:
        
        MENSAGEM: "{message}"
        
        CONTEXTO DA CONVERSA:
        - Última intenção: {lastIntent}
        - Último agente: {lastAgent}
        - Histórico recente: {recentHistory}
        - Tipo de usuário: {userType}
        
        CLASSIFIQUE EM UMA DAS SEGUINTES INTENÇÕES FINANCEIRAS:
        
        - add_expense: Adicionar despesa (gastos, pagamentos, compras)
        - add_revenue: Adicionar receita (vendas, faturamento, ganhos)
        - cashflow_analysis: Análise de fluxo de caixa (saldo, caixa, liquidez)
        - budget_planning: Planejamento orçamentário (orçamento, metas, planejamento)
        - financial_query: Consulta financeira geral (relatórios, resumos, perguntas)
        
        Responda em formato JSON:
        {
          "intent": "intenção_classificada",
          "domain": "financial",
          "confidence": 0.0-1.0,
          "reasoning": "explicação_breve",
          "suggested_agent": "financial",
          "entities": {
            "amount": "valor_extraído_se_houver",
            "category": "categoria_extraída_se_houver",
            "date": "data_extraída_se_houver"
          },
          "sentiment": "positive|negative|neutral",
          "urgency": "low|medium|high"
        }
      `,
      
      marketing: `
        Analise a seguinte mensagem e contexto para classificar a intenção de marketing/vendas:
        
        MENSAGEM: "{message}"
        
        CONTEXTO DA CONVERSA:
        - Última intenção: {lastIntent}
        - Último agente: {lastAgent}
        - Histórico recente: {recentHistory}
        - Tipo de usuário: {userType}
        
        CLASSIFIQUE EM UMA DAS SEGUINTES INTENÇÕES DE MARKETING:
        
        - lead_management: Gerenciar leads (prospectos, clientes, contatos)
        - campaign_analysis: Análise de campanhas (métricas, performance, ROI)
        - sales_report: Relatório de vendas (vendas, performance, metas)
        - marketing_query: Consulta de marketing (estratégias, ferramentas, dúvidas)
        
        Responda em formato JSON:
        {
          "intent": "intenção_classificada",
          "domain": "marketing",
          "confidence": 0.0-1.0,
          "reasoning": "explicação_breve",
          "suggested_agent": "marketing_sales",
          "entities": {
            "lead_name": "nome_do_lead_se_houver",
            "campaign_name": "nome_da_campanha_se_houver",
            "product": "produto_mencionado_se_houver"
          },
          "sentiment": "positive|negative|neutral",
          "urgency": "low|medium|high"
        }
      `,
      
      hr: `
        Analise a seguinte mensagem e contexto para classificar a intenção de RH:
        
        MENSAGEM: "{message}"
        
        CONTEXTO DA CONVERSA:
        - Última intenção: {lastIntent}
        - Último agente: {lastAgent}
        - Histórico recente: {recentHistory}
        - Tipo de usuário: {userType}
        
        CLASSIFIQUE EM UMA DAS SEGUINTES INTENÇÕES DE RH:
        
        - employee_management: Gerenciar funcionários (contratação, demissão, avaliação)
        - payroll: Folha de pagamento (salários, benefícios, descontos)
        - hr_query: Consulta de RH (políticas, procedimentos, dúvidas)
        
        Responda em formato JSON:
        {
          "intent": "intenção_classificada",
          "domain": "hr",
          "confidence": 0.0-1.0,
          "reasoning": "explicação_breve",
          "suggested_agent": "hr",
          "entities": {
            "employee_name": "nome_do_funcionário_se_houver",
            "department": "departamento_se_houver",
            "position": "cargo_se_houver"
          },
          "sentiment": "positive|negative|neutral",
          "urgency": "low|medium|high"
        }
      `,
      
      system: `
        Analise a seguinte mensagem e contexto para classificar a intenção do sistema:
        
        MENSAGEM: "{message}"
        
        CONTEXTO DA CONVERSA:
        - Última intenção: {lastIntent}
        - Último agente: {lastAgent}
        - Histórico recente: {recentHistory}
        - Tipo de usuário: {userType}
        
        CLASSIFIQUE EM UMA DAS SEGUINTES INTENÇÕES DO SISTEMA:
        
        - agent_switch: Trocar de agente (mudar agente, transferir, falar com)
        - help: Ajuda/suporte (ajuda, suporte, como usar, comandos)
        - settings: Configurações (configurar, ajustar, preferências)
        - status: Status do sistema (status, saúde, funcionamento)
        
        Responda em formato JSON:
        {
          "intent": "intenção_classificada",
          "domain": "system",
          "confidence": 0.0-1.0,
          "reasoning": "explicação_breve",
          "suggested_agent": "general",
          "entities": {
            "target_agent": "agente_destino_se_houver",
            "command": "comando_solicitado_se_houver"
          },
          "sentiment": "positive|negative|neutral",
          "urgency": "low|medium|high"
        }
      `,
      
      general: `
        Analise a seguinte mensagem e contexto para classificar a intenção geral:
        
        MENSAGEM: "{message}"
        
        CONTEXTO DA CONVERSA:
        - Última intenção: {lastIntent}
        - Último agente: {lastAgent}
        - Histórico recente: {recentHistory}
        - Tipo de usuário: {userType}
        
        CLASSIFIQUE EM UMA DAS SEGUINTES INTENÇÕES GERAIS:
        
        - general_query: Consulta geral (perguntas, informações, dúvidas)
        - greeting: Saudação (oi, olá, bom dia, boa tarde)
        - goodbye: Despedida (tchau, até logo, obrigado)
        - small_talk: Conversa casual (como está, clima, notícias)
        
        Responda em formato JSON:
        {
          "intent": "intenção_classificada",
          "domain": "general",
          "confidence": 0.0-1.0,
          "reasoning": "explicação_breve",
          "suggested_agent": "general",
          "entities": {},
          "sentiment": "positive|negative|neutral",
          "urgency": "low|medium|high"
        }
      `
    }
  }

  async classify(
    message: string,
    context: ConversationContext
  ): Promise<IntentClassification> {
    const startTime = Date.now()
    
    try {
      // 1. Verificar cache primeiro
      const cacheKey = this.generateCacheKey(message, context)
      const cached = this.cache.get(cacheKey)
      
      if (cached && this.isCacheValid(cached)) {
        this.logger.log(`Intent classification cache hit for: ${message.substring(0, 50)}...`)
        return {
          ...cached.result,
          confidence: cached.result.confidence
        }
      }

      // 2. Preparar contexto para classificação
      const classificationContext = this.prepareContext(message, context)
      
      // 3. Classificar usando LLM (simplified implementation)
      const classification = await this.performIntentClassification(classificationContext)

      // 4. Validar confiança mínima
      if (classification.confidence < this.config.minConfidence) {
        classification.intent = 'general_query'
        classification.domain = 'general'
        classification.confidence = 0.5
        classification.reasoning = 'Confiança baixa, redirecionando para consulta geral'
        classification.suggestedAgent = 'general'
      }

      // 5. Cache resultado
      if (this.config.cacheEnabled) {
        this.cache.set(cacheKey, {
          result: classification,
          timestamp: Date.now(),
          cacheHit: false
        })
      }

      const processingTime = Date.now() - startTime
      this.logger.log(`Intent classified in ${processingTime}ms: ${classification.intent} (${classification.confidence})`)

      return classification

    } catch (error) {
      this.logger.error('Intent classification error:', error)
      
      // Fallback para classificação básica
      return this.fallbackClassification(message, context)
    }
  }

  private async performIntentClassification(
    context: ClassificationContext
  ): Promise<IntentClassification> {
    // Esta é uma implementação simplificada
    // Em um cenário real, você usaria OpenAI ou outro serviço LLM
    
    const lowerMessage = context.message.toLowerCase()
    
    // Classificação financeira
    if (this.isFinancialMessage(lowerMessage)) {
      return this.classifyFinancialIntent(context)
    }
    
    // Classificação de marketing
    if (this.isMarketingMessage(lowerMessage)) {
      return this.classifyMarketingIntent(context)
    }
    
    // Classificação de RH
    if (this.isHRMessage(lowerMessage)) {
      return this.classifyHRIntent(context)
    }
    
    // Classificação do sistema
    if (this.isSystemMessage(lowerMessage)) {
      return this.classifySystemIntent(context)
    }
    
    // Classificação geral
    return this.classifyGeneralIntent(context)
  }

  private isFinancialMessage(message: string): boolean {
    const financialKeywords = [
      'despesa', 'gasto', 'pagamento', 'receita', 'venda', 'faturamento',
      'fluxo de caixa', 'caixa', 'saldo', 'orçamento', 'planejamento',
      'dinheiro', 'valor', 'preço', 'custo', 'investimento', 'lucro',
      'prejuízo', 'balanço', 'contas', 'finanças', 'financeiro'
    ]
    
    return financialKeywords.some(keyword => message.includes(keyword))
  }

  private isMarketingMessage(message: string): boolean {
    const marketingKeywords = [
      'lead', 'prospecto', 'cliente', 'campanha', 'marketing', 'vendas',
      'conversão', 'funil', 'métricas', 'roi', 'performance', 'análise',
      'relatório', 'estratégia', 'ferramenta', 'plataforma', 'social media'
    ]
    
    return marketingKeywords.some(keyword => message.includes(keyword))
  }

  private isHRMessage(message: string): boolean {
    const hrKeywords = [
      'funcionário', 'colaborador', 'equipe', 'folha', 'salário', 'benefício',
      'contratação', 'demissão', 'avaliação', 'performance', 'departamento',
      'cargo', 'posição', 'rh', 'recursos humanos', 'gestão de pessoas'
    ]
    
    return hrKeywords.some(keyword => message.includes(keyword))
  }

  private isSystemMessage(message: string): boolean {
    const systemKeywords = [
      'trocar agente', 'mudar agente', 'transferir', 'ajuda', 'suporte',
      'configurar', 'ajustar', 'status', 'comando', 'help', 'como usar'
    ]
    
    return systemKeywords.some(keyword => message.includes(keyword))
  }

  private classifyFinancialIntent(context: ClassificationContext): IntentClassification {
    const lowerMessage = context.message.toLowerCase()
    
    if (lowerMessage.includes('despesa') || lowerMessage.includes('gasto') || lowerMessage.includes('pagamento')) {
      return {
        intent: 'add_expense',
        domain: 'financial',
        confidence: 0.9,
        reasoning: 'Mensagem contém palavras-chave de despesa',
        suggestedAgent: 'financial',
        entities: this.extractFinancialEntities(context.message),
        sentiment: this.analyzeSentiment(context.message),
        urgency: this.analyzeUrgency(context.message)
      }
    }
    
    if (lowerMessage.includes('receita') || lowerMessage.includes('venda') || lowerMessage.includes('faturamento')) {
      return {
        intent: 'add_revenue',
        domain: 'financial',
        confidence: 0.9,
        reasoning: 'Mensagem contém palavras-chave de receita',
        suggestedAgent: 'financial',
        entities: this.extractFinancialEntities(context.message),
        sentiment: this.analyzeSentiment(context.message),
        urgency: this.analyzeUrgency(context.message)
      }
    }
    
    if (lowerMessage.includes('fluxo de caixa') || lowerMessage.includes('caixa') || lowerMessage.includes('saldo')) {
      return {
        intent: 'cashflow_analysis',
        domain: 'financial',
        confidence: 0.8,
        reasoning: 'Mensagem contém palavras-chave de análise de caixa',
        suggestedAgent: 'financial',
        entities: this.extractFinancialEntities(context.message),
        sentiment: this.analyzeSentiment(context.message),
        urgency: this.analyzeUrgency(context.message)
      }
    }
    
    if (lowerMessage.includes('orçamento') || lowerMessage.includes('planejamento') || lowerMessage.includes('meta')) {
      return {
        intent: 'budget_planning',
        domain: 'financial',
        confidence: 0.8,
        reasoning: 'Mensagem contém palavras-chave de planejamento',
        suggestedAgent: 'financial',
        entities: this.extractFinancialEntities(context.message),
        sentiment: this.analyzeSentiment(context.message),
        urgency: this.analyzeUrgency(context.message)
      }
    }
    
    return {
      intent: 'financial_query',
      domain: 'financial',
      confidence: 0.7,
      reasoning: 'Consulta financeira geral identificada',
      suggestedAgent: 'financial',
      entities: this.extractFinancialEntities(context.message),
      sentiment: this.analyzeSentiment(context.message),
      urgency: this.analyzeUrgency(context.message)
    }
  }

  private classifyMarketingIntent(context: ClassificationContext): IntentClassification {
    const lowerMessage = context.message.toLowerCase()
    
    if (lowerMessage.includes('lead') || lowerMessage.includes('prospecto') || lowerMessage.includes('cliente')) {
      return {
        intent: 'lead_management',
        domain: 'marketing',
        confidence: 0.8,
        reasoning: 'Mensagem contém palavras-chave de gestão de leads',
        suggestedAgent: 'marketing_sales',
        entities: this.extractMarketingEntities(context.message),
        sentiment: this.analyzeSentiment(context.message),
        urgency: this.analyzeUrgency(context.message)
      }
    }
    
    if (lowerMessage.includes('campanha') || lowerMessage.includes('métricas') || lowerMessage.includes('performance')) {
      return {
        intent: 'campaign_analysis',
        domain: 'marketing',
        confidence: 0.8,
        reasoning: 'Mensagem contém palavras-chave de análise de campanha',
        suggestedAgent: 'marketing_sales',
        entities: this.extractMarketingEntities(context.message),
        sentiment: this.analyzeSentiment(context.message),
        urgency: this.analyzeUrgency(context.message)
      }
    }
    
    return {
      intent: 'marketing_query',
      domain: 'marketing',
      confidence: 0.7,
      reasoning: 'Consulta de marketing geral identificada',
      suggestedAgent: 'marketing_sales',
      entities: this.extractMarketingEntities(context.message),
      sentiment: this.analyzeSentiment(context.message),
      urgency: this.analyzeUrgency(context.message)
    }
  }

  private classifyHRIntent(context: ClassificationContext): IntentClassification {
    const lowerMessage = context.message.toLowerCase()
    
    if (lowerMessage.includes('funcionário') || lowerMessage.includes('colaborador') || lowerMessage.includes('equipe')) {
      return {
        intent: 'employee_management',
        domain: 'hr',
        confidence: 0.8,
        reasoning: 'Mensagem contém palavras-chave de gestão de funcionários',
        suggestedAgent: 'hr',
        entities: this.extractHREntities(context.message),
        sentiment: this.analyzeSentiment(context.message),
        urgency: this.analyzeUrgency(context.message)
      }
    }
    
    if (lowerMessage.includes('folha') || lowerMessage.includes('salário') || lowerMessage.includes('benefício')) {
      return {
        intent: 'payroll',
        domain: 'hr',
        confidence: 0.8,
        reasoning: 'Mensagem contém palavras-chave de folha de pagamento',
        suggestedAgent: 'hr',
        entities: this.extractHREntities(context.message),
        sentiment: this.analyzeSentiment(context.message),
        urgency: this.analyzeUrgency(context.message)
      }
    }
    
    return {
      intent: 'hr_query',
      domain: 'hr',
      confidence: 0.7,
      reasoning: 'Consulta de RH geral identificada',
      suggestedAgent: 'hr',
      entities: this.extractHREntities(context.message),
      sentiment: this.analyzeSentiment(context.message),
      urgency: this.analyzeUrgency(context.message)
    }
  }

  private classifySystemIntent(context: ClassificationContext): IntentClassification {
    const lowerMessage = context.message.toLowerCase()
    
    if (lowerMessage.includes('trocar') || lowerMessage.includes('mudar') || lowerMessage.includes('transferir')) {
      return {
        intent: 'agent_switch',
        domain: 'system',
        confidence: 0.8,
        reasoning: 'Mensagem contém palavras-chave de troca de agente',
        suggestedAgent: 'general',
        entities: this.extractSystemEntities(context.message),
        sentiment: this.analyzeSentiment(context.message),
        urgency: this.analyzeUrgency(context.message)
      }
    }
    
    if (lowerMessage.includes('ajuda') || lowerMessage.includes('suporte') || lowerMessage.includes('help')) {
      return {
        intent: 'help',
        domain: 'system',
        confidence: 0.8,
        reasoning: 'Mensagem contém palavras-chave de ajuda',
        suggestedAgent: 'general',
        entities: this.extractSystemEntities(context.message),
        sentiment: this.analyzeSentiment(context.message),
        urgency: this.analyzeUrgency(context.message)
      }
    }
    
    return {
      intent: 'general_query',
      domain: 'general',
      confidence: 0.5,
      reasoning: 'Intenção não específica identificada',
      suggestedAgent: 'general',
      entities: {},
      sentiment: this.analyzeSentiment(context.message),
      urgency: this.analyzeUrgency(context.message)
    }
  }

  private classifyGeneralIntent(context: ClassificationContext): IntentClassification {
    const lowerMessage = context.message.toLowerCase()
    
    if (lowerMessage.includes('oi') || lowerMessage.includes('olá') || lowerMessage.includes('bom dia') || lowerMessage.includes('boa tarde')) {
      return {
        intent: 'greeting',
        domain: 'general',
        confidence: 0.9,
        reasoning: 'Saudação identificada',
        suggestedAgent: 'general',
        entities: {},
        sentiment: 'positive',
        urgency: 'low'
      }
    }
    
    if (lowerMessage.includes('tchau') || lowerMessage.includes('até logo') || lowerMessage.includes('obrigado')) {
      return {
        intent: 'goodbye',
        domain: 'general',
        confidence: 0.9,
        reasoning: 'Despedida identificada',
        suggestedAgent: 'general',
        entities: {},
        sentiment: 'positive',
        urgency: 'low'
      }
    }
    
    return {
      intent: 'general_query',
      domain: 'general',
      confidence: 0.6,
      reasoning: 'Consulta geral identificada',
      suggestedAgent: 'general',
      entities: {},
      sentiment: this.analyzeSentiment(context.message),
      urgency: this.analyzeUrgency(context.message)
    }
  }

  private extractFinancialEntities(message: string): Record<string, any> {
    const entities: Record<string, any> = {}
    
    // Extrair valor monetário
    const amountMatch = message.match(/r\$\s*(\d+(?:,\d{2})?)/i)
    if (amountMatch) {
      entities.amount = parseFloat(amountMatch[1].replace(',', '.'))
    }
    
    // Extrair categoria
    const categories = ['alimentação', 'transporte', 'saúde', 'educação', 'lazer', 'serviços', 'produtos']
    for (const category of categories) {
      if (message.toLowerCase().includes(category)) {
        entities.category = category
        break
      }
    }
    
    // Extrair data
    if (message.toLowerCase().includes('hoje')) {
      entities.date = new Date()
    } else if (message.toLowerCase().includes('ontem')) {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      entities.date = yesterday
    }
    
    return entities
  }

  private extractMarketingEntities(message: string): Record<string, any> {
    const entities: Record<string, any> = {}
    
    // Extrair nome do lead/cliente
    const nameMatch = message.match(/(?:lead|cliente|prospecto)\s+([A-Za-z\s]+)/i)
    if (nameMatch) {
      entities.lead_name = nameMatch[1].trim()
    }
    
    // Extrair nome da campanha
    const campaignMatch = message.match(/(?:campanha|campaign)\s+([A-Za-z\s]+)/i)
    if (campaignMatch) {
      entities.campaign_name = campaignMatch[1].trim()
    }
    
    return entities
  }

  private extractHREntities(message: string): Record<string, any> {
    const entities: Record<string, any> = {}
    
    // Extrair nome do funcionário
    const employeeMatch = message.match(/(?:funcionário|colaborador)\s+([A-Za-z\s]+)/i)
    if (employeeMatch) {
      entities.employee_name = employeeMatch[1].trim()
    }
    
    // Extrair departamento
    const deptMatch = message.match(/(?:departamento|depto)\s+([A-Za-z\s]+)/i)
    if (deptMatch) {
      entities.department = deptMatch[1].trim()
    }
    
    return entities
  }

  private extractSystemEntities(message: string): Record<string, any> {
    const entities: Record<string, any> = {}
    
    // Extrair agente de destino
    const agentMatch = message.match(/(?:agente|agent)\s+([A-Za-z\s]+)/i)
    if (agentMatch) {
      entities.target_agent = agentMatch[1].trim()
    }
    
    return entities
  }

  private analyzeSentiment(message: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['bom', 'ótimo', 'excelente', 'perfeito', 'obrigado', 'obrigada']
    const negativeWords = ['ruim', 'péssimo', 'terrível', 'problema', 'erro', 'falha']
    
    const lowerMessage = message.toLowerCase()
    
    const positiveCount = positiveWords.filter(word => lowerMessage.includes(word)).length
    const negativeCount = negativeWords.filter(word => lowerMessage.includes(word)).length
    
    if (positiveCount > negativeCount) return 'positive'
    if (negativeCount > positiveCount) return 'negative'
    return 'neutral'
  }

  private analyzeUrgency(message: string): 'low' | 'medium' | 'high' {
    const urgentWords = ['urgente', 'emergência', 'rápido', 'agora', 'imediato']
    const mediumWords = ['importante', 'prioridade', 'logo', 'breve']
    
    const lowerMessage = message.toLowerCase()
    
    if (urgentWords.some(word => lowerMessage.includes(word))) return 'high'
    if (mediumWords.some(word => lowerMessage.includes(word))) return 'medium'
    return 'low'
  }

  private prepareContext(message: string, context: ConversationContext): ClassificationContext {
    return {
      message,
      lastIntent: context.lastIntent || 'N/A',
      lastAgent: context.lastAgent || 'N/A',
      recentHistory: context.conversationHistory.slice(-3).join(' | ') || 'N/A',
      userType: context.userProfile?.type || 'N/A'
    }
  }

  private fallbackClassification(message: string, context: ConversationContext): IntentClassification {
    return {
      intent: 'general_query',
      domain: 'general',
      confidence: 0.3,
      reasoning: 'Classificação de fallback devido a erro',
      suggestedAgent: 'general',
      entities: {},
      sentiment: 'neutral',
      urgency: 'low'
    }
  }

  private generateCacheKey(message: string, context: ConversationContext): string {
    const contextHash = `${context.conversationId}_${context.userId}_${context.lastIntent || 'none'}`
    return `${message.substring(0, 100)}_${contextHash}`
  }

  private isCacheValid(cached: ClassificationResult): boolean {
    const now = Date.now()
    const age = now - cached.timestamp
    return age < this.config.cacheTTL * 1000
  }

  public clearCache(): void {
    this.cache.clear()
    this.logger.log('Intent classification cache cleared')
  }

  public getCacheStats(): Record<string, any> {
    return {
      size: this.cache.size,
      enabled: this.config.cacheEnabled,
      ttl: this.config.cacheTTL
    }
  }
}

interface ClassificationContext {
  message: string
  lastIntent: string
  lastAgent: string
  recentHistory: string
  userType: string
}

export default IntentClassifier
