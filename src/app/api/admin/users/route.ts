import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/admin/users - Listar usuários com filtros
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

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

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const subscriptionStatus = searchParams.get('subscriptionStatus') || '';

    // Filtrar usuários
    let filteredUsers = mockUsers;

    if (search) {
      filteredUsers = filteredUsers.filter(user => 
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (subscriptionStatus && subscriptionStatus !== 'all') {
      filteredUsers = filteredUsers.filter(user => 
        user.subscriptionStatus === subscriptionStatus
      );
    }

    // Paginação
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: filteredUsers.length,
        totalPages: Math.ceil(filteredUsers.length / limit)
      }
    });

  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}