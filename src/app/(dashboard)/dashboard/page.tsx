"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth/auth-client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { 
  MessageSquare, 
  Bot, 
  Users, 
  BarChart3, 
  Settings, 
  Plus,
  CheckCircle
} from "lucide-react";

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [onboardingStatus, setOnboardingStatus] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isPending && session) {
      const checkOnboarding = async () => {
        try {
          const res = await fetch("/api/onboarding/status");
          if (res.ok) {
            const data = await res.json();
            setOnboardingStatus(data.isCompleted);
          } else {
            // Handle error or assume not completed
            setOnboardingStatus(false);
          }
        } catch (error) {
          console.error("Failed to fetch onboarding status:", error);
          setOnboardingStatus(false);
        }
      };
      checkOnboarding();
    } else if (!isPending && !session) {
      router.push("/login");
    }
  }, [session, isPending, router]);

  useEffect(() => {
    if (onboardingStatus !== null) {
      if (onboardingStatus) {
        // Onboarding completed, show dashboard content
        // Continue to render the dashboard
      } else {
        // Onboarding not completed, redirect to onboarding page
        router.push("/onboarding");
      }
    }
  }, [onboardingStatus, router]);

  if (isPending || onboardingStatus === null) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!session) {
    return null; // Should be redirected by the first useEffect
  }
  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral da sua plataforma de chat multagente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agente
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas Ativas</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> novos este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Únicos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5,678</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8%</span> em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94.2%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> em relação ao mês passado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        {/* Recent Conversations */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Conversas Recentes</CardTitle>
            <CardDescription>
              Últimas conversas iniciadas pelos usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  id: 1,
                  user: "João Silva",
                  phone: "+55 11 99999-9999",
                  agent: "Vendas",
                  status: "active",
                  lastMessage: "Gostaria de saber mais sobre os planos",
                  time: "2 min atrás"
                },
                {
                  id: 2,
                  user: "Maria Santos",
                  phone: "+55 11 88888-8888",
                  agent: "Suporte",
                  status: "resolved",
                  lastMessage: "Problema resolvido, obrigada!",
                  time: "15 min atrás"
                },
                {
                  id: 3,
                  user: "Pedro Costa",
                  phone: "+55 11 77777-7777",
                  agent: "Marketing",
                  status: "waiting",
                  lastMessage: "Aguardando resposta sobre campanha",
                  time: "1 hora atrás"
                }
              ].map((conversation) => (
                <div key={conversation.id} className="flex items-center space-x-4">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium">{conversation.user}</p>
                      <Badge variant={
                        conversation.status === 'active' ? 'default' :
                        conversation.status === 'resolved' ? 'secondary' : 'outline'
                      }>
                        {conversation.status === 'active' ? 'Ativa' :
                         conversation.status === 'resolved' ? 'Resolvida' : 'Aguardando'}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{conversation.phone}</p>
                    <p className="text-sm">{conversation.lastMessage}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{conversation.agent}</p>
                    <p className="text-xs text-muted-foreground">{conversation.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agent Performance */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Performance dos Agentes</CardTitle>
            <CardDescription>
              Métricas de eficiência por agente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: "Agente Vendas", conversations: 156, resolution: 92, avgTime: "3.2min" },
                { name: "Agente Suporte", conversations: 234, resolution: 96, avgTime: "2.8min" },
                { name: "Agente Marketing", conversations: 89, resolution: 88, avgTime: "4.1min" },
                { name: "Agente Financeiro", conversations: 67, resolution: 94, avgTime: "2.5min" }
              ].map((agent, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {agent.conversations} conversas • {agent.avgTime} tempo médio
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{agent.resolution}%</p>
                    <p className="text-xs text-muted-foreground">resolução</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Acesso rápido às funcionalidades principais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col">
              <Bot className="h-6 w-6 mb-2" />
              Gerenciar Agentes
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <MessageSquare className="h-6 w-6 mb-2" />
              Ver Conversas
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="h-6 w-6 mb-2" />
              Relatórios
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Settings className="h-6 w-6 mb-2" />
              Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
