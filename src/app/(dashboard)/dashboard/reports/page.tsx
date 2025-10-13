"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp,
  Users,
  MessageSquare,
  Bot,
  DollarSign,
  Download,
  Calendar,
  Filter,
  RefreshCw
} from "lucide-react";

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("30d");
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    // Simular carregamento
    setTimeout(() => setIsLoading(false), 2000);
  };

  const handleExport = (format: string) => {
    console.log(`Exportando relatório em formato ${format}`);
    // Implementar exportação real
  };

  const metrics = {
    totalRevenue: 45980,
    totalUsers: 150,
    totalConversations: 2340,
    totalAgents: 8,
    revenueGrowth: 12.5,
    userGrowth: 8.2,
    conversationGrowth: 15.3,
    agentEfficiency: 94.2
  };

  const topAgents = [
    { name: "Agente de Suporte", conversations: 456, resolution: 96, revenue: 12500 },
    { name: "Agente de Vendas", conversations: 234, resolution: 92, revenue: 18900 },
    { name: "Agente Financeiro", conversations: 189, resolution: 94, revenue: 8900 },
    { name: "Agente de Marketing", conversations: 156, resolution: 88, revenue: 5680 }
  ];

  const monthlyData = [
    { month: "Jan", revenue: 32000, users: 120, conversations: 1800 },
    { month: "Fev", revenue: 35000, users: 135, conversations: 2100 },
    { month: "Mar", revenue: 42000, users: 145, conversations: 2200 },
    { month: "Abr", revenue: 45980, users: 150, conversations: 2340 }
  ];

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise de performance e métricas da plataforma
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Período:</span>
        {['7d', '30d', '90d', '1y'].map((period) => (
          <Button
            key={period}
            variant={selectedPeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedPeriod(period)}
          >
            {period === '7d' ? '7 dias' : 
             period === '30d' ? '30 dias' :
             period === '90d' ? '90 dias' : '1 ano'}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {metrics.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">+{metrics.revenueGrowth}%</span>
              <span className="ml-1">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">+{metrics.userGrowth}%</span>
              <span className="ml-1">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalConversations.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">+{metrics.conversationGrowth}%</span>
              <span className="ml-1">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eficiência dos Agentes</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.agentEfficiency}%</div>
            <div className="flex items-center text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              <span className="text-green-600">+2.1%</span>
              <span className="ml-1">vs mês anterior</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="agents">Performance dos Agentes</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Evolução da Receita</CardTitle>
                <CardDescription>Receita mensal dos últimos 4 meses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyData.map((data) => (
                    <div key={data.month} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        <span className="font-medium">{data.month}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">R$ {data.revenue.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">
                          {data.users} usuários • {data.conversations} conversas
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top Agents */}
            <Card>
              <CardHeader>
                <CardTitle>Top Agentes</CardTitle>
                <CardDescription>Performance dos melhores agentes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topAgents.map((agent, index) => (
                    <div key={agent.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <div className="font-medium">{agent.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {agent.conversations} conversas • {agent.resolution}% resolução
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">R$ {agent.revenue.toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Detalhada dos Agentes</CardTitle>
              <CardDescription>Métricas individuais de cada agente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topAgents.map((agent) => (
                  <div key={agent.name} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{agent.name}</h3>
                      <Badge variant="secondary">R$ {agent.revenue.toLocaleString()}</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Conversas</div>
                        <div className="font-semibold">{agent.conversations}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Taxa de Resolução</div>
                        <div className="font-semibold">{agent.resolution}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Receita Gerada</div>
                        <div className="font-semibold">R$ {agent.revenue.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Receita por Período</CardTitle>
                <CardDescription>Comparação de receita entre períodos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Este mês</span>
                    <span className="font-semibold">R$ 45.980</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Mês anterior</span>
                    <span className="font-semibold">R$ 42.000</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Diferença</span>
                    <span className="font-semibold text-green-600">+R$ 3.980 (+9.5%)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Exportar Relatórios</CardTitle>
                <CardDescription>Baixe relatórios em diferentes formatos</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleExport('csv')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleExport('pdf')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar PDF
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={() => handleExport('excel')}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Exportar Excel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise de Usuários</CardTitle>
              <CardDescription>Métricas de crescimento e engajamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="font-semibold">Crescimento</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Novos usuários este mês</span>
                      <span className="font-semibold">+15</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de retenção</span>
                      <span className="font-semibold">87%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Usuários ativos</span>
                      <span className="font-semibold">120/150</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold">Engajamento</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Conversas por usuário</span>
                      <span className="font-semibold">15.6</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tempo médio de sessão</span>
                      <span className="font-semibold">8.5 min</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Satisfação</span>
                      <span className="font-semibold">4.7/5</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
