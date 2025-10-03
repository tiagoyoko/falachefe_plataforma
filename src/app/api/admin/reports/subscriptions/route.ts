import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/admin/reports/subscriptions - Exportar relatório de assinaturas
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

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

    if (format === 'csv') {
      // Gerar CSV
      const csvHeaders = [
        'ID',
        'Nome',
        'Email',
        'Role',
        'Status',
        'Plano',
        'Empresa',
        'Último Pagamento',
        'Total Pago',
        'Data de Criação'
      ].join(',');

      const csvRows = mockUsers.map(user => [
        user.id,
        user.name,
        user.email,
        user.role,
        user.subscriptionStatus,
        user.planName,
        user.companyName,
        user.lastPaymentDate ? new Date(user.lastPaymentDate).toLocaleDateString('pt-BR') : 'Nunca',
        user.totalPaid.toFixed(2),
        new Date(user.createdAt).toLocaleDateString('pt-BR')
      ].join(','));

      const csvContent = [csvHeaders, ...csvRows].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="usuarios-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    } else if (format === 'json') {
      // Gerar JSON
      const jsonData = {
        exportDate: new Date().toISOString(),
        totalUsers: mockUsers.length,
        users: mockUsers.map(user => ({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          isActive: user.isActive,
          subscriptionStatus: user.subscriptionStatus,
          planName: user.planName,
          companyName: user.companyName,
          lastPaymentDate: user.lastPaymentDate,
          totalPaid: user.totalPaid,
          createdAt: user.createdAt
        }))
      };

      return new NextResponse(JSON.stringify(jsonData, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="usuarios-${new Date().toISOString().split('T')[0]}.json"`
        }
      });
    } else {
      return NextResponse.json({ error: "Formato não suportado" }, { status: 400 });
    }

  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}