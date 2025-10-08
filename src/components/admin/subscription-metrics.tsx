"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign,
  UserCheck,
  UserX,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { useSession } from "@/lib/auth/auth-client";
import { toast } from "sonner";

// Tipos
interface SubscriptionMetrics {
  period: {
    from: string;
    to: string;
    type: string;
  };
  users: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    newUsersThisPeriod: number;
  };
  subscriptions: {
    totalSubscriptions: number;
    activeSubscriptions: number;
    inactiveSubscriptions: number;
    cancelledSubscriptions: number;
    pastDueSubscriptions: number;
    unpaidSubscriptions: number;
    trialingSubscriptions: number;
    pausedSubscriptions: number;
    newSubscriptionsThisPeriod: number;
  };
  revenue: {
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    averageRevenuePerUser: number;
    totalTransactions: number;
    failedTransactions: number;
    pendingTransactions: number;
  };
  churn: {
    totalChurned: number;
    churnRate: number;
  };
  planDistribution: Array<{
    planId: string;
    planName: string;
    planSlug: string;
    priceMonthly: string;
    priceYearly: string;
    subscriberCount: number;
    revenue: number;
  }>;
  companyMetrics: Array<{
    companyId: string;
    companyName: string;
    subscriptionCount: number;
    activeSubscriptions: number;
    revenue: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    revenue: number;
    transactions: number;
    newSubscriptions: number;
  }>;
  overdueUsers: Array<{
    id: string;
    name: string;
    email: string;
    subscriptionStatus: string;
    planName: string;
    nextBillingDate: string;
    lastPaymentDate: string;
    daysOverdue: number;
  }>;
  summary: {
    totalUsers: number;
    activeUsers: number;
    totalRevenue: number;
    monthlyRecurringRevenue: number;
    churnRate: number;
    overdueCount: number;
  };
}

// Componente principal
export function SubscriptionMetrics() {
  const { data: session } = useSession();
  const [metrics, setMetrics] = useState<SubscriptionMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [selectedView, setSelectedView] = useState('overview');

  // Carregar métricas
  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/metrics/subscriptions?period=${period}`);
      const data = await response.json();

      if (response.ok) {
        setMetrics(data);
      } else {
        toast.error(data.error || 'Erro ao carregar métricas');
      }
    } catch (error) {
      console.error('Erro ao carregar métricas:', error);
      toast.error('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [period]);

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para formatar número
  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-4 w-4 bg-muted rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-16 mb-2"></div>
                <div className="h-3 bg-muted rounded w-32"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p>Erro ao carregar métricas</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Último mês</SelectItem>
              <SelectItem value="quarter">Último trimestre</SelectItem>
              <SelectItem value="year">Último ano</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedView} onValueChange={setSelectedView}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">Visão Geral</SelectItem>
              <SelectItem value="revenue">Receita</SelectItem>
              <SelectItem value="users">Usuários</SelectItem>
              <SelectItem value="churn">Churn</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button onClick={fetchMetrics} variant="outline" size="sm">
          <Activity className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Cards de métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.summary.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +{formatNumber(metrics.users.newUsersThisPeriod)} novos usuários
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(metrics.summary.activeUsers)}</div>
            <div className="flex items-center gap-2 mt-2">
              <Progress 
                value={(metrics.summary.activeUsers / metrics.summary.totalUsers) * 100} 
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground">
                {Math.round((metrics.summary.activeUsers / metrics.summary.totalUsers) * 100)}%
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(metrics.summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              MRR: {formatCurrency(metrics.summary.monthlyRecurringRevenue)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.summary.churnRate}%</div>
            <p className="text-xs text-muted-foreground">
              {metrics.churn.totalChurned} cancelamentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Status das assinaturas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Assinaturas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(metrics.subscriptions.activeSubscriptions)}
            </div>
            <p className="text-xs text-muted-foreground">
              {Math.round((metrics.subscriptions.activeSubscriptions / metrics.subscriptions.totalSubscriptions) * 100)}% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Em Trial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(metrics.subscriptions.trialingSubscriptions)}
            </div>
            <p className="text-xs text-muted-foreground">
              Período de teste
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Em Atraso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {formatNumber(metrics.subscriptions.pastDueSubscriptions)}
            </div>
            <p className="text-xs text-muted-foreground">
              Pagamento pendente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserX className="h-4 w-4 text-red-600" />
              Canceladas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatNumber(metrics.subscriptions.cancelledSubscriptions)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metrics.churn.churnRate}% de churn
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Distribuição por planos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Distribuição por Planos
          </CardTitle>
          <CardDescription>
            Quantidade de assinantes por plano de assinatura
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.planDistribution.map((plan) => (
              <div key={plan.planId} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{plan.planName}</div>
                  <div className="text-sm text-muted-foreground">
                    {plan.planSlug} • {formatCurrency(parseFloat(plan.priceMonthly))}/mês
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{formatNumber(plan.subscriberCount)}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatCurrency(plan.revenue)} receita
                  </div>
                </div>
                <div className="ml-4 w-32">
                  <Progress 
                    value={(plan.subscriberCount / metrics.subscriptions.totalSubscriptions) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Usuários inadimplentes */}
      {metrics.overdueUsers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              Usuários Inadimplentes
            </CardTitle>
            <CardDescription>
              {metrics.overdueUsers.length} usuários com pagamentos em atraso
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.overdueUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                    <div className="text-xs text-muted-foreground">
                      Plano: {user.planName} • Status: {user.subscriptionStatus}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="destructive">
                      {user.daysOverdue} dias em atraso
                    </Badge>
                    <div className="text-xs text-muted-foreground mt-1">
                      Próxima cobrança: {new Date(user.nextBillingDate).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>
              ))}
              {metrics.overdueUsers.length > 5 && (
                <div className="text-center text-sm text-muted-foreground">
                  E mais {metrics.overdueUsers.length - 5} usuários...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tendências mensais */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Tendências Mensais
          </CardTitle>
          <CardDescription>
            Evolução da receita e assinaturas nos últimos meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.monthlyTrends.slice(-6).map((trend, index) => (
              <div key={trend.month} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">
                    {new Date(trend.month + '-01').toLocaleDateString('pt-BR', { 
                      month: 'long', 
                      year: 'numeric' 
                    })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(trend.newSubscriptions)} novas assinaturas
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{formatCurrency(trend.revenue)}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(trend.transactions)} transações
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Métricas por empresa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Empresas
          </CardTitle>
          <CardDescription>
            Empresas com maior número de assinaturas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {metrics.companyMetrics.slice(0, 5).map((company) => (
              <div key={company.companyId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="font-medium">{company.companyName}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(company.activeSubscriptions)} assinaturas ativas
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">{formatCurrency(company.revenue)}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(company.subscriptionCount)} total
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}