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

export async function GET(request: NextRequest) {
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
        { error: 'Acesso negado. Apenas super_admin pode acessar esta funcionalidade' },
        { status: 403 }
      )
    }

    // Obter agentes disponíveis
    const squad = await getAgentSquad()
    const agentManager = squad.getAgentManager()
    const allAgents = agentManager.getAvailableAgents()

    const agents = allAgents.map((agent: any) => ({
      id: agent.id,
      type: agent.type,
      name: agent.metadata?.name || agent.type,
      description: agent.metadata?.description || `Agente do tipo ${agent.type}`,
      capabilities: agent.metadata?.specializations || [],
      status: agent.state === 'active' ? 'active' : 'inactive'
    }))

    return NextResponse.json({
      success: true,
      agents,
      total: agents.length
    })

  } catch (error) {
    console.error('Erro ao listar agentes:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
