import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// PATCH /api/admin/users/[userId] - Ações em usuários específicos
export async function PATCH(
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
    const { action, planId, message } = body;

    // Simular dados de usuários para demonstração
    const mockUsers = [
      {
        id: "1",
        name: "João Silva",
        email: "joao@exemplo.com",
        role: "super_admin",
        isActive: true,
        createdAt: "2024-01-15T10:00:00Z",
        updatedAt: "2024-01-15T10:00:00Z",
        subscriptionId: "sub_1",
        subscriptionStatus: "active",
        planId: "plan_1",
        planName: "Professional",
        planSlug: "professional",
        nextBillingDate: "2024-02-15T10:00:00Z",
        companyId: "comp_1",
        companyName: "Empresa A",
        totalPayments: 2,
        totalInvoices: 2,
        lastPaymentDate: "2024-01-15T10:00:00Z",
        totalPaid: 199.90
      },
      {
        id: "2",
        name: "Maria Santos",
        email: "maria@exemplo.com",
        role: "manager",
        isActive: true,
        createdAt: "2024-01-20T14:30:00Z",
        updatedAt: "2024-01-20T14:30:00Z",
        subscriptionId: "sub_2",
        subscriptionStatus: "trialing",
        planId: "plan_2",
        planName: "Starter",
        planSlug: "starter",
        nextBillingDate: "2024-02-20T14:30:00Z",
        companyId: "comp_2",
        companyName: "Empresa B",
        totalPayments: 0,
        totalInvoices: 0,
        lastPaymentDate: null,
        totalPaid: 0
      },
      {
        id: "3",
        name: "Pedro Costa",
        email: "pedro@exemplo.com",
        role: "analyst",
        isActive: false,
        createdAt: "2024-01-25T09:15:00Z",
        updatedAt: "2024-01-25T09:15:00Z",
        subscriptionId: "sub_3",
        subscriptionStatus: "past_due",
        planId: "plan_1",
        planName: "Professional",
        planSlug: "professional",
        nextBillingDate: "2024-01-10T09:15:00Z",
        companyId: "comp_3",
        companyName: "Empresa C",
        totalPayments: 1,
        totalInvoices: 1,
        lastPaymentDate: "2023-12-25T09:15:00Z",
        totalPaid: 199.90
      }
    ];

    // Encontrar o usuário
    const user = mockUsers.find(u => u.id === userId);
    if (!user) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 });
    }

    // Processar ações
    switch (action) {
      case 'block':
        // Simular bloqueio do usuário
        console.log(`Bloqueando usuário ${userId}`);
        return NextResponse.json({ 
          success: true, 
          message: "Usuário bloqueado com sucesso",
          user: { ...user, isActive: false }
        });

      case 'unblock':
        // Simular desbloqueio do usuário
        console.log(`Desbloqueando usuário ${userId}`);
        return NextResponse.json({ 
          success: true, 
          message: "Usuário desbloqueado com sucesso",
          user: { ...user, isActive: true }
        });

      case 'change_plan':
        if (!planId) {
          return NextResponse.json({ error: "ID do plano é obrigatório" }, { status: 400 });
        }
        // Simular mudança de plano
        console.log(`Alterando plano do usuário ${userId} para ${planId}`);
        return NextResponse.json({ 
          success: true, 
          message: "Plano alterado com sucesso",
          user: { ...user, planId, planName: "Novo Plano" }
        });

      case 'send_notification':
        if (!message) {
          return NextResponse.json({ error: "Mensagem é obrigatória" }, { status: 400 });
        }
        // Simular envio de notificação
        console.log(`Enviando notificação para usuário ${userId}: ${message}`);
        return NextResponse.json({ 
          success: true, 
          message: "Notificação enviada com sucesso"
        });

      default:
        return NextResponse.json({ error: "Ação não reconhecida" }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro ao processar ação do usuário:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}