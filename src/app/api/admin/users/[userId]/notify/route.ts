import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// POST /api/admin/users/[userId]/notify - Enviar notificação para usuário
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const params = await context.params;
    const { userId } = params;
    const body = await request.json();
    const { message } = body;

    if (!message) {
      return NextResponse.json({ error: "Mensagem é obrigatória" }, { status: 400 });
    }

    // Simular envio de notificação
    console.log(`Enviando notificação para usuário ${userId}: ${message}`);
    
    return NextResponse.json({ 
      success: true, 
      message: "Notificação enviada com sucesso",
      notification: {
        userId: userId,
        message: message,
        sentAt: new Date().toISOString(),
        status: "sent"
      }
    });

  } catch (error) {
    console.error('Erro ao enviar notificação:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
