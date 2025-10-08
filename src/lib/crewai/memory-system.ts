/**
 * Memory System - Individual and shared memory management
 * Based on AWS Labs Agent Squad Framework
 */

import { createClient, RedisClientType } from 'redis'
import { v4 as uuidv4 } from 'uuid'

export interface IndividualMemory {
  id: string
  conversationId: string
  agentType: string
  memoryData: Record<string, any>
  ttl: number
  createdAt: Date
  updatedAt: Date
}

export interface SharedMemory {
  id: string
  conversationId: string
  memoryData: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface MemoryConfig {
  redis: {
    host: string
    port: number
    password?: string
    db?: number
  }
  postgres: {
    connectionString: string
  }
  defaultTTL: number
  maxMemorySize: number
}

export class MemorySystem {
  private redis: RedisClientType
  private config: MemoryConfig
  public isConnected: boolean = false

  constructor(config: MemoryConfig) {
    this.config = config
    
    // Handle Upstash Redis URL format
    if (config.redis.host.startsWith('https://')) {
      // Upstash Redis format - convert HTTPS to REDISS
      const redisUrl = config.redis.host.replace('https://', 'rediss://')
      this.redis = createClient({
        url: redisUrl,
        password: config.redis.password,
        database: config.redis.db || 0
      })
    } else {
      // Standard Redis format
      this.redis = createClient({
        url: `redis://${config.redis.host}:${config.redis.port}`,
        password: config.redis.password,
        database: config.redis.db || 0
      })
    }
  }

  public async connect(): Promise<void> {
    try {
      await this.redis.connect()
      this.isConnected = true
      console.log('Memory System: Connected to Redis')
    } catch (error) {
      console.error('Memory System: Failed to connect to Redis:', error)
      throw error
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.redis.quit()
      this.isConnected = false
      console.log('Memory System: Disconnected from Redis')
    }
  }

  // Individual Memory Methods
  public async setIndividualMemory(
    conversationId: string,
    agentType: string,
    data: Record<string, any>,
    ttl?: number
  ): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Memory System: Not connected to Redis')
    }

    const memoryId = uuidv4()
    const memory: IndividualMemory = {
      id: memoryId,
      conversationId,
      agentType,
      memoryData: data,
      ttl: ttl || this.config.defaultTTL,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const key = `individual:${conversationId}:${agentType}:${memoryId}`
    await this.redis.setEx(key, memory.ttl, JSON.stringify(memory))
    
    return memoryId
  }

  public async getIndividualMemory(
    conversationId: string,
    agentType: string,
    memoryId?: string
  ): Promise<IndividualMemory[]> {
    if (!this.isConnected) {
      throw new Error('Memory System: Not connected to Redis')
    }

    const pattern = memoryId 
      ? `individual:${conversationId}:${agentType}:${memoryId}`
      : `individual:${conversationId}:${agentType}:*`

    const keys = await this.redis.keys(pattern)
    const memories: IndividualMemory[] = []

    for (const key of keys) {
      const data = await this.redis.get(key)
      if (data) {
        try {
          const memory = JSON.parse(data) as IndividualMemory
          memories.push(memory)
        } catch (error) {
          console.error(`Memory System: Failed to parse memory ${key}:`, error)
        }
      }
    }

    return memories.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  public async updateIndividualMemory(
    conversationId: string,
    agentType: string,
    memoryId: string,
    data: Record<string, any>
  ): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Memory System: Not connected to Redis')
    }

    const key = `individual:${conversationId}:${agentType}:${memoryId}`
    const existing = await this.redis.get(key)
    
    if (!existing) {
      return false
    }

    const memory = JSON.parse(existing) as IndividualMemory
    memory.memoryData = { ...memory.memoryData, ...data }
    memory.updatedAt = new Date()

    await this.redis.setEx(key, memory.ttl, JSON.stringify(memory))
    return true
  }

  public async deleteIndividualMemory(
    conversationId: string,
    agentType: string,
    memoryId: string
  ): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Memory System: Not connected to Redis')
    }

    const key = `individual:${conversationId}:${agentType}:${memoryId}`
    const result = await this.redis.del(key)
    return result > 0
  }

  // Shared Memory Methods
  public async setSharedMemory(
    conversationId: string,
    data: Record<string, any>
  ): Promise<string> {
    if (!this.isConnected) {
      throw new Error('Memory System: Not connected to Redis')
    }

    const memoryId = uuidv4()
    const memory: SharedMemory = {
      id: memoryId,
      conversationId,
      memoryData: data,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const key = `shared:${conversationId}:${memoryId}`
    await this.redis.setEx(key, this.config.defaultTTL, JSON.stringify(memory))
    
    return memoryId
  }

  public async getSharedMemory(
    conversationId: string,
    memoryId?: string
  ): Promise<SharedMemory[]> {
    if (!this.isConnected) {
      throw new Error('Memory System: Not connected to Redis')
    }

    const pattern = memoryId 
      ? `shared:${conversationId}:${memoryId}`
      : `shared:${conversationId}:*`

    const keys = await this.redis.keys(pattern)
    const memories: SharedMemory[] = []

    for (const key of keys) {
      const data = await this.redis.get(key)
      if (data) {
        try {
          const memory = JSON.parse(data) as SharedMemory
          memories.push(memory)
        } catch (error) {
          console.error(`Memory System: Failed to parse shared memory ${key}:`, error)
        }
      }
    }

    return memories.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
  }

  public async updateSharedMemory(
    conversationId: string,
    memoryId: string,
    data: Record<string, any>
  ): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Memory System: Not connected to Redis')
    }

    const key = `shared:${conversationId}:${memoryId}`
    const existing = await this.redis.get(key)
    
    if (!existing) {
      return false
    }

    const memory = JSON.parse(existing) as SharedMemory
    memory.memoryData = { ...memory.memoryData, ...data }
    memory.updatedAt = new Date()

    await this.redis.setEx(key, this.config.defaultTTL, JSON.stringify(memory))
    return true
  }

  public async deleteSharedMemory(
    conversationId: string,
    memoryId: string
  ): Promise<boolean> {
    if (!this.isConnected) {
      throw new Error('Memory System: Not connected to Redis')
    }

    const key = `shared:${conversationId}:${memoryId}`
    const result = await this.redis.del(key)
    return result > 0
  }

  // Utility Methods
  public async clearConversationMemory(conversationId: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Memory System: Not connected to Redis')
    }

    const individualPattern = `individual:${conversationId}:*`
    const sharedPattern = `shared:${conversationId}:*`

    const individualKeys = await this.redis.keys(individualPattern)
    const sharedKeys = await this.redis.keys(sharedPattern)

    const allKeys = [...individualKeys, ...sharedKeys]
    
    if (allKeys.length > 0) {
      await this.redis.del(allKeys)
    }
  }

  public async getMemoryStats(): Promise<Record<string, any>> {
    if (!this.isConnected) {
      throw new Error('Memory System: Not connected to Redis')
    }

    const individualKeys = await this.redis.keys('individual:*')
    const sharedKeys = await this.redis.keys('shared:*')

    return {
      totalMemories: individualKeys.length + sharedKeys.length,
      individualMemories: individualKeys.length,
      sharedMemories: sharedKeys.length,
      isConnected: this.isConnected
    }
  }

  public isHealthy(): boolean {
    return this.isConnected
  }

  public async initialize(): Promise<void> {
    await this.connect()
  }

  public async shutdown(): Promise<void> {
    await this.disconnect()
  }
}

export default MemorySystem
