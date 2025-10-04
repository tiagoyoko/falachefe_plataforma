/**
 * Sistema de Aprendizado e Insights
 * Aprende com interações e gera insights personalizados
 */

import { memoryManager } from './memory-manager'
import { MemoryCategory, MemoryImportance } from './types'

export interface LearningInsight {
  id: string
  userId: string
  type: 'pattern' | 'preference' | 'behavior' | 'need' | 'opportunity'
  title: string
  description: string
  confidence: number
  evidence: string[]
  recommendations: string[]
  createdAt: Date
  lastUpdated: Date
}

export interface UserPattern {
  pattern: string
  frequency: number
  contexts: string[]
  lastSeen: Date
  confidence: number
}

export interface LearningRecommendation {
  type: 'feature' | 'workflow' | 'optimization' | 'education'
  title: string
  description: string
  priority: 'low' | 'medium' | 'high'
  reasoning: string
  actionItems: string[]
}

export class LearningSystem {
  private readonly MIN_PATTERN_FREQUENCY = 3
  private readonly INSIGHT_CONFIDENCE_THRESHOLD = 0.7

  /**
   * Analisa interações e gera insights
   */
  async analyzeInteractions(userId: string, conversationId?: string): Promise<LearningInsight[]> {
    try {
      // Buscar memórias de interações recentes
      const interactions = await memoryManager.retrieve({
        userId,
        conversationId,
        category: MemoryCategory.LEARNING,
        limit: 100
      })

      const insights: LearningInsight[] = []

      // Analisar padrões de uso
      const usagePatterns = await this.analyzeUsagePatterns(interactions)
      for (const pattern of usagePatterns) {
        if (pattern.confidence >= this.INSIGHT_CONFIDENCE_THRESHOLD) {
          insights.push(await this.createPatternInsight(userId, pattern))
        }
      }

      // Analisar preferências
      const preferences = await this.analyzePreferences(interactions)
      for (const preference of preferences) {
        insights.push(await this.createPreferenceInsight(userId, preference))
      }

      // Analisar necessidades não atendidas
      const needs = await this.analyzeUnmetNeeds(interactions)
      for (const need of needs) {
        insights.push(await this.createNeedInsight(userId, need))
      }

      // Armazenar insights gerados
      for (const insight of insights) {
        await this.storeInsight(insight)
      }

      return insights
    } catch (error) {
      console.error('❌ Erro ao analisar interações:', error)
      return []
    }
  }

