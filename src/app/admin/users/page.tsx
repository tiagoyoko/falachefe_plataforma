"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  BarChart3, 
  Shield, 
  AlertTriangle,
  UserCheck,
  DollarSign,
  TrendingUp
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { UsersTable } from "@/components/admin/users-table";
import { SubscriptionMetrics } from "@/components/admin/subscription-metrics";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const { data: session, isPending } = useSession();
  const [activeTab, setActiveTab] = useState("users");

  if (isPending) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-6">
            Você precisa fazer login para acessar a gestão de usuários
          </p>
          <Button onClick={() => window.location.href = '/login'}>
            Fazer Login
          </Button>
        </div>
      </div>
    );
  }

  // Verificar se o usuário tem permissão para acessar esta página
  // Por enquanto, permitir acesso para todos os usuários logados
  // TODO: Implementar verificação de role adequada
  const hasAccess = true;
  
  if (!hasAccess) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
          <p className="text-muted-foreground mb-6">
            Você não tem permissão para acessar a gestão de usuários
          </p>
          <Button onClick={() => window.location.href = '/dashboard'}>
            Voltar ao Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const handleBlockOverdueUsers = async () => {
    try {
      // Simular bloqueio de usuários inadimplentes
      const overdueUsers = ["3"]; // IDs dos usuários inadimplentes
      
      for (const userId of overdueUsers) {
        const response = await fetch(`/api/admin/users/${userId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'block' })
        });

        if (response.ok) {
          console.log(`Usuário ${userId} bloqueado com sucesso`);
        }
      }

      toast.success(`${overdueUsers.length} usuários inadimplentes foram bloqueados`);
      
      // Recarregar a página para atualizar os dados
      window.location.reload();
    } catch (error) {
      console.error('Erro ao bloquear usuários inadimplentes:', error);
      toast.error('Erro ao bloquear usuários inadimplentes');
    }
  };

  const handleCreateUser = () => {
    // Abrir modal ou página para criar usuário
    const name = prompt("Nome do usuário:");
    const email = prompt("Email do usuário:");
    const role = prompt("Role (super_admin, manager, analyst, viewer):");
    
    if (name && email && role) {
      // Simular criação de usuário
      console.log(`Criando usuário: ${name}, ${email}, ${role}`);
      toast.success(`Usuário ${name} criado com sucesso`);
      
      // Recarregar a página para atualizar os dados
      window.location.reload();
    } else {
      toast.error("Dados inválidos para criação do usuário");
    }
  };

  const handleExportReport = async () => {
    try {
      const format = prompt("Formato do relatório (csv ou json):") || "csv";
      
      if (format !== "csv" && format !== "json") {
        toast.error("Formato inválido. Use 'csv' ou 'json'");
        return;
      }

      const response = await fetch(`/api/admin/reports/subscriptions?format=${format}`);
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `relatorio-vendas-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success(`Relatório ${format.toUpperCase()} exportado com sucesso`);
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao exportar relatório');
      }
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, assinaturas e pagamentos da plataforma
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="flex items-center gap-2">
            <Shield className="w-3 h-3" />
            Administrador
          </Badge>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">150</div>
            <p className="text-xs text-muted-foreground">
              +12% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <UserCheck className="h-4 w-4 text-green-600" />
              Usuários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">120</div>
            <p className="text-xs text-muted-foreground">
              80% do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-blue-600" />
              Receita Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">R$ 19.980</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +8% em relação ao mês anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              Inadimplentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">5</div>
            <p className="text-xs text-muted-foreground">
              Requerem atenção
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Ações administrativas */}
      {session.user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Ações Administrativas</CardTitle>
            <CardDescription>
              Ferramentas para gerenciar usuários e assinaturas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleCreateUser}
              >
                <UserCheck className="w-4 h-4 mr-2" />
                Criar Novo Usuário
              </Button>
              
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleExportReport}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Relatório de Vendas
              </Button>
              
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleBlockOverdueUsers}
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Bloquear Inadimplentes
              </Button>
              
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => toast.info("Funcionalidade em desenvolvimento")}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                Processar Pagamentos
              </Button>
              
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => toast.info("Funcionalidade em desenvolvimento")}
              >
                <Users className="w-4 h-4 mr-2" />
                Importar Usuários
              </Button>
              
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => toast.info("Funcionalidade em desenvolvimento")}
              >
                <Shield className="w-4 h-4 mr-2" />
                Configurar Permissões
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Lista de Usuários
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Métricas e Relatórios
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <UsersTable />
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <SubscriptionMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
}