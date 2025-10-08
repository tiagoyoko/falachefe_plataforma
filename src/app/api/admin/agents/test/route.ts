import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/auth'
import { getFullUser, isSuperAdmin } from '@/lib/auth/auth-utils'
import { FinancialAgentDirect } from '@/agents/financial/financial-agent-direct'

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers
    })
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const fullUser = await getFullUser(session.user)
    
    if (!fullUser || !isSuperAdmin(fullUser.role)) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas super_admin pode acessar esta funcionalidade' },
        { status: 403 }
      )
    }

    const { agentType, message, context } = await request.json()

    if (!agentType || !message) {
      return NextResponse.json(
        { error: 'Tipo de agente e mensagem são obrigatórios' },
        { status: 400 }
      )
    }

    // Por enquanto, só suportamos o agente financeiro
    if (agentType !== 'financial') {
      return NextResponse.json(
        {
          error: `Agente do tipo '${agentType}' não disponível no modo direto`,
          availableTypes: ['financial']
        },
        { status: 404 }
      )
    }

    const startTime = Date.now()

    try {
      // Usar agente financeiro direto
      const financialAgent = new FinancialAgentDirect()
      await financialAgent.initialize({})

      const response = await financialAgent.process(message, {
        ...context,
        userId: fullUser.id,
        sessionId: `playground-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: 'playground'
      })

      const duration = Date.now() - startTime

      return NextResponse.json({
        success: true,
        agent: {
          id: financialAgent.agentId,
          type: financialAgent.agentType,
          name: financialAgent.agentName
        },
        request: {
          message,
          context
        },
        response,
        metrics: {
          duration,
          timestamp: new Date().toISOString()
        }
      })
    } catch (agentError) {
      console.error(`Erro ao executar agente ${agentType}:`, agentError)

      return NextResponse.json({
        success: false,
        error: agentError instanceof Error ? agentError.message : 'Erro desconhecido',
        agent: {
          id: 'financial-agent-direct',
          type: 'financial',
          name: 'Financial Agent (Direct)'
        },
        request: {
          message,
          context
        },
        metrics: {
          duration: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Erro na API de teste de agentes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}