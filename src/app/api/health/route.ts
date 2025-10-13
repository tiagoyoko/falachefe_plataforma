import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Verificar variáveis de ambiente
    const envCheck = {
      DATABASE_URL: !!process.env.DATABASE_URL,
      POSTGRES_URL: !!process.env.POSTGRES_URL,
      BETTER_AUTH_SECRET: !!process.env.BETTER_AUTH_SECRET,
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'not set',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'not set',
      NODE_ENV: process.env.NODE_ENV,
    };

    // Tentar conectar ao banco
    let dbStatus = 'not tested';
    try {
      const { db } = await import('@/lib/db');
      await db.execute('SELECT 1 as test');
      dbStatus = 'connected';
    } catch (error) {
      dbStatus = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    }

    // Tentar inicializar Better Auth
    let authStatus = 'not tested';
    try {
      const { auth } = await import('@/lib/auth/auth');
      authStatus = auth ? 'initialized' : 'not initialized';
    } catch (error) {
      authStatus = `error: ${error instanceof Error ? error.message : 'unknown'}`;
    }

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: envCheck,
      database: dbStatus,
      auth: authStatus,
    });

  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}

