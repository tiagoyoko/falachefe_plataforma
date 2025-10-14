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
 * Health check do endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Financial CrewAI API',
    endpoints: {
      POST: 'Registrar transação do fluxo de caixa'
    },
    timestamp: new Date().toISOString()
  });
}
