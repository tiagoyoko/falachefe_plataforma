/**
 * Conversation Context Manager - Manages conversation state and context
 * Based on AWS Labs Agent Squad Framework
 */

import { MemorySystem } from './memory-system'
import { ConversationContext, IntentClassification } from './agent-orchestrator'

export interface ContextUpdate {
  field: string
  value: unknown
  timestamp: Date
  source: 'user' | 'agent' | 'system'
  metadata?: Record<string, unknown>
}

export interface ContextSnapshot {
  conversationId: string
  timestamp: Date
  context: ConversationContext
  version: number
  checksum: string
}

export interface ContextManagerConfig {
  maxContextSize: number
  maxHistorySize: number
  contextTimeout: number
  enableCompression: boolean
  enableVersioning: boolean
  enableChecksums: boolean
  compressionThreshold: number
}

export interface ContextMetrics {
  totalConversations: number
  activeConversations: number
  totalUpdates: number
  averageContextSize: number
  compressionRatio: number
  lastCleanup: Date
}

export class ConversationContextManager {
  private memorySystem: MemorySystem
  private config: ContextManagerConfig
  private activeContexts: Map<string, ConversationContext> = new Map()
  private contextHistory: Map<string, ContextSnapshot[]> = new Map()
  private metrics: ContextMetrics
  private logger: Console

  constructor(memorySystem: MemorySystem, config: ContextManagerConfig) {
    this.memorySystem = memorySystem
    this.config = config
    this.logger = console
    this.metrics = this.initializeMetrics()
  }

  private initializeMetrics(): ContextMetrics {
    return {
      totalConversations: 0,
      activeConversations: 0,
      totalUpdates: 0,
      averageContextSize: 0,
      compressionRatio: 1.0,
      lastCleanup: new Date()
    }
  }

  async loadContext(conversationId: string): Promise<ConversationContext | null> {
    try {
      // Verificar se já está em memória
      if (this.activeContexts.has(conversationId)) {
        const context = this.activeContexts.get(conversationId)!
        this.logger.log(`Context loaded from memory for conversation ${conversationId}`)
        return context
      }

      // Carregar do sistema de memória
      const contextData = await this.memorySystem.getSharedMemory(conversationId, 'conversation_context')
      
      if (!contextData) {
        this.logger.log(`No context found for conversation ${conversationId}`)
        return null
      }

      // Deserializar contexto
      const context = this.deserializeContext(JSON.stringify(contextData))
      
      // Armazenar em memória ativa
      this.activeContexts.set(conversationId, context)
      this.metrics.activeConversations++
      
      this.logger.log(`Context loaded from memory system for conversation ${conversationId}`)
      return context

    } catch (error) {
      this.logger.error(`Failed to load context for conversation ${conversationId}:`, error)
      return null
    }
  }

  async updateContext(
    conversationId: string,
    updates: ContextUpdate[]
  ): Promise<ConversationContext | null> {
    try {
      // Carregar contexto atual
      let context = await this.loadContext(conversationId)
      
      if (!context) {
        // Criar novo contexto se não existir
        context = this.createNewContext(conversationId)
      }

      // Aplicar atualizações
      const updatedContext = this.applyUpdates(context, updates)
      
      // Validar contexto atualizado
      if (!this.validateContext(updatedContext)) {
        this.logger.error(`Invalid context after updates for conversation ${conversationId}`)
        return null
      }

      // Salvar snapshot se versionamento estiver habilitado
      if (this.config.enableVersioning) {
        await this.saveContextSnapshot(conversationId, updatedContext)
      }

      // Salvar no sistema de memória
      const serializedContext = this.serializeContext(updatedContext)
      await this.memorySystem.setSharedMemory(
        conversationId,
        { conversation_context: serializedContext }
      )

      // Atualizar contexto ativo
      this.activeContexts.set(conversationId, updatedContext)
      
      // Atualizar métricas
      this.updateMetrics(updatedContext)
      
      this.logger.log(`Context updated for conversation ${conversationId}`)
      return updatedContext

    } catch (error) {
      this.logger.error(`Failed to update context for conversation ${conversationId}:`, error)
      return null
    }
  }

  async clearContext(conversationId: string): Promise<boolean> {
    try {
      // Remover da memória ativa
      this.activeContexts.delete(conversationId)
      
      // Limpar do sistema de memória
      await this.memorySystem.clearConversationMemory(conversationId)
      
      // Limpar histórico se versionamento estiver habilitado
      if (this.config.enableVersioning) {
        this.contextHistory.delete(conversationId)
      }

      this.metrics.activeConversations = Math.max(0, this.metrics.activeConversations - 1)
      
      this.logger.log(`Context cleared for conversation ${conversationId}`)
      return true

    } catch (error) {
      this.logger.error(`Failed to clear context for conversation ${conversationId}:`, error)
      return false
    }
  }