  /**
   * Gera recomendações personalizadas
   */
  async generateRecommendations(userId: string): Promise<LearningRecommendation[]> {
    try {
      const insights = await this.getUserInsights(userId)
      const recommendations: LearningRecommendation[] = []

      // Recomendações baseadas em padrões
      const patternInsights = insights.filter(i => i.type === 'pattern')
      for (const insight of patternInsights) {
        recommendations.push(...this.generatePatternRecommendations(insight))
      }

      // Recomendações baseadas em necessidades
      const needInsights = insights.filter(i => i.type === 'need')
      for (const insight of needInsights) {
        recommendations.push(...this.generateNeedRecommendations(insight))
      }

      // Recomendações baseadas em oportunidades
      const opportunityInsights = insights.filter(i => i.type === 'opportunity')
      for (const insight of opportunityInsights) {
        recommendations.push(...this.generateOpportunityRecommendations(insight))
      }

      return recommendations.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      })
    } catch (error) {
      console.error('❌ Erro ao gerar recomendações:', error)
      return []
    }
  }

  /**
   * Aprende com feedback do usuário
   */
  async learnFromFeedback(userId: string, feedback: {
    type: 'positive' | 'negative' | 'suggestion'
    content: string
    context?: string
    rating?: number
  }): Promise<void> {
    try {
      // Armazenar feedback como memória
      await memoryManager.store({
        userId,
        category: MemoryCategory.LEARNING,
        key: `feedback_${Date.now()}`,
        value: {
          ...feedback,
          timestamp: new Date().toISOString()
        },
        importance: feedback.rating ? MemoryImportance.HIGH : MemoryImportance.MEDIUM,
        ttl: 86400 * 7 // 7 dias
      })

      // Se for feedback negativo, analisar possíveis melhorias
      if (feedback.type === 'negative') {
        await this.analyzeNegativeFeedback(userId, feedback)
      }

      // Se for sugestão, considerar para futuras melhorias
      if (feedback.type === 'suggestion') {
        await this.analyzeSuggestion(userId, feedback)
      }
    } catch (error) {
      console.error('❌ Erro ao processar feedback:', error)
    }
  }

  /**
   * Obtém insights do usuário
   */
  async getUserInsights(userId: string): Promise<LearningInsight[]> {
    try {
      const insights = await memoryManager.retrieve({
        userId,
        category: MemoryCategory.INSIGHTS,
        limit: 50
      })

      return insights.map(memory => ({
        id: memory.id,
        userId: memory.userId,
        type: memory.value.type,
        title: memory.value.title,
        description: memory.value.description,
        confidence: memory.value.confidence,
        evidence: memory.value.evidence,
        recommendations: memory.value.recommendations,
        createdAt: memory.createdAt,
        lastUpdated: memory.updatedAt
      }))
    } catch (error) {
      console.error('❌ Erro ao obter insights:', error)
      return []
    }
  }

  /**
   * Analisa padrões de uso
   */
  private async analyzeUsagePatterns(interactions: any[]): Promise<UserPattern[]> {
    const patterns: Map<string, UserPattern> = new Map()

    for (const interaction of interactions) {
      const content = interaction.value.content || ''
      const context = interaction.value.context || ''

      // Padrões de horário
      const hour = new Date(interaction.createdAt).getHours()
      const timePattern = this.getTimePattern(hour)
      this.updatePattern(patterns, `time_${timePattern}`, context)

      // Padrões de funcionalidades
      const features = this.extractFeatures(content)
      for (const feature of features) {
        this.updatePattern(patterns, `feature_${feature}`, context)
      }

      // Padrões de linguagem
      const languagePattern = this.analyzeLanguagePattern(content)
      this.updatePattern(patterns, `language_${languagePattern}`, context)
    }

    return Array.from(patterns.values()).filter(p => p.frequency >= this.MIN_PATTERN_FREQUENCY)
  }

  /**
   * Analisa preferências do usuário
   */
  private async analyzePreferences(interactions: any[]): Promise<any[]> {
    const preferences: any[] = []

    // Analisar estilo de comunicação
    const communicationStyles = interactions.map(i => this.analyzeCommunicationStyle(i.value.content))
    const mostCommonStyle = this.getMostCommon(communicationStyles)
    if (mostCommonStyle) {
      preferences.push({
        type: 'communication_style',
        value: mostCommonStyle,
        confidence: this.calculateConfidence(communicationStyles, mostCommonStyle)
      })
    }

    // Analisar funcionalidades preferidas
    const features = interactions.flatMap(i => this.extractFeatures(i.value.content))
    const featureCounts = this.countOccurrences(features)
    const topFeatures = Object.entries(featureCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([feature, count]) => ({
        type: 'preferred_feature',
        value: feature,
        confidence: Math.min(count / interactions.length, 1)
      }))

    preferences.push(...topFeatures)

    return preferences
  }

  /**
   * Analisa necessidades não atendidas
   */
  private async analyzeUnmetNeeds(interactions: any[]): Promise<any[]> {
    const needs: any[] = []

    for (const interaction of interactions) {
      const content = interaction.value.content || ''
      
      // Detectar perguntas frequentes
      if (content.includes('como') || content.includes('como fazer')) {
        needs.push({
          type: 'tutorial_need',
          value: this.extractTutorialNeed(content),
          confidence: 0.8
        })
      }

      // Detectar funcionalidades solicitadas
      if (content.includes('preciso') || content.includes('quero')) {
        needs.push({
          type: 'feature_request',
          value: this.extractFeatureRequest(content),
          confidence: 0.7
        })
      }

      // Detectar problemas recorrentes
      if (content.includes('não funciona') || content.includes('erro')) {
        needs.push({
          type: 'support_need',
          value: this.extractSupportNeed(content),
          confidence: 0.9
        })
      }
    }

    return needs
  }

  /**
   * Cria insight de padrão
   */
  private async createPatternInsight(userId: string, pattern: UserPattern): Promise<LearningInsight> {
    return {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'pattern',
      title: `Padrão identificado: ${pattern.pattern}`,
      description: `Usuário demonstra padrão consistente de ${pattern.pattern} com frequência de ${pattern.frequency} ocorrências`,
      confidence: pattern.confidence,
      evidence: pattern.contexts,
      recommendations: this.generatePatternRecommendations({ type: 'pattern', value: pattern.pattern, confidence: pattern.confidence }).map(r => r.title),
      createdAt: new Date(),
      lastUpdated: new Date()
    }
  }

  /**
   * Cria insight de preferência
   */
  private async createPreferenceInsight(userId: string, preference: any): Promise<LearningInsight> {
    return {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'preference',
      title: `Preferência identificada: ${preference.value}`,
      description: `Usuário demonstra preferência por ${preference.value} com confiança de ${(preference.confidence * 100).toFixed(1)}%`,
      confidence: preference.confidence,
      evidence: [],
      recommendations: [],
      createdAt: new Date(),
      lastUpdated: new Date()
    }
  }

  /**
   * Cria insight de necessidade
   */
  private async createNeedInsight(userId: string, need: any): Promise<LearningInsight> {
    return {
      id: `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type: 'need',
      title: `Necessidade identificada: ${need.value}`,
      description: `Usuário demonstra necessidade de ${need.value} com confiança de ${(need.confidence * 100).toFixed(1)}%`,
      confidence: need.confidence,
      evidence: [],
      recommendations: [],
      createdAt: new Date(),
      lastUpdated: new Date()
    }
  }

  /**
   * Armazena insight
   */
  private async storeInsight(insight: LearningInsight): Promise<void> {
    try {
      await memoryManager.store({
        userId: insight.userId,
        category: MemoryCategory.INSIGHTS,
        key: `insight_${insight.id}`,
        value: {
          type: insight.type,
          title: insight.title,
          description: insight.description,
          confidence: insight.confidence,
          evidence: insight.evidence,
          recommendations: insight.recommendations
        },
        importance: MemoryImportance.HIGH,
        ttl: 86400 * 30 // 30 dias
      })
    } catch (error) {
      console.error('❌ Erro ao armazenar insight:', error)
    }
  }

  // Métodos auxiliares
  private updatePattern(patterns: Map<string, UserPattern>, key: string, context: string): void {
    const existing = patterns.get(key)
    if (existing) {
      existing.frequency++
      existing.contexts.push(context)
      existing.lastSeen = new Date()
      existing.confidence = Math.min(existing.frequency / 10, 1)
    } else {
      patterns.set(key, {
        pattern: key,
        frequency: 1,
        contexts: [context],
        lastSeen: new Date(),
        confidence: 0.1
      })
    }
  }

  private getTimePattern(hour: number): string {
    if (hour >= 6 && hour < 12) return 'morning'
    if (hour >= 12 && hour < 18) return 'afternoon'
    if (hour >= 18 && hour < 22) return 'evening'
    return 'night'
  }

  private extractFeatures(content: string): string[] {
    const features = [
      'dashboard', 'relatórios', 'financeiro', 'clientes', 'fornecedores',
      'tarefas', 'projetos', 'vendas', 'marketing', 'rh'
    ]
    
    return features.filter(feature => 
      content.toLowerCase().includes(feature)
    )
  }

  private analyzeLanguagePattern(content: string): string {
    if (content.includes('!') || content.includes('?')) return 'expressive'
    if (content.length > 100) return 'detailed'
    if (content.length < 20) return 'brief'
    return 'neutral'
  }

  private analyzeCommunicationStyle(content: string): string {
    if (content.includes('por favor') || content.includes('obrigado')) return 'formal'
    if (content.includes('!') || content.includes('😊')) return 'informal'
    return 'mixed'
  }

  private getMostCommon(items: string[]): string | null {
    const counts = this.countOccurrences(items)
    const sorted = Object.entries(counts).sort(([,a], [,b]) => b - a)
    return sorted.length > 0 ? sorted[0][0] : null
  }

  private countOccurrences(items: string[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  private calculateConfidence(items: string[], target: string): number {
    const count = items.filter(item => item === target).length
    return count / items.length
  }

  private extractTutorialNeed(content: string): string {
    // Implementar extração de necessidade de tutorial
    return 'tutorial_need'
  }

  private extractFeatureRequest(content: string): string {
    // Implementar extração de solicitação de funcionalidade
    return 'feature_request'
  }

  private extractSupportNeed(content: string): string {
    // Implementar extração de necessidade de suporte
    return 'support_need'
  }

  private generatePatternRecommendations(insight: any): LearningRecommendation[] {
    // Implementar geração de recomendações baseadas em padrões
    return []
  }

  private generateNeedRecommendations(insight: any): LearningRecommendation[] {
    // Implementar geração de recomendações baseadas em necessidades
    return []
  }

  private generateOpportunityRecommendations(insight: any): LearningRecommendation[] {
    // Implementar geração de recomendações baseadas em oportunidades
    return []
  }

  private async analyzeNegativeFeedback(userId: string, feedback: any): Promise<void> {
    // Implementar análise de feedback negativo
  }

  private async analyzeSuggestion(userId: string, feedback: any): Promise<void> {
    // Implementar análise de sugestões
  }
}

// Exportar instância singleton
export const learningSystem = new LearningSystem()
