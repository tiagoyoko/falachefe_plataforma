import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getFullUser, isSuperAdmin } from '@/lib/auth-utils'
import { FalachefeAgentSquad, defaultFalachefeConfig } from '@/agents/core/agent-squad-setup'

// Instância global do Agent Squad
let agentSquad: FalachefeAgentSquad | null = null

async function getAgentSquad(): Promise<FalachefeAgentSquad> {
  if (!agentSquad) {
    agentSquad = new FalachefeAgentSquad(defaultFalachefeConfig)
    await agentSquad.initialize()
  }
  return agentSquad
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: request.headers,
    })

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    // Verificar se é super_admin
    const fullUser = await getFullUser(session.user)
    if (!fullUser || !isSuperAdmin(fullUser.role)) {
      return NextResponse.json(
        { error: 'Acesso negado. Apenas super_admin pode executar testes de agentes' },
        { status: 403 }
      )
    }

    // Parse do body da requisição
    const body = await request.json()
    const { agentType, message, context = {} } = body

    if (!agentType || !message) {
      return NextResponse.json(
        { error: 'agentType e message são obrigatórios' },
        { status: 400 }
      )
    }

    // Obter o Agent Squad
    const squad = await getAgentSquad()
    const agentManager = squad.getAgentManager()

    // Buscar agente disponível do tipo especificado
    const availableAgent = await agentManager.getAvailableAgent(agentType)

    if (!availableAgent) {
      return NextResponse.json(
        { 
          error: `Nenhum agente disponível do tipo '${agentType}'`,
          availableTypes: Array.from(new Set(agentManager.getAvailableAgents().map((a: any) => a.type)))
        },
        { status: 404 }
      )
    }

    // Executar o agente
    const startTime = Date.now()
    
    try {
      const response = await availableAgent.process(message, {
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
          id: agentType, // Usar agentType como ID para consistência
          type: agentType,
          name: agentType // Usar agentType como nome
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
      const duration = Date.now() - startTime
      
      console.error(`Erro ao executar agente ${agentType}:`, agentError)
      
      return NextResponse.json({
        success: false,
        error: agentError instanceof Error ? agentError.message : 'Erro desconhecido',
        agent: {
          id: agentType,
          type: agentType,
          name: agentType
        },
        request: {
          message,
          context
        },
        metrics: {
          duration,
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
