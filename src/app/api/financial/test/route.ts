import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase-server'

/**
 * POST /api/financial/test
 * Rota de TESTE sem autenticação para validar integração CrewAI
 * ⚠️ REMOVER EM PRODUÇÃO - Usa Supabase REST API
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, amount, description, category, date, metadata = {} } = body

    // Validações
    if (!userId || !type || !amount || !description || !category) {
      return NextResponse.json(
        { 
          error: 'Campos obrigatórios: userId, type, amount, description, category',
          received: { userId, type, amount, description, category }
        },
        { status: 400 }
      )
    }

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

    // Adicionar metadata de teste
    const testMetadata = {
      ...metadata,
      testMode: true,
      source: 'crewai-test',
      createdAt: new Date().toISOString()
    }

    // Criar transação no banco via Supabase REST API
    const { data: transaction, error } = await supabase
      .from('financial_data')
      .insert({
        user_id: userId,
        type,
        amount: amountInCents,
        description,
        category,
        date: date || new Date().toISOString(),
        metadata: testMetadata
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Erro Supabase:', error)
      return NextResponse.json({
        error: 'Erro ao criar transação',
        details: error.message
      }, { status: 500 })
    }

    console.log(`✅ [TEST] Transação criada: ${transaction.id}`)

    return NextResponse.json({
      success: true,
      message: 'Transação criada com sucesso (modo teste)',
      data: {
        ...transaction,
        amountInReais: transaction.amount / 100
      }
    }, { status: 201 })

  } catch (error) {
    console.error('❌ Erro ao criar transação (teste):', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

/**
 * GET /api/financial/test
 * Lista transações de teste via Supabase REST API
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar transações via Supabase REST API
    const { data: transactions, error } = await supabase
      .from('financial_data')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(100)

    if (error) {
      console.error('❌ Erro Supabase:', error)
      return NextResponse.json({
        error: 'Erro ao buscar transações',
        details: error.message
      }, { status: 500 })
    }

    // Calcular totais
    const entradas = transactions
      .filter(t => t.type === 'entrada')
      .reduce((sum, t) => sum + (t.amount || 0), 0)
    
    const saidas = transactions
      .filter(t => t.type === 'saida')
      .reduce((sum, t) => sum + (t.amount || 0), 0)

    console.log(`✅ [TEST] ${transactions.length} transações recuperadas para ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Dados recuperados com sucesso (modo teste)',
      data: {
        transactions: transactions.map(t => ({
          ...t,
          amountInReais: (t.amount || 0) / 100
        })),
        summary: {
          total: transactions.length,
          entradas: entradas / 100,
          saidas: saidas / 100,
          saldo: (entradas - saidas) / 100
        }
      }
    })

  } catch (error) {
    console.error('❌ Erro ao listar transações (teste):', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}

