import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getFullUser, isSuperAdmin } from '@/lib/auth-utils'
import { FinancialAgentDirect } from '@/agents/financial/financial-agent-direct'

export async function GET(request: NextRequest) {
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

    // Usar agente financeiro direto por enquanto
    const financialAgent = new FinancialAgentDirect()
    await financialAgent.initialize({})

    const agents = [{
      id: financialAgent.agentId,
      type: financialAgent.agentType,
      name: financialAgent.agentName,
      description: financialAgent.agentDescription,
      capabilities: financialAgent.agentSpecializations,
      status: 'active' as const
    }]

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