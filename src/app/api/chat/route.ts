import { NextRequest, NextResponse } from 'next/server';

/**
 * Endpoint de chat web que integra com CrewAI
 * 
 * Este endpoint recebe mensagens da interface web de chat e as encaminha
 * para o endpoint CrewAI para processamento pelos agentes.
 * 
 * Fluxo:
 * 1. Interface web → POST /api/chat
 * 2. Este endpoint → POST /api/crewai/process
 * 3. CrewAI processa com webhook_processor.py
 * 4. Resposta retorna para a interface web
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, userId, conversationId, includeUserProfile, forceToolUse } = body;

    // Validações básicas
    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { 
          error: 'message is required and must be a string',
          content: 'Por favor, envie uma mensagem válida.'
        },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { 
          error: 'userId is required',
          content: 'Usuário não identificado. Por favor, faça login.'
        },
        { status: 401 }
      );
    }

    console.log('🌐 Web chat message received:', {
      messagePreview: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
      userId,
      conversationId,
      includeUserProfile,
      forceToolUse,
      timestamp: new Date().toISOString()
    });

    // Preparar contexto adicional para o CrewAI
    const context = {
      source: 'web-chat',
      conversationId: conversationId || `web_${Date.now()}`,
      includeUserProfile: includeUserProfile ?? true,
      forceToolUse: forceToolUse ?? false,
      timestamp: new Date().toISOString()
    };

    // Chamar API Flask do CrewAI no servidor Hetzner
    // Produção: http://37.27.248.13:8000 (Hetzner VPS)
    // Pode ser sobrescrito via CREWAI_API_URL
    const crewAIUrl = process.env.CREWAI_API_URL || 'http://37.27.248.13:8000/process';
    
    console.log('🤖 Calling CrewAI Flask API:', {
      url: crewAIUrl,
      userId,
      messageLength: message.length
    });

    const requestBody = {
      message: message,           // API espera "message"
      userId: userId,             // API espera "userId"
      phoneNumber: '+5500000000', // API exige phoneNumber (dummy para web)
      context: context            // API aceita "context"
    };
    
    console.log('📤 Request Body:', JSON.stringify(requestBody, null, 2));

    const startTime = Date.now();
    const crewAIResponse = await fetch(crewAIUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    const elapsed = Date.now() - startTime;
    
    console.log(`⏱️ CrewAI Response Time: ${elapsed}ms, Status: ${crewAIResponse.status}`);

    if (!crewAIResponse.ok) {
      const errorText = await crewAIResponse.text();
      console.error('❌ CrewAI endpoint error:', {
        status: crewAIResponse.status,
        statusText: crewAIResponse.statusText,
        errorText: errorText.substring(0, 500),
        elapsed: `${elapsed}ms`
      });

      // Retornar erro amigável ao usuário
      return NextResponse.json(
        {
          error: 'Erro ao processar mensagem',
          content: 'Desculpe, houve um erro ao processar sua mensagem. Tente novamente em instantes.',
          debug: process.env.NODE_ENV === 'development' ? errorText.substring(0, 200) : undefined,
          success: false
        },
        { status: 500 }
      );
    }

    const crewAIData = await crewAIResponse.json();
    
    console.log('✅ CrewAI response received:', {
      success: crewAIData.success,
      responseLength: crewAIData.response?.length || 0,
      processingTime: crewAIData.metadata?.processing_time_ms || 0
    });

    // Retornar resposta no formato esperado pelo hook useAgentChat
    return NextResponse.json({
      success: crewAIData.success,
      content: crewAIData.response,
      response: crewAIData.response, // Compatibilidade com formato antigo
      metadata: {
        ...crewAIData.metadata,
        conversationId: context.conversationId,
        source: 'web-chat',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Error in web chat endpoint:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        content: 'Desculpe, houve um erro inesperado. Por favor, tente novamente.',
        message: error instanceof Error ? error.message : 'Unknown error',
        success: false
      },
      { status: 500 }
    );
  }
}

/**
 * Health check endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'Web Chat API',
    endpoints: {
      post: 'POST /api/chat - Send message to CrewAI agents',
      get: 'GET /api/chat - Health check'
    },
    timestamp: new Date().toISOString()
  });
}

