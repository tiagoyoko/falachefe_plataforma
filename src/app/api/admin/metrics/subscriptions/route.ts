import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { headers } from "next/headers";

// GET /api/admin/metrics/subscriptions - Obter métricas de assinaturas
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers()
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Simular métricas para demonstração
    const mockMetrics = {
      period: {
        from: "2024-01-01T00:00:00Z",
        to: "2024-01-31T23:59:59Z",
        type: "month"
      },
      users: {
        totalUsers: 150,
        activeUsers: 120,
        inactiveUsers: 30,
        newUsersThisPeriod: 25
      },
      subscriptions: {
        totalSubscriptions: 120,
        activeSubscriptions: 95,
        inactiveSubscriptions: 5,
        cancelledSubscriptions: 15,
        pastDueSubscriptions: 3,
        unpaidSubscriptions: 2,
        trialingSubscriptions: 8,
        pausedSubscriptions: 1,
        newSubscriptionsThisPeriod: 25
      },
      revenue: {
        totalRevenue: 23980.00,
        monthlyRecurringRevenue: 19980.00,
        averageRevenuePerUser: 199.80,
        totalTransactions: 120,
        failedTransactions: 5,
        pendingTransactions: 2
      },
      churn: {
        totalChurned: 15,
        churnRate: 12.5
      },
      planDistribution: [
        {
          planId: "plan_1",
          planName: "Professional",
          planSlug: "professional",
          priceMonthly: "199.90",
          priceYearly: "1999.00",
          subscriberCount: 60,
          revenue: 11994.00
        },
        {
          planId: "plan_2",
          planName: "Starter",
          planSlug: "starter",
          priceMonthly: "99.90",
          priceYearly: "999.00",
          subscriberCount: 35,
          revenue: 3496.50
        },
        {
          planId: "plan_3",
          planName: "Enterprise",
          planSlug: "enterprise",
          priceMonthly: "499.90",
          priceYearly: "4999.00",
          subscriberCount: 25,
          revenue: 12497.50
        }
      ],
      companyMetrics: [
        {
          companyId: "comp_1",
          companyName: "Empresa A",
          subscriptionCount: 45,
          activeSubscriptions: 40,
          revenue: 8995.50
        },
        {
          companyId: "comp_2",
          companyName: "Empresa B",
          subscriptionCount: 30,
          activeSubscriptions: 28,
          revenue: 5996.00
        },
        {
          companyId: "comp_3",
          companyName: "Empresa C",
          subscriptionCount: 25,
          activeSubscriptions: 20,
          revenue: 4998.00
        }
      ],
      monthlyTrends: [
        {
          month: "2024-01",
          revenue: 19980.00,
          transactions: 120,
          newSubscriptions: 25
        },
        {
          month: "2023-12",
          revenue: 18950.00,
          transactions: 115,
          newSubscriptions: 22
        },
        {
          month: "2023-11",
          revenue: 17500.00,
          transactions: 110,
          newSubscriptions: 20
        }
      ],
      overdueUsers: [
        {
          id: "3",
          name: "Pedro Costa",
          email: "pedro@exemplo.com",
          subscriptionStatus: "past_due",
          planName: "Professional",
          nextBillingDate: "2024-01-10T09:15:00Z",
          lastPaymentDate: "2023-12-25T09:15:00Z",
          daysOverdue: 24
        },
        {
          id: "4",
          name: "Ana Oliveira",
          email: "ana@exemplo.com",
          subscriptionStatus: "unpaid",
          planName: "Starter",
          nextBillingDate: "2024-01-05T14:20:00Z",
          lastPaymentDate: "2023-12-05T14:20:00Z",
          daysOverdue: 29
        }
      ],
      summary: {
        totalUsers: 150,
        activeUsers: 120,
        totalRevenue: 23980.00,
        monthlyRecurringRevenue: 19980.00,
        churnRate: 12.5,
        overdueCount: 2
      }
    };

    return NextResponse.json(mockMetrics);

  } catch (error) {
    console.error('Erro ao buscar métricas:', error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}