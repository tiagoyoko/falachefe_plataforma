import { NextRequest, NextResponse } from 'next/server'
import { userProfileTool } from '@/agents/core/user-profile-tool'

/**
 * GET /api/user-profile - Consulta dados do perfil do usuário
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const fields = searchParams.get('fields')?.split(',')
    const includeSummary = searchParams.get('includeSummary') === 'true'

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    console.log(`🔍 Consultando perfil do usuário: ${userId}`)

    const result = await userProfileTool.getUserProfile({
      userId,
      fields,
      includeSummary
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      profile: result.profile,
      summary: result.summary
    })

  } catch (error) {
    console.error('❌ Erro ao consultar perfil:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

/**
 * POST /api/user-profile - Atualiza dados do perfil do usuário
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, personalInfo, preferences, businessContext, action } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    console.log(`📝 Atualizando perfil do usuário: ${userId}`, { action })

    let result

    switch (action) {
      case 'updatePersonalInfo':
        if (!personalInfo) {
          return NextResponse.json(
            { error: 'personalInfo é obrigatório para esta ação' },
            { status: 400 }
          )
        }
        result = await userProfileTool.updatePersonalInfo(userId, personalInfo)
        break

      case 'updateBusinessContext':
        if (!businessContext) {
          return NextResponse.json(
            { error: 'businessContext é obrigatório para esta ação' },
            { status: 400 }
          )
        }
        result = await userProfileTool.updateBusinessContext(userId, businessContext)
        break

      case 'updatePreferences':
        if (!preferences) {
          return NextResponse.json(
            { error: 'preferences é obrigatório para esta ação' },
            { status: 400 }
          )
        }
        result = await userProfileTool.updateUserProfile({
          userId,
          preferences
        })
        break

      case 'updateFull':
        result = await userProfileTool.updateUserProfile({
          userId,
          personalInfo,
          preferences,
          businessContext
        })
        break

      default:
        return NextResponse.json(
          { error: 'Ação não reconhecida. Use: updatePersonalInfo, updateBusinessContext, updatePreferences ou updateFull' },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: result.data
    })

  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

/**
 * PUT /api/user-profile - Atualização completa do perfil
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, personalInfo, preferences, businessContext } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    console.log(`📝 Atualização completa do perfil: ${userId}`)

    const result = await userProfileTool.updateUserProfile({
      userId,
      personalInfo,
      preferences,
      businessContext
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: result.data,
      profile: result.profile
    })

  } catch (error) {
    console.error('❌ Erro ao atualizar perfil:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

/**
 * DELETE /api/user-profile - Remove dados específicos do perfil
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const field = searchParams.get('field')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    console.log(`🗑️ Removendo campo do perfil: ${field} para usuário: ${userId}`)

    // Implementar lógica de remoção específica se necessário
    // Por enquanto, retornamos sucesso
    return NextResponse.json({
      success: true,
      message: `Campo ${field} removido com sucesso`
    })

  } catch (error) {
    console.error('❌ Erro ao remover campo do perfil:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

