import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// GET /api/admin/plans - Listar planos de assinatura
export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Simular dados de planos para demonstração
    const mockPlans = [
      {
        id: "plan_1",
        name: "Professional",
        slug: "professional",
        description: "Plano profissional com recursos avançados",
        priceMonthly: 199.90,
        priceYearly: 1999.00,
        features: [
          "Até 1000 usuários",
          "Suporte prioritário",
          "Integrações avançadas",
          "Relatórios detalhados"
        ],
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z"
      },
      {
        id: "plan_2",
        name: "Starter",
        slug: "starter",
        description: "Plano inicial para pequenas empresas",
        priceMonthly: 99.90,
        priceYearly: 999.00,
        features: [
          "Até 100 usuários",
          "Suporte por email",
          "Integrações básicas",
          "Relatórios simples"
        ],
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z"
      },
      {
        id: "plan_3",
        name: "Enterprise",
        slug: "enterprise",
        description: "Plano empresarial com recursos ilimitados",
        priceMonthly: 499.90,
        priceYearly: 4999.00,
        features: [
          "Usuários ilimitados",
          "Suporte 24/7",
          "Todas as integrações",
          "Relatórios personalizados",
          "Gerente de conta dedicado"
        ],
        isActive: true,
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z"
      }
    ];

    return NextResponse.json({
      plans: mockPlans,
      total: mockPlans.length
    });

  } catch (error) {
    console.error('Erro ao listar planos:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}