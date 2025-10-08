import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { financialData } from '@/lib/schema'
import { auth } from '@/lib/auth/auth'
import { eq, and, between, sql } from 'drizzle-orm'

/**
 * GET /api/financial/transactions
 * Lista transações financeiras com filtros opcionais
 * 
 * LGPD Compliance:
 * - Requer autenticação via session
 * - Valida que o usuário só acessa seus próprios dados
 * - Registra acesso para audit trail
 */
export async function GET(request: NextRequest) {
  try {
    // LGPD: Validar autenticação
    const session = await auth.api.getSession({
      headers: request.headers
    })
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          error: 'Não autorizado',
          message: 'É necessário estar autenticado para acessar dados financeiros'
        },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') // 'entrada' ou 'saida'
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '100')

    // LGPD: userId é OBRIGATÓRIO
    if (!userId) {
      return NextResponse.json(
        { 
          error: 'userId é obrigatório',
          message: 'Para compliance com LGPD, é obrigatório informar o userId'
        },
        { status: 400 }
      )
    }

    // LGPD: Validar que o usuário só acessa seus próprios dados
    // Exceção: super_admin pode acessar dados de outros usuários
    const isAdmin = session.user.role === 'super_admin' || session.user.role === 'admin'
    
    if (!isAdmin && session.user.id !== userId) {
      console.warn(`⚠️ LGPD: Tentativa de acesso não autorizado - User ${session.user.id} tentou acessar dados de ${userId}`)
      return NextResponse.json(
        { 
          error: 'Acesso negado',
          message: 'Você não tem permissão para acessar dados financeiros de outro usuário'
        },
        { status: 403 }
      )
    }

    // LGPD: Log de acesso para audit trail
    console.log(`📊 LGPD Audit: User ${session.user.id} acessou transações de ${userId} em ${new Date().toISOString()}`)

    // Construir query com filtros
    const conditions = [eq(financialData.userId, userId)]
    
    if (type) {
      conditions.push(eq(financialData.type, type))
    }
    
    if (category) {
      conditions.push(eq(financialData.category, category))
    }
    
    if (startDate && endDate) {
      conditions.push(
        between(
          financialData.date,
          new Date(startDate),
          new Date(endDate)
        )
      )
    }

    const transactions = await db
      .select()
      .from(financialData)
      .where(and(...conditions))
      .limit(limit)
      .orderBy(sql`${financialData.date} DESC`)

    // Calcular totais
    const entradas = transactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const saidas = transactions
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + t.amount, 0)

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions.map(t => ({
          ...t,
          // Converter de centavos para reais
          amountInReais: t.amount / 100
        })),
        summary: {
          total: transactions.length,
          entradas: entradas / 100, // Converter para reais
          saidas: saidas / 100,
          saldo: (entradas - saidas) / 100
        }
      }
    })

  } catch (error) {
    console.error('❌ Erro ao listar transações:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

/**
 * POST /api/financial/transactions
 * Cria uma nova transação financeira
 * 
 * LGPD Compliance:
 * - Requer autenticação via session
 * - Valida que o usuário só cria transações para si mesmo
 * - Registra criação para audit trail
 * - Armazena metadata de origem para rastreabilidade
 */
export async function POST(request: NextRequest) {
  try {
    // LGPD: Validar autenticação
    const session = await auth.api.getSession({
      headers: request.headers
    })
    
    if (!session?.user) {
      return NextResponse.json(
        { 
          error: 'Não autorizado',
          message: 'É necessário estar autenticado para criar transações financeiras'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, type, amount, description, category, date, metadata = {} } = body

    // LGPD: userId é OBRIGATÓRIO
    if (!userId || !type || !amount || !description || !category) {
      return NextResponse.json(
        { 
          error: 'Campos obrigatórios: userId, type, amount, description, category',
          message: 'Para compliance com LGPD, todos os campos são obrigatórios',
          received: { userId, type, amount, description, category }
        },
        { status: 400 }
      )
    }

    // LGPD: Validar que o usuário só cria transações para si mesmo
    // Exceção: super_admin pode criar para outros usuários (ex: migração de dados)
    const isAdmin = session.user.role === 'super_admin' || session.user.role === 'admin'
    
    if (!isAdmin && session.user.id !== userId) {
      console.warn(`⚠️ LGPD: Tentativa de criação não autorizada - User ${session.user.id} tentou criar transação para ${userId}`)
      return NextResponse.json(
        { 
          error: 'Acesso negado',
          message: 'Você não tem permissão para criar transações financeiras para outro usuário'
        },
        { status: 403 }
      )
    }

    // LGPD: Log de criação para audit trail
    console.log(`📝 LGPD Audit: User ${session.user.id} criou transação para ${userId} em ${new Date().toISOString()}`)

    if (!['entrada', 'saida'].includes(type)) {
      return NextResponse.json(
        { error: 'type deve ser "entrada" ou "saida"' },
        { status: 400 }
      )
    }

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { error: 'amount deve ser um número positivo' },
        { status: 400 }
      )
    }

    // Converter valor de reais para centavos
    const amountInCents = Math.round(amount * 100)

    // LGPD: Adicionar metadata de audit trail
    const auditMetadata = {
      ...metadata,
      createdBy: session.user.id,
      createdByEmail: session.user.email,
      createdAt: new Date().toISOString(),
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    }

    // Criar transação no banco
    const [transaction] = await db
      .insert(financialData)
      .values({
        userId,
        type,
        amount: amountInCents,
        description,
        category,
        date: date ? new Date(date) : new Date(),
        metadata: auditMetadata
      })
      .returning()

    console.log(`✅ Transação criada: ${transaction.id}`)

    return NextResponse.json({
      success: true,
      data: {
        ...transaction,
        amountInReais: transaction.amount / 100
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Erro ao criar transação:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

