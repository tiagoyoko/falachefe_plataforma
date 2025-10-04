/**
 * Gerenciador de Memória Principal para Agente Secretário
 * Implementa sistema robusto de memória com categorias e persistência
 */

import { MemoryItem, MemoryCategory, MemoryQuery, MemorySearchResult, MemoryManager, ConversationContext, UserMemoryProfile } from './types'
import { db } from '@/lib/db'
import { agentMemories, conversationContexts, userMemoryProfiles, memoryEmbeddings } from '@/lib/schema/memory'
import { eq, and, desc, gte, lte, ilike, sql } from 'drizzle-orm'

export class FalachefeMemoryManager implements MemoryManager {
  private readonly DEFAULT_TTL = 3600 // 1 hora
  private readonly MAX_MEMORIES_PER_USER = 1000
  private readonly MAX_CONVERSATION_MEMORIES = 100

  /**
   * Armazena uma nova memória
   */
  async store(memory: Omit<MemoryItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<MemoryItem> {
    try {
      const now = new Date()
      const expiresAt = memory.ttl ? new Date(now.getTime() + memory.ttl * 1000) : undefined

      const [storedMemory] = await db
        .insert(agentMemories)
        .values({
          userId: memory.userId,
          conversationId: memory.conversationId,
          category: memory.category,
          memoryKey: memory.key,
          memoryValue: memory.value,
          importanceScore: memory.importance,
          ttlSeconds: memory.ttl,
          createdAt: now,
          updatedAt: now,
          expiresAt
        })
        .returning()

      // Criar embedding para busca semântica se for texto
      if (typeof memory.value === 'string' && memory.value.length > 10) {
        await this.createEmbedding(storedMemory.id, memory.value)
      }

      return this.mapDbToMemoryItem(storedMemory)
    } catch (error) {
      console.error('❌ Erro ao armazenar memória:', error)
      throw new Error('Falha ao armazenar memória')
    }
  }

  /**
   * Recupera memórias baseado em query
   */
  async retrieve(query: MemoryQuery): Promise<MemoryItem[]> {
    try {
      const conditions = [eq(agentMemories.userId, query.userId)]

      if (query.conversationId) {
        conditions.push(eq(agentMemories.conversationId, query.conversationId))
      }

      if (query.category) {
        conditions.push(eq(agentMemories.category, query.category))
      }

      if (query.key) {
        conditions.push(ilike(agentMemories.memoryKey, `%${query.key}%`))
      }

      if (query.importanceThreshold) {
        conditions.push(gte(agentMemories.importanceScore, query.importanceThreshold))
      }

      // Filtrar memórias expiradas
      conditions.push(sql`(expires_at IS NULL OR expires_at > NOW())`)

      const results = await db.select().from(agentMemories)
        .where(and(...conditions))
        .orderBy(desc(agentMemories.importanceScore), desc(agentMemories.createdAt))
        .limit(query.limit || 50)
        .offset(query.offset || 0)

      return results.map(this.mapDbToMemoryItem)
    } catch (error) {
      console.error('❌ Erro ao recuperar memórias:', error)
      throw new Error('Falha ao recuperar memórias')
    }
  }

  /**
   * Atualiza uma memória existente
   */
  async update(id: string, updates: Partial<MemoryItem>): Promise<MemoryItem> {
    try {
      const now = new Date()
      const updateData: any = {
        updatedAt: now
      }

      if (updates.value !== undefined) {
        updateData.memoryValue = updates.value
      }
      if (updates.importance !== undefined) {
        updateData.importanceScore = updates.importance
      }
      if (updates.ttl !== undefined) {
        updateData.ttlSeconds = updates.ttl
        updateData.expiresAt = updates.ttl ? new Date(now.getTime() + updates.ttl * 1000) : null
      }

      const [updatedMemory] = await db
        .update(agentMemories)
        .set(updateData)
        .where(eq(agentMemories.id, id))
        .returning()

      if (!updatedMemory) {
        throw new Error('Memória não encontrada')
      }

      return this.mapDbToMemoryItem(updatedMemory)
    } catch (error) {
      console.error('❌ Erro ao atualizar memória:', error)
      throw new Error('Falha ao atualizar memória')
    }
  }

  /**
   * Remove uma memória
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(agentMemories)
        .where(eq(agentMemories.id, id))
        .returning({ id: agentMemories.id })

      return result.length > 0
    } catch (error) {
      console.error('❌ Erro ao deletar memória:', error)
      return false
    }
  }

  /**
   * Obtém contexto da conversa
   */
  async getConversationContext(conversationId: string): Promise<ConversationContext | null> {
    try {
      const [context] = await db
        .select()
        .from(conversationContexts)
        .where(eq(conversationContexts.conversationId, conversationId))
        .limit(1)

      if (!context) return null

      return {
        conversationId: context.conversationId,
        userId: context.userId,
        contextData: (context.contextData as unknown) as Record<string, any>,
        messageCount: context.messageCount,
        lastActivity: context.lastActivity,
        createdAt: context.createdAt
      }
    } catch (error) {
      console.error('❌ Erro ao obter contexto da conversa:', error)
      return null
    }
  }

  /**
   * Atualiza contexto da conversa
   */
  async updateConversationContext(conversationId: string, context: Partial<ConversationContext>): Promise<ConversationContext> {
    try {
      const now = new Date()
      
      // Tentar atualizar primeiro
      const [updated] = await db
        .update(conversationContexts)
        .set({
          contextData: (context.contextData as Record<string, any>) || {},
          messageCount: context.messageCount || 0,
          lastActivity: now
        })
        .where(eq(conversationContexts.conversationId, conversationId))
        .returning()

      if (updated) {
        return {
          conversationId: updated.conversationId,
          userId: updated.userId,
          contextData: (updated.contextData as unknown) as Record<string, any>,
          messageCount: updated.messageCount,
          lastActivity: updated.lastActivity,
          createdAt: updated.createdAt
        }
      }

      // Se não existir, criar novo
      const [created] = await db
        .insert(conversationContexts)
        .values({
          conversationId,
          userId: context.userId || 'unknown',
          contextData: (context.contextData as Record<string, any>) || {},
          messageCount: context.messageCount || 0,
          lastActivity: now,
          createdAt: now
        })
        .returning()

      return {
        conversationId: created.conversationId,
        userId: created.userId,
        contextData: (created.contextData as unknown) as Record<string, any>,
        messageCount: created.messageCount,
        lastActivity: created.lastActivity,
        createdAt: created.createdAt
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar contexto da conversa:', error)
      throw new Error('Falha ao atualizar contexto da conversa')
    }
  }

  /**
   * Obtém perfil do usuário
   */
  async getUserProfile(userId: string): Promise<UserMemoryProfile | null> {
    try {
      const [profile] = await db
        .select()
        .from(userMemoryProfiles)
        .where(eq(userMemoryProfiles.userId, userId))
        .limit(1)

      if (!profile) return null

      return {
        userId: profile.userId,
        profileData: (profile.profileData as unknown) as Record<string, any>,
        preferences: (profile.preferences as unknown) as Record<string, any>,
        businessContext: (profile.businessContext as unknown) as Record<string, any>,
        lastUpdated: profile.lastUpdated,
        createdAt: profile.createdAt
      }
    } catch (error) {
      console.error('❌ Erro ao obter perfil do usuário:', error)
      return null
    }
  }

  /**
   * Atualiza perfil do usuário
   */
  async updateUserProfile(userId: string, profile: Partial<UserMemoryProfile>): Promise<UserMemoryProfile> {
    try {
      const now = new Date()
      
      // Tentar atualizar primeiro
      const [updated] = await db
        .update(userMemoryProfiles)
        .set({
          profileData: (profile.profileData as Record<string, any>) || {},
          preferences: (profile.preferences as Record<string, any>) || {},
          businessContext: (profile.businessContext as Record<string, any>) || {},
          lastUpdated: now
        })
        .where(eq(userMemoryProfiles.userId, userId))
        .returning()

      if (updated) {
        return {
          userId: updated.userId,
          profileData: (updated.profileData as unknown) as Record<string, any>,
          preferences: (updated.preferences as unknown) as Record<string, any>,
          businessContext: (updated.businessContext as unknown) as Record<string, any>,
          lastUpdated: updated.lastUpdated,
          createdAt: updated.createdAt
        }
      }

      // Se não existir, criar novo
      const [created] = await db
        .insert(userMemoryProfiles)
        .values({
          userId,
          profileData: (profile.profileData as Record<string, any>) || {},
          preferences: (profile.preferences as Record<string, any>) || {},
          businessContext: (profile.businessContext as Record<string, any>) || {},
          lastUpdated: now,
          createdAt: now
        })
        .returning()

      return {
        userId: created.userId,
        profileData: {
          name: (created.profileData as any)?.name,
          company: (created.profileData as any)?.company,
          position: (created.profileData as any)?.position,
          industry: (created.profileData as any)?.industry,
          preferences: (created.profileData as any)?.preferences,
          businessContext: (created.profileData as any)?.businessContext
        },
        preferences: (created.preferences as unknown) as Record<string, any>,
        businessContext: (created.businessContext as unknown) as Record<string, any>,
        lastUpdated: created.lastUpdated,
        createdAt: created.createdAt
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil do usuário:', error)
      throw new Error('Falha ao atualizar perfil do usuário')
    }
  }

  /**
   * Busca semântica usando embeddings
   */
  async semanticSearch(query: string, userId: string, category?: MemoryCategory): Promise<MemorySearchResult[]> {
    try {
      // TODO: Implementar busca semântica com embeddings
      // Por enquanto, fazer busca textual simples
      const searchQuery: MemoryQuery = {
        userId,
        category,
        searchText: query,
        limit: 10
      }

      const memories = await this.retrieve(searchQuery)
      
      return memories.map(memory => ({
        memory,
        relevanceScore: 0.8, // Placeholder
        matchedFields: ['value']
      }))
    } catch (error) {
      console.error('❌ Erro na busca semântica:', error)
      return []
    }
  }

  /**
   * Limpa memórias expiradas
   */
  async cleanupExpiredMemories(): Promise<number> {
    try {
      const result = await db
        .delete(agentMemories)
        .where(sql`expires_at IS NOT NULL AND expires_at < NOW()`)
        .returning({ id: agentMemories.id })

      return result.length
    } catch (error) {
      console.error('❌ Erro ao limpar memórias expiradas:', error)
      return 0
    }
  }

  /**
   * Obtém estatísticas de memória do usuário
   */
  async getMemoryStats(userId: string): Promise<Record<string, any>> {
    try {
      const memories = await db
        .select()
        .from(agentMemories)
        .where(eq(agentMemories.userId, userId))

      const stats = {
        totalMemories: memories.length,
        byCategory: {} as Record<string, number>,
        byImportance: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        },
        oldestMemory: null as Date | null,
        newestMemory: null as Date | null
      }

      memories.forEach(memory => {
        // Contar por categoria
        stats.byCategory[memory.category] = (stats.byCategory[memory.category] || 0) + 1

        // Contar por importância
        if (memory.importanceScore <= 0.3) stats.byImportance.low++
        else if (memory.importanceScore <= 0.6) stats.byImportance.medium++
        else if (memory.importanceScore <= 0.8) stats.byImportance.high++
        else stats.byImportance.critical++

        // Datas
        if (!stats.oldestMemory || memory.createdAt < stats.oldestMemory) {
          stats.oldestMemory = memory.createdAt
        }
        if (!stats.newestMemory || memory.createdAt > stats.newestMemory) {
          stats.newestMemory = memory.createdAt
        }
      })

      return stats
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error)
      return {}
    }
  }

  /**
   * Cria embedding para busca semântica
   */
  private async createEmbedding(memoryId: string, content: string): Promise<void> {
    try {
      // TODO: Implementar criação de embeddings com OpenAI
      // Por enquanto, apenas armazenar o texto
      await db.insert(memoryEmbeddings).values({
        memoryId,
        contentText: content,
        embedding: null // Será preenchido quando implementarmos embeddings
      })
    } catch (error) {
      console.error('❌ Erro ao criar embedding:', error)
    }
  }

  /**
   * Mapeia resultado do banco para MemoryItem
   */
  private mapDbToMemoryItem(dbResult: any): MemoryItem {
    return {
      id: dbResult.id,
      userId: dbResult.userId,
      conversationId: dbResult.conversationId,
      category: dbResult.category as MemoryCategory,
      key: dbResult.memoryKey,
      value: dbResult.memoryValue,
      importance: dbResult.importanceScore,
      ttl: dbResult.ttlSeconds,
      createdAt: dbResult.createdAt,
      updatedAt: dbResult.updatedAt,
      expiresAt: dbResult.expiresAt
    }
  }
}

// Exportar instância singleton
export const memoryManager = new FalachefeMemoryManager()
