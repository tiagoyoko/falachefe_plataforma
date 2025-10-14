import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sql } from 'drizzle-orm';

/**
 * POST /api/financial/crewai
 * Endpoint para CrewAI registrar transações do fluxo de caixa
 */
export async function POST(request: NextRequest) {
  try {
    // 1. VALIDAR AUTENTICAÇÃO
    const token = request.headers.get('x-crewai-token');
    const expectedToken = process.env.CREWAI_SERVICE_TOKEN;
    
    // DEBUG: Logs temporários
    console.log('🔍 [DEBUG] Token recebido:', token ? `${token.substring(0, 10)}...` : 'ausente');
    console.log('🔍 [DEBUG] Token esperado:', expectedToken ? `${expectedToken.substring(0, 10)}...` : 'NÃO DEFINIDO');
    console.log('🔍 [DEBUG] Tokens match:', token === expectedToken);
    
    if (!token || token !== expectedToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token de autenticação inválido ou ausente',
          debug: {
            hasToken: !!token,
            hasExpectedToken: !!expectedToken,
            tokenPrefix: token ? token.substring(0, 10) : null,
            expectedPrefix: expectedToken ? expectedToken.substring(0, 10) : null
          }
        },
        { status: 401 }
      );
    }

    // 2. PARSEAR E VALIDAR BODY
    const body = await request.json();
    
    const {
      userId,
      type,
      amount,
      description,
      category,
      date,
      metadata
    } = body;
    
    // Validações
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      );
    }
    
    if (!type || !['entrada', 'saida'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'type deve ser "entrada" ou "saida"' },
        { status: 400 }
      );
    }
    
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'amount deve ser número positivo' },
        { status: 400 }
      );
    }
    
    if (!category) {
      return NextResponse.json(
        { success: false, error: 'category é obrigatória' },
        { status: 400 }
      );
    }
    
    // Validar data
    const transactionDate = date || new Date().toISOString().split('T')[0];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(transactionDate)) {
      return NextResponse.json(
        { success: false, error: 'date deve estar no formato YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // 3. BUSCAR COMPANY_ID (opcional)
    let companyId = null;
    
    try {
      const subscriptions = await db.execute<{ company_id: string }>(
        sql`SELECT company_id 
            FROM user_subscriptions 
            WHERE user_id = ${userId} 
              AND status = 'active' 
            LIMIT 1`
      );
      
      if (subscriptions && subscriptions.length > 0) {
        companyId = subscriptions[0].company_id;
      }
    } catch (error) {
      console.warn('Não foi possível buscar company_id:', error);
    }

    // 4. INSERIR TRANSAÇÃO NO BANCO
    const result = await db.execute<{
      id: string;
      created_at: string;
    }>(
      sql`INSERT INTO cashflow_transactions (
            user_id,
            company_id,
            type,
            amount,
            description,
            category,
            date,
            metadata
          ) VALUES (
            ${userId},
            ${companyId},
            ${type},
            ${amount},
            ${description || `Transação de ${type}`},
            ${category},
            ${transactionDate},
            ${JSON.stringify(metadata || {})}::jsonb
          )
          RETURNING id, created_at`
    );

    const transaction = result[0];

    // 5. LOGAR OPERAÇÃO
    console.log('💰 Transação financeira registrada:', {
      transactionId: transaction.id,
      userId,
      companyId,
      type,
      amount,
      category,
      date: transactionDate,
      source: metadata?.source || 'crewai'
    });

    // 6. RETORNAR SUCESSO
    return NextResponse.json(
      {
        success: true,
        data: {
          id: transaction.id,
          userId,
          companyId,
          type,
          amount,
          description: description || `Transação de ${type}`,
          category,
          date: transactionDate,
          createdAt: transaction.created_at
        },
        message: 'Transação registrada com sucesso'
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('❌ Erro ao registrar transação:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro interno ao registrar transação',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/financial/crewai
 * Endpoint para CrewAI consultar saldo e transações do fluxo de caixa
 */
export async function GET(request: NextRequest) {
  try {
    // 1. VALIDAR AUTENTICAÇÃO
    const token = request.headers.get('x-crewai-token');
    const expectedToken = process.env.CREWAI_SERVICE_TOKEN;
    
    if (!token || token !== expectedToken) {
      return NextResponse.json(
        {
          success: false,
          error: 'Token de autenticação inválido ou ausente'
        },
        { status: 401 }
      );
    }

    // 2. EXTRAIR QUERY PARAMS
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate') || '1900-01-01';
    const endDate = searchParams.get('endDate') || '2099-12-31';

    // Validações
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'userId é obrigatório' },
        { status: 400 }
      );
    }

    // Validar formato das datas
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return NextResponse.json(
        { success: false, error: 'Datas devem estar no formato YYYY-MM-DD' },
        { status: 400 }
      );
    }

    console.log('🔍 Consultando transações:', {
      userId,
      startDate,
      endDate
    });

    // 3. CONSULTAR TRANSAÇÕES DO BANCO
    const transactions = await db.execute<{
      type: string;
      amount: string;
    }>(
      sql`SELECT type, amount 
          FROM cashflow_transactions 
          WHERE user_id = ${userId}
            AND date >= ${startDate}
            AND date <= ${endDate}
          ORDER BY date DESC`
    );

    console.log(`📊 Encontradas ${transactions.length} transações`);

    // 4. AGREGAR DADOS
    let entradas = 0;
    let saidas = 0;

    for (const transaction of transactions) {
      const amount = Number(transaction.amount);
      
      if (transaction.type === 'entrada') {
        entradas += amount;
      } else if (transaction.type === 'saida') {
        saidas += amount;
      }
    }

    const saldo = entradas - saidas;

    // 5. LOGAR RESUMO
    console.log('✅ Resumo calculado:', {
      userId,
      periodo: `${startDate} a ${endDate}`,
      entradas: `R$ ${entradas.toFixed(2)}`,
      saidas: `R$ ${saidas.toFixed(2)}`,
      saldo: `R$ ${saldo.toFixed(2)}`,
      totalTransacoes: transactions.length
    });

    // 6. RETORNAR RESUMO
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          entradas: Number(entradas.toFixed(2)),
          saidas: Number(saidas.toFixed(2)),
          saldo: Number(saldo.toFixed(2)),
          total: transactions.length
        },
        period: {
          start: startDate,
          end: endDate
        }
      }
    });

  } catch (error) {
    console.error('❌ Erro ao consultar transações:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao consultar transações',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
