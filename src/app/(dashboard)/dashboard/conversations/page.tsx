"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  MessageSquare, 
  Search, 
  Filter, 
  MoreHorizontal,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  Bot,
  ArrowRight
} from "lucide-react";

export default function ConversationsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const conversations = [
    {
      id: 1,
      user: {
        name: "João Silva",
        phone: "+55 11 99999-9999",
        avatar: "👤"
      },
      agent: "Agente de Vendas",
      status: "active",
      lastMessage: "Gostaria de saber mais sobre os planos disponíveis",
      timestamp: "2 min atrás",
      messageCount: 8,
      priority: "high"
    },
    {
      id: 2,
      user: {
        name: "Maria Santos",
        phone: "+55 11 88888-8888",
        avatar: "👩"
      },
      agent: "Agente de Suporte",
      status: "resolved",
      lastMessage: "Problema resolvido, obrigada pela ajuda!",
      timestamp: "15 min atrás",
      messageCount: 12,
      priority: "medium"
    },
    {
      id: 3,
      user: {
        name: "Pedro Costa",
        phone: "+55 11 77777-7777",
        avatar: "👨"
      },
      agent: "Agente de Marketing",
      status: "waiting",
      lastMessage: "Aguardando informações sobre a campanha",
      timestamp: "1 hora atrás",
      messageCount: 5,
      priority: "low"
    },
    {
      id: 4,
      user: {
        name: "Ana Oliveira",
        phone: "+55 11 66666-6666",
        avatar: "👩‍💼"
      },
      agent: "Agente Financeiro",
      status: "active",
      lastMessage: "Preciso de ajuda com o pagamento",
      timestamp: "30 min atrás",
      messageCount: 3,
      priority: "high"
    },
    {
      id: 5,
      user: {
        name: "Carlos Mendes",
        phone: "+55 11 55555-5555",
        avatar: "👨‍💻"
      },
      agent: "Agente de Suporte",
      status: "closed",
      lastMessage: "Conversa encerrada pelo usuário",
      timestamp: "2 horas atrás",
      messageCount: 15,
      priority: "medium"
    }
  ];

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         conv.user.phone.includes(searchTerm) ||
                         conv.agent.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus === "all" || conv.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <div className="w-2 h-2 bg-green-500 rounded-full" />;
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'waiting':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'closed':
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativa';
      case 'resolved':
        return 'Resolvida';
      case 'waiting':
        return 'Aguardando';
      case 'closed':
        return 'Fechada';
      default:
        return status;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      case 'low':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conversas</h1>
          <p className="text-muted-foreground">
            Gerencie todas as conversas dos seus agentes
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar conversas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {['all', 'active', 'resolved', 'waiting', 'closed'].map((status) => (
            <Button
              key={status}
              variant={selectedStatus === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedStatus(status)}
            >
              {status === 'all' ? 'Todas' : getStatusText(status)}
            </Button>
          ))}
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
            <div className="text-2xl font-bold">
              {conversations.filter(c => c.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> em relação ao mês passado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidas Hoje</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations.filter(c => c.status === 'resolved').length}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8%</span> em relação a ontem
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {conversations.filter(c => c.status === 'waiting').length}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-yellow-600">+2</span> esta hora
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3.2min</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">-0.5min</span> esta semana
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Conversations List */}
      <div className="space-y-4">
        {filteredConversations.map((conversation) => (
          <Card key={conversation.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="text-2xl">{conversation.user.avatar}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{conversation.user.name}</h3>
                      <Badge variant={getPriorityColor(conversation.priority)}>
                        {conversation.priority === 'high' ? 'Alta' : 
                         conversation.priority === 'medium' ? 'Média' : 'Baixa'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <Phone className="h-3 w-3" />
                      <span>{conversation.user.phone}</span>
                      <span>•</span>
                      <span>{conversation.agent}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{conversation.lastMessage}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusIcon(conversation.status)}
                      <span className="text-sm font-medium">
                        {getStatusText(conversation.status)}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {conversation.timestamp}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {conversation.messageCount} mensagens
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredConversations.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma conversa encontrada</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedStatus !== 'all' 
                ? 'Tente ajustar os filtros de busca.' 
                : 'As conversas aparecerão aqui quando os usuários iniciarem contato.'}
            </p>
            {(searchTerm || selectedStatus !== 'all') && (
              <Button variant="outline" onClick={() => {
                setSearchTerm('');
                setSelectedStatus('all');
              }}>
                Limpar Filtros
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