  async getContextHistory(conversationId: string): Promise<ContextSnapshot[]> {
    if (!this.config.enableVersioning) {
      this.logger.warn('Context versioning is disabled')
      return []
    }

    return this.contextHistory.get(conversationId) || []
  }

  async restoreContextSnapshot(conversationId: string, version: number): Promise<boolean> {
    if (!this.config.enableVersioning) {
      this.logger.warn('Context versioning is disabled')
      return false
    }

    const history = this.contextHistory.get(conversationId)
    if (!history) {
      this.logger.error(`No history found for conversation ${conversationId}`)
      return false
    }

    const snapshot = history.find(s => s.version === version)
    if (!snapshot) {
      this.logger.error(`Snapshot version ${version} not found for conversation ${conversationId}`)
      return false
    }

    // Restaurar contexto
    this.activeContexts.set(conversationId, snapshot.context)
    
    // Salvar no sistema de memória
    const serializedContext = this.serializeContext(snapshot.context)
    await this.memorySystem.setSharedMemory(
      conversationId,
      { conversation_context: serializedContext }
    )

    this.logger.log(`Context restored to version ${version} for conversation ${conversationId}`)
    return true
  }

  private createNewContext(conversationId: string): ConversationContext {
    return {
      conversationId,
      userId: '',
      agentId: '',
      currentIntent: null,
      conversationHistory: [],
      userPreferences: {},
      sessionData: {},
      metadata: {
        createdAt: new Date(),
        lastUpdated: new Date(),
        version: 1
      }
    }
  }

  private applyUpdates(
    context: ConversationContext,
    updates: ContextUpdate[]
  ): ConversationContext {
    const updatedContext = { ...context }

    for (const update of updates) {
      this.applyContextUpdate(updatedContext, update)
    }

    // Atualizar metadados
    updatedContext.metadata.lastUpdated = new Date()
    updatedContext.metadata.version = (updatedContext.metadata.version || 1) + 1

    return updatedContext
  }

  private applyContextUpdate(context: ConversationContext, update: ContextUpdate): void {
    const fields = update.field.split('.')
    let target: Record<string, unknown> = context as unknown as Record<string, unknown>

    // Navegar até o campo pai
    for (let i = 0; i < fields.length - 1; i++) {
      const field = fields[i]
      if (!(field in target) || typeof target[field] !== 'object' || target[field] === null) {
        target[field] = {}
      }
      target = target[field] as Record<string, unknown>
    }

    // Definir o valor
    const finalField = fields[fields.length - 1]
    target[finalField] = update.value

    // Adicionar metadados da atualização
    if (!context.metadata.updates) {
      context.metadata.updates = []
    }
    context.metadata.updates.push({
      field: update.field,
      value: update.value,
      timestamp: update.timestamp,
      source: update.source,
      metadata: update.metadata
    })
  }

  private validateContext(context: ConversationContext): boolean {
    // Validações básicas
    if (!context.conversationId || typeof context.conversationId !== 'string') {
      return false
    }

    if (!context.metadata || typeof context.metadata !== 'object') {
      return false
    }

    // Verificar tamanho do contexto
    const contextSize = this.calculateContextSize(context)
    if (contextSize > this.config.maxContextSize) {
      this.logger.warn(`Context size ${contextSize} exceeds maximum ${this.config.maxContextSize}`)
      return false
    }

    return true
  }

  private calculateContextSize(context: ConversationContext): number {
    return JSON.stringify(context).length
  }

  private serializeContext(context: ConversationContext): string {
    if (this.config.enableCompression) {
      // Implementar compressão se necessário
      return JSON.stringify(context)
    }
    return JSON.stringify(context)
  }

  private deserializeContext(data: string): ConversationContext {
    try {
      return JSON.parse(data) as ConversationContext
    } catch (error) {
      this.logger.error('Failed to deserialize context:', error)
      throw new Error('Invalid context data')
    }
  }

  private async saveContextSnapshot(
    conversationId: string,
    context: ConversationContext
  ): Promise<void> {
    if (!this.config.enableVersioning) return

    const snapshot: ContextSnapshot = {
      conversationId,
      timestamp: new Date(),
      context: { ...context },
      version: context.metadata.version || 1,
      checksum: this.config.enableChecksums ? this.calculateChecksum(context) : ''
    }

    // Adicionar ao histórico
    if (!this.contextHistory.has(conversationId)) {
      this.contextHistory.set(conversationId, [])
    }

    const history = this.contextHistory.get(conversationId)!
    history.push(snapshot)

    // Manter apenas o histórico recente
    if (history.length > this.config.maxHistorySize) {
      history.splice(0, history.length - this.config.maxHistorySize)
    }
  }

