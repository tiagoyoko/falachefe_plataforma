"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Search, 
  Download, 
  UserCheck, 
  UserX, 
  Mail,
  Calendar,
  Building,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";
import { useSession } from "@/lib/auth/auth-client";
import { toast } from "sonner";

// Tipos
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  subscriptionId: string;
  subscriptionStatus: string;
  planId: string;
  planName: string;
  planSlug: string;
  nextBillingDate: string;
  companyId: string;
  companyName: string;
  totalPayments: number;
  totalInvoices: number;
  lastPaymentDate: string | null;
  totalPaid: number;
}

interface UsersResponse {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Componente principal
export function UsersTable() {
  const { data: session } = useSession();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [subscriptionStatus, setSubscriptionStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Carregar usuários
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(search && { search }),
        ...(subscriptionStatus && { subscriptionStatus })
      });

      const response = await fetch(`/api/admin/users?${params}`);
      const data: UsersResponse = await response.json();

      if (response.ok) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else {
        toast.error('Erro ao carregar usuários');
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, subscriptionStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Função para formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  // Função para formatar moeda
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Função para obter badge de status
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Ativo', variant: 'default' as const, icon: CheckCircle },
      trialing: { label: 'Trial', variant: 'secondary' as const, icon: Clock },
      past_due: { label: 'Em Atraso', variant: 'destructive' as const, icon: AlertTriangle },
      unpaid: { label: 'Não Pago', variant: 'destructive' as const, icon: XCircle },
      cancelled: { label: 'Cancelado', variant: 'outline' as const, icon: UserX },
      paused: { label: 'Pausado', variant: 'secondary' as const, icon: Clock }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      variant: 'outline' as const,
      icon: Clock
    };

    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  // Função para obter badge de role
  const getRoleBadge = (role: string) => {
    const roleConfig = {
      super_admin: { label: 'Super Admin', variant: 'destructive' as const },
      manager: { label: 'Gerente', variant: 'default' as const },
      analyst: { label: 'Analista', variant: 'secondary' as const },
      viewer: { label: 'Visualizador', variant: 'outline' as const }
    };

    const config = roleConfig[role as keyof typeof roleConfig] || {
      label: role,
      variant: 'outline' as const
    };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Função para exportar relatório
  const exportReport = async (format: 'csv' | 'json') => {
    try {
      const response = await fetch(`/api/admin/reports/subscriptions?format=${format}`);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usuarios-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success(`Relatório ${format.toUpperCase()} exportado com sucesso`);
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
      toast.error('Erro ao exportar relatório');
    }
  };

  // Função para bloquear usuário
  const blockUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'block' })
      });

      if (response.ok) {
        toast.success('Usuário bloqueado com sucesso');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao bloquear usuário');
      }
    } catch (error) {
      console.error('Erro ao bloquear usuário:', error);
      toast.error('Erro ao bloquear usuário');
    }
  };

  // Função para desbloquear usuário
  const unblockUser = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unblock' })
      });

      if (response.ok) {
        toast.success('Usuário desbloqueado com sucesso');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao desbloquear usuário');
      }
    } catch (error) {
      console.error('Erro ao desbloquear usuário:', error);
      toast.error('Erro ao desbloquear usuário');
    }
  };

  // Função para alterar plano (não utilizada ainda)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const changePlan = async (userId: string, newPlanId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_plan', planId: newPlanId })
      });

      if (response.ok) {
        toast.success('Plano alterado com sucesso');
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao alterar plano');
      }
    } catch (error) {
      console.error('Erro ao alterar plano:', error);
      toast.error('Erro ao alterar plano');
    }
  };

  // Função para enviar notificação
  const sendNotification = async (userId: string, message: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });

      if (response.ok) {
        toast.success('Notificação enviada com sucesso');
      } else {
        const data = await response.json();
        toast.error(data.error || 'Erro ao enviar notificação');
      }
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      toast.error('Erro ao enviar notificação');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Usuários</CardTitle>
          <CardDescription>Carregando lista de usuários...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Usuários</CardTitle>
            <CardDescription>
              {pagination.total} usuários encontrados
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={() => exportReport('csv')}
              disabled={!session?.user}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button
              size="sm"
              onClick={() => exportReport('json')}
              disabled={!session?.user}
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar JSON
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtros */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={subscriptionStatus} onValueChange={setSubscriptionStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status da assinatura" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="active">Ativo</SelectItem>
              <SelectItem value="trialing">Trial</SelectItem>
              <SelectItem value="past_due">Em Atraso</SelectItem>
              <SelectItem value="unpaid">Não Pago</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
              <SelectItem value="paused">Pausado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabela */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Último Pagamento</TableHead>
                <TableHead>Total Pago</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      {user.companyName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.planName}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.planSlug}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(user.subscriptionStatus)}
                  </TableCell>
                  <TableCell>
                    {getRoleBadge(user.role)}
                  </TableCell>
                  <TableCell>
                    {user.lastPaymentDate ? (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        {formatDate(user.lastPaymentDate)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Nunca</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      {formatCurrency(user.totalPaid)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {user.isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => blockUser(user.id)}
                        >
                          <UserX className="w-4 h-4 mr-1" />
                          Bloquear
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => unblockUser(user.id)}
                        >
                          <UserCheck className="w-4 h-4 mr-1" />
                          Desbloquear
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendNotification(user.id, 'Notificação de teste')}
                      >
                        <Mail className="w-4 h-4 mr-1" />
                        Notificar
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-muted-foreground">
              Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
              {pagination.total} usuários
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
                disabled={currentPage === pagination.totalPages}
              >
                Próximo
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}