/**
 * Sistema de Memória para Agente Secretário do Falachefe
 * Tipos e interfaces para gerenciamento de memória robusto
 */

export enum MemoryCategory {
  CONVERSATION = 'conversation',
  USER_PROFILE = 'user_profile', 
  BUSINESS_CONTEXT = 'business',
  FINANCIAL_DATA = 'financial',
  LEARNING = 'learning',
  PREFERENCES = 'preferences',
  GOALS = 'goals',
  INSIGHTS = 'insights'
}

export enum MemoryImportance {
  LOW = 0.2,
  MEDIUM = 0.5,
  HIGH = 0.8,
  CRITICAL = 1.0
}

export interface MemoryItem {
  id: string
  userId: string
  conversationId?: string
  category: MemoryCategory
  key: string
  value: any
  importance: number
  ttl?: number // Time to live in seconds
  createdAt: Date
  updatedAt: Date
  expiresAt?: Date
  metadata?: Record<string, any>
}

export interface ConversationContext {
  conversationId: string
  userId: string
  contextData: Record<string, any>
  messageCount: number
  lastActivity: Date
  createdAt: Date
}

export interface UserMemoryProfile {
  userId: string
  profileData: {
    name?: string
    company?: string
    position?: string
    industry?: string
    preferences?: Record<string, any>
    businessContext?: Record<string, any>
  }
  preferences: Record<string, any>
  businessContext: Record<string, any>
  lastUpdated: Date
  createdAt: Date
}

export interface MemorySearchResult {
  memory: MemoryItem
  relevanceScore: number
  matchedFields: string[]
}

export interface MemoryQuery {
  userId: string
  conversationId?: string
  category?: MemoryCategory
  key?: string
  searchText?: string
  importanceThreshold?: number
  limit?: number
  offset?: number
}

export interface MemoryManager {
  // Operações básicas
  store(memory: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MemoryItem>
  retrieve(query: MemoryQuery): Promise<MemoryItem[]>
  update(id: string, updates: Partial<MemoryItem>): Promise<MemoryItem>
  delete(id: string): Promise<boolean>
  
  // Operações de contexto
  getConversationContext(conversationId: string): Promise<ConversationContext | null>
  updateConversationContext(conversationId: string, context: Partial<ConversationContext>): Promise<ConversationContext>
  
  // Operações de perfil
  getUserProfile(userId: string): Promise<UserMemoryProfile | null>
  updateUserProfile(userId: string, profile: Partial<UserMemoryProfile>): Promise<UserMemoryProfile>
  
  // Busca semântica
  semanticSearch(query: string, userId: string, category?: MemoryCategory): Promise<MemorySearchResult[]>
  
  // Limpeza e manutenção
  cleanupExpiredMemories(): Promise<number>
  getMemoryStats(userId: string): Promise<Record<string, any>>
}


