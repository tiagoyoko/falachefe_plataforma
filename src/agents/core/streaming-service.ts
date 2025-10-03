/**
 * Streaming Service - Real-time communication for Agent Squad
 * Based on AWS Labs Agent Squad Framework
 */

import { EventEmitter } from 'events'

export interface StreamingMessage {
  id: string
  conversationId: string
  agentId: string
  type: 'message' | 'status' | 'error' | 'typing'
  content: string
  metadata?: Record<string, any>
  timestamp: Date
}

export interface StreamingConfig {
  maxConnections: number
  heartbeatInterval: number
  connectionTimeout: number
  enableSSE: boolean
  enableWebSocket: boolean
}

export interface ConnectionInfo {
  id: string
  conversationId: string
  userId: string
  connectedAt: Date
  lastActivity: Date
  isActive: boolean
}

export class StreamingService extends EventEmitter {
  private connections: Map<string, ConnectionInfo> = new Map()
  private config: StreamingConfig
  private heartbeatInterval?: NodeJS.Timeout

  constructor(config: StreamingConfig) {
    super()
    this.config = config
    this.startHeartbeat()
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.cleanupInactiveConnections()
    }, this.config.heartbeatInterval)
  }

  private cleanupInactiveConnections(): void {
    const now = new Date()
    const timeout = this.config.connectionTimeout

    for (const [connectionId, connection] of this.connections) {
      const timeSinceLastActivity = now.getTime() - connection.lastActivity.getTime()
      
      if (timeSinceLastActivity > timeout) {
        this.disconnect(connectionId)
      }
    }
  }

  public connect(connectionId: string, conversationId: string, userId: string): void {
    const connection: ConnectionInfo = {
      id: connectionId,
      conversationId,
      userId,
      connectedAt: new Date(),
      lastActivity: new Date(),
      isActive: true
    }

    this.connections.set(connectionId, connection)
    this.emit('connection', connection)
  }

  public disconnect(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.isActive = false
      this.connections.delete(connectionId)
      this.emit('disconnection', connection)
    }
  }

  public isConnected(connectionId: string): boolean {
    const connection = this.connections.get(connectionId)
    return connection ? connection.isActive : false
  }

  public getConnection(connectionId: string): ConnectionInfo | undefined {
    return this.connections.get(connectionId)
  }

  public getConnectionsByConversation(conversationId: string): ConnectionInfo[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.conversationId === conversationId && conn.isActive
    )
  }

  public getConnectionsByUser(userId: string): ConnectionInfo[] {
    return Array.from(this.connections.values()).filter(
      conn => conn.userId === userId && conn.isActive
    )
  }

  public updateActivity(connectionId: string): void {
    const connection = this.connections.get(connectionId)
    if (connection) {
      connection.lastActivity = new Date()
    }
  }

  public sendMessage(
    connectionId: string,
    message: Omit<StreamingMessage, 'id' | 'timestamp'>
  ): boolean {
    if (!this.isConnected(connectionId)) {
      return false
    }

    const streamingMessage: StreamingMessage = {
      ...message,
      id: this.generateMessageId(),
      timestamp: new Date()
    }

    this.emit('message', connectionId, streamingMessage)
    this.updateActivity(connectionId)
    return true
  }

  public broadcastToConversation(
    conversationId: string,
    message: Omit<StreamingMessage, 'id' | 'timestamp' | 'conversationId'>
  ): number {
    const connections = this.getConnectionsByConversation(conversationId)
    let sentCount = 0

    for (const connection of connections) {
      if (this.sendMessage(connection.id, {
        ...message,
        conversationId
      })) {
        sentCount++
      }
    }

    return sentCount
  }

  public broadcastToUser(
    userId: string,
    message: Omit<StreamingMessage, 'id' | 'timestamp'>
  ): number {
    const connections = this.getConnectionsByUser(userId)
    let sentCount = 0

    for (const connection of connections) {
      if (this.sendMessage(connection.id, message)) {
        sentCount++
      }
    }

    return sentCount
  }

  public sendTypingIndicator(
    connectionId: string,
    agentId: string,
    isTyping: boolean = true
  ): boolean {
    return this.sendMessage(connectionId, {
      conversationId: '',
      agentId,
      type: 'typing',
      content: isTyping ? 'typing...' : '',
      metadata: { isTyping }
    })
  }

  public sendStatusUpdate(
    connectionId: string,
    agentId: string,
    status: string,
    metadata?: Record<string, any>
  ): boolean {
    return this.sendMessage(connectionId, {
      conversationId: '',
      agentId,
      type: 'status',
      content: status,
      metadata
    })
  }

  public sendError(
    connectionId: string,
    agentId: string,
    error: string,
    metadata?: Record<string, any>
  ): boolean {
    return this.sendMessage(connectionId, {
      conversationId: '',
      agentId,
      type: 'error',
      content: error,
      metadata
    })
  }

  public getStats(): Record<string, any> {
    const now = new Date()
    const activeConnections = Array.from(this.connections.values()).filter(
      conn => conn.isActive
    )

    return {
      totalConnections: this.connections.size,
      activeConnections: activeConnections.length,
      connectionsByConversation: this.groupConnectionsByConversation(),
      averageConnectionTime: this.calculateAverageConnectionTime(activeConnections, now),
      maxConnections: this.config.maxConnections,
      isHealthy: activeConnections.length <= this.config.maxConnections
    }
  }

  private groupConnectionsByConversation(): Record<string, number> {
    const groups: Record<string, number> = {}
    
    for (const connection of this.connections.values()) {
      if (connection.isActive) {
        groups[connection.conversationId] = (groups[connection.conversationId] || 0) + 1
      }
    }

    return groups
  }

  private calculateAverageConnectionTime(
    connections: ConnectionInfo[],
    now: Date
  ): number {
    if (connections.length === 0) return 0

    const totalTime = connections.reduce((sum, conn) => {
      return sum + (now.getTime() - conn.connectedAt.getTime())
    }, 0)

    return totalTime / connections.length
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
    }
    
    this.connections.clear()
    this.removeAllListeners()
  }

  public async initialize(): Promise<void> {
    this.startHeartbeat()
  }

  public async shutdown(): Promise<void> {
    this.destroy()
  }

}

export default StreamingService
