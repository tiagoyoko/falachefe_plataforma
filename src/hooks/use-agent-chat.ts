import React, { useState, useCallback, useRef } from 'react'

export interface AgentMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: any
}

export interface AgentChatState {
  messages: AgentMessage[]
  isLoading: boolean
  error: string | null
  conversationId: string | null
}

export interface AgentChatActions {
  sendMessage: (message: string) => Promise<void>
  clearChat: () => void
  retryLastMessage: () => Promise<void>
}

export function useAgentChat(userId?: string): AgentChatState & AgentChatActions {
  const [messages, setMessages] = useState<AgentMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const lastMessageRef = useRef<string>('')

  // Gerar conversationId se não existir
  React.useEffect(() => {
    if (!conversationId) {
      setConversationId(`conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)
    }
  }, [conversationId])

  const sendMessage = useCallback(async (message: string) => {
    if (!message.trim() || isLoading) return

    const userMessage: AgentMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: message,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setError(null)
    lastMessageRef.current = message

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          conversationId,
          userId: userId || 'anonymous', // Garantir que sempre há um userId
          // Incluir informações do usuário para personalização
          includeUserProfile: true,
          // Forçar o agente a usar tools de consulta de perfil
          forceToolUse: true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao enviar mensagem')
      }

      const data = await response.json()
      console.log('📨 API Response:', data)

      const agentMessage: AgentMessage = {
        id: `agent-${Date.now()}`,
        role: 'assistant',
        content: data.content || data.response,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, agentMessage])
      console.log('🤖 Agent Message:', agentMessage)

    } catch (error) {
      console.error('❌ Error sending message:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
      
      // Adicionar mensagem de erro
      const errorMsg: AgentMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
        timestamp: new Date(),
        metadata: { isError: true }
      }
      
      setMessages(prev => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, conversationId, userId])

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
    setConversationId(null)
  }, [])

  const retryLastMessage = useCallback(async () => {
    if (lastMessageRef.current && !isLoading) {
      await sendMessage(lastMessageRef.current)
    }
  }, [sendMessage, isLoading])

  return {
    messages,
    isLoading,
    error,
    conversationId,
    sendMessage,
    clearChat,
    retryLastMessage
  }
}