  private calculateChecksum(context: ConversationContext): string {
    // Implementar checksum simples (em produção, usar crypto)
    const data = JSON.stringify(context)
    let hash = 0
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return hash.toString(16)
  }

  private updateMetrics(context: ConversationContext): void {
    this.metrics.totalUpdates++
    
    const contextSize = this.calculateContextSize(context)
    const totalSize = this.metrics.averageContextSize * (this.metrics.totalUpdates - 1) + contextSize
    this.metrics.averageContextSize = totalSize / this.metrics.totalUpdates

    // Atualizar taxa de compressão se habilitada
    if (this.config.enableCompression) {
      const originalSize = JSON.stringify(context).length
      this.metrics.compressionRatio = originalSize / contextSize
    }
  }

  // Métodos de gerenciamento de contexto
  async addMessageToHistory(
    conversationId: string,
    message: { role: 'user' | 'agent' | 'system'; content: string; timestamp: Date }
  ): Promise<boolean> {
    const updates: ContextUpdate[] = [{
      field: 'conversationHistory',
      value: message,
      timestamp: new Date(),
      source: message.role === 'user' ? 'user' : 'agent'
    }]

    const updatedContext = await this.updateContext(conversationId, updates)
    return updatedContext !== null
  }

  async updateCurrentIntent(
    conversationId: string,
    intent: IntentClassification
  ): Promise<boolean> {
    const updates: ContextUpdate[] = [{
      field: 'currentIntent',
      value: intent,
      timestamp: new Date(),
      source: 'system'
    }]

    const updatedContext = await this.updateContext(conversationId, updates)
    return updatedContext !== null
  }

  async updateUserPreferences(
    conversationId: string,
    preferences: Record<string, unknown>
  ): Promise<boolean> {
    const updates: ContextUpdate[] = [{
      field: 'userPreferences',
      value: preferences,
      timestamp: new Date(),
      source: 'user'
    }]

    const updatedContext = await this.updateContext(conversationId, updates)
    return updatedContext !== null
  }

  async updateSessionData(
    conversationId: string,
    sessionData: Record<string, unknown>
  ): Promise<boolean> {
    const updates: ContextUpdate[] = [{
      field: 'sessionData',
      value: sessionData,
      timestamp: new Date(),
      source: 'system'
    }]

    const updatedContext = await this.updateContext(conversationId, updates)
    return updatedContext !== null
  }

  // Métodos de limpeza e manutenção
  async cleanupInactiveContexts(): Promise<number> {
    const now = Date.now()
    let cleanedCount = 0

    for (const [conversationId, context] of this.activeContexts) {
      const lastUpdated = context.metadata.lastUpdated?.getTime() || 0
      const timeSinceUpdate = now - lastUpdated

      if (timeSinceUpdate > this.config.contextTimeout) {
        await this.clearContext(conversationId)
        cleanedCount++
      }
    }

    this.metrics.lastCleanup = new Date()
    this.logger.log(`Cleaned up ${cleanedCount} inactive contexts`)
    
    return cleanedCount
  }

  async compressContext(conversationId: string): Promise<boolean> {
    if (!this.config.enableCompression) {
      return false
    }

    const context = this.activeContexts.get(conversationId)
    if (!context) {
      return false
    }

    const originalSize = this.calculateContextSize(context)
    
    if (originalSize < this.config.compressionThreshold) {
      return false // Não precisa comprimir
    }

    // Implementar lógica de compressão
    // Por enquanto, apenas log
    this.logger.log(`Context compression would be applied to conversation ${conversationId}`)
    
    return true
  }

  // Métodos de métricas e monitoramento
  getMetrics(): ContextMetrics {
    return { ...this.metrics }
  }

  getActiveConversations(): string[] {
    return Array.from(this.activeContexts.keys())
  }

  getContextSize(conversationId: string): number {
    const context = this.activeContexts.get(conversationId)
    return context ? this.calculateContextSize(context) : 0
  }

  // Métodos de debug
  debugContext(conversationId: string): {
    exists: boolean
    size: number
    version: number
    lastUpdated: Date | null
    historyLength: number
  } {
    const context = this.activeContexts.get(conversationId)
    const history = this.contextHistory.get(conversationId) || []

    return {
      exists: !!context,
      size: context ? this.calculateContextSize(context) : 0,
      version: context?.metadata.version || 0,
      lastUpdated: context?.metadata.lastUpdated || null,
      historyLength: history.length
    }
  }

  // Métodos de configuração
  updateConfig(newConfig: Partial<ContextManagerConfig>): void {
    this.config = { ...this.config, ...newConfig }
    this.logger.log('Context manager configuration updated')
  }

  getConfig(): ContextManagerConfig {
    return { ...this.config }
  }
}

export default ConversationContextManager
