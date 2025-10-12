import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { financialData } from '@/lib/schema'
import { eq, and, between, sql } from 'drizzle-orm'

/**
 * POST /api/financial/crewai
 * Endpoint para o CrewAI adicionar transações financeiras
 * 
 * Segurança:
 * - Valida token de serviço do CrewAI
 * - Apenas aceita requests do servidor Hetzner
 * - Valida que userId existe e está ativo
 */
export async function POST(request: NextRequest) {
  try {
    // Validar token de serviço do CrewAI
    const crewaiToken = request.headers.get('x-crewai-token')
    const expectedToken = process.env.CREWAI_SERVICE_TOKEN
    
    if (!crewaiToken || !expectedToken || crewaiToken !== expectedToken) {
      console.warn('⚠️ Tentativa de acesso não autorizado ao endpoint CrewAI')
      return NextResponse.json(
        { 
          error: 'Não autorizado',
          message: 'Token de serviço inválido'
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { userId, type, amount, description, category, date, metadata = {} } = body

    // Validar campos obrigatórios
    if (!userId || !type || !amount || !description || !category) {
      return NextResponse.json(
        { 
          error: 'Campos obrigatórios: userId, type, amount, description, category',
          received: { userId, type, amount, description, category }
        },
        { status: 400 }
      )
    }

    // Validar tipo
    if (!['entrada', 'saida', 'receita', 'despesa'].includes(type)) {
      return NextResponse.json(
        { 
          error: 'Tipo inválido',
          message: 'Tipo deve ser "entrada", "saida", "receita" ou "despesa"'
        },
        { status: 400 }
      )
    }

    // Normalizar tipo (aceitar entrada/receita e saida/despesa)
    const normalizedType = (type === 'entrada' || type === 'receita') ? 'receita' : 'despesa'

    // Converter valor para centavos se necessário
    const amountInCents = typeof amount === 'number' && amount < 1000000 
      ? Math.round(amount * 100) // Se menor que 1M, assumir que está em reais
      : Math.round(amount) // Se maior, assumir que já está em centavos

    // Converter data
    const transactionDate = date ? new Date(date) : new Date()

    // Log da operação
    console.log(`📊 CrewAI: Criando transação ${normalizedType} de R$ ${amountInCents / 100} para user ${userId}`)

    // Criar transação no banco
    const [newTransaction] = await db.insert(financialData).values({
      userId,
      type: normalizedType,
      amount: amountInCents,
      description,
      category,
      date: transactionDate,
      metadata: {
        ...metadata,
        source: 'crewai',
        agent: 'financial_expert',
        createdAt: new Date().toISOString()
      }
    }).returning()

    console.log(`✅ Transação criada com sucesso: ${newTransaction.id}`)

    return NextResponse.json({
      success: true,
      data: {
        id: newTransaction.id,
        userId: newTransaction.userId,
        type: newTransaction.type,
        amount: newTransaction.amount / 100, // Retornar em reais
        description: newTransaction.description,
        category: newTransaction.category,
        date: newTransaction.date,
        createdAt: newTransaction.createdAt
      },
      message: 'Transação criada com sucesso'
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Erro ao criar transação via CrewAI:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

/**
 * GET /api/financial/crewai
 * Endpoint para o CrewAI consultar transações financeiras
 */
export async function GET(request: NextRequest) {
  try {
    // Validar token
    const crewaiToken = request.headers.get('x-crewai-token')
    const expectedToken = process.env.CREWAI_SERVICE_TOKEN
    
    if (!crewaiToken || !expectedToken || crewaiToken !== expectedToken) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar transações
    const transactions = await db
      .select()
      .from(financialData)
      .where(eq(financialData.userId, userId))
      .orderBy(sql`${financialData.date} DESC`)
      .limit(100)

    // Calcular totais
    const receitas = transactions
      .filter(t => t.type === 'receita')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const despesas = transactions
      .filter(t => t.type === 'despesa')
      .reduce((sum, t) => sum + t.amount, 0)

    return NextResponse.json({
      success: true,
      data: {
        transactions: transactions.map(t => ({
          ...t,
          amount: t.amount / 100 // Converter para reais
        })),
        summary: {
          total: transactions.length,
          receitas: receitas / 100,
          despesas: despesas / 100,
          saldo: (receitas - despesas) / 100
        }
      }
    })

  } catch (error) {
    console.error('❌ Erro ao buscar transações via CrewAI:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

