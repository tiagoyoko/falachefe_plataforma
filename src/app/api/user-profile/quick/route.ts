import { NextRequest, NextResponse } from 'next/server'
import { userProfileTool } from '@/agents/core/user-profile-tool'

/**
 * GET /api/user-profile/quick - Consulta rápida de informações específicas do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // personal, business, preferences, summary

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    console.log(`⚡ Consulta rápida de perfil: ${type} para usuário: ${userId}`)

    let result

    switch (type) {
      case 'personal':
        result = await userProfileTool.getPersonalInfo(userId)
        break

      case 'business':
        result = await userProfileTool.getBusinessContext(userId)
        break

      case 'preferences':
        result = await userProfileTool.getPreferences(userId)
        break

      case 'summary':
        result = await userProfileTool.getProfileSummary(userId)
        break

      case 'communication':
        result = await userProfileTool.getCommunicationPreferences(userId)
        break

      default:
        return NextResponse.json(
          { error: 'Tipo não reconhecido. Use: personal, business, preferences, summary ou communication' },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      type,
      data: result.data,
      summary: result.summary
    })

  } catch (error) {
    console.error('❌ Erro na consulta rápida:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

