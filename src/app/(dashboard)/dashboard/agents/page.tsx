"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Bot, 
  Plus, 
  Search, 
  Settings, 
  Play, 
  Pause, 
  Edit, 
  Trash2,
  MessageSquare,
  Users,
  BarChart3,
  MoreHorizontal
} from "lucide-react";

export default function AgentsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const agents = [
    {
      id: 1,
      name: "Agente de Vendas",
      description: "Especializado em prospecção e fechamento de vendas",
      status: "active",
      conversations: 156,
      resolution: 92,
      avgTime: "3.2min",
      lastActive: "2 min atrás",
      type: "Vendas",
      avatar: "🤖"
    },
    {
      id: 2,
      name: "Agente de Suporte",
      description: "Atendimento ao cliente e resolução de problemas",
      status: "active",
      conversations: 234,
      resolution: 96,
      avgTime: "2.8min",
      lastActive: "5 min atrás",
      type: "Suporte",
      avatar: "🛠️"
    },
    {
      id: 3,
      name: "Agente de Marketing",
      description: "Campanhas promocionais e engajamento",
      status: "paused",
      conversations: 89,
      resolution: 88,
      avgTime: "4.1min",
      lastActive: "1 hora atrás",
      type: "Marketing",
      avatar: "📢"
    },
    {
      id: 4,
      name: "Agente Financeiro",
      description: "Cobrança e gestão de pagamentos",
      status: "active",
      conversations: 67,
      resolution: 94,
      avgTime: "2.5min",
      lastActive: "10 min atrás",
      type: "Financeiro",
      avatar: "💰"
    }
  ];

  const filteredAgents = agents.filter(agent =>
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agentes</h1>
          <p className="text-muted-foreground">
            Gerencie seus agentes de IA especializados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Novo Agente
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar agentes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Settings className="mr-2 h-4 w-4" />
          Filtros
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Agentes</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{agents.length}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+1</span> este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes Ativos</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.filter(a => a.status === 'active').length}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2</span> esta semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversas Totais</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agents.reduce((sum, agent) => sum + agent.conversations, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+15%</span> este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Média de Resolução</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(agents.reduce((sum, agent) => sum + agent.resolution, 0) / agents.length)}%
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+2.1%</span> este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Agents Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAgents.map((agent) => (
          <Card key={agent.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{agent.avatar}</div>
                  <div>
                    <CardTitle className="text-lg">{agent.name}</CardTitle>
                    <CardDescription>{agent.type}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">{agent.description}</p>
              
              <div className="flex items-center justify-between">
                <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                  {agent.status === 'active' ? 'Ativo' : 'Pausado'}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Ativo: {agent.lastActive}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-semibold">{agent.conversations}</div>
                  <div className="text-xs text-muted-foreground">Conversas</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{agent.resolution}%</div>
                  <div className="text-xs text-muted-foreground">Resolução</div>
                </div>
                <div>
                  <div className="text-lg font-semibold">{agent.avgTime}</div>
                  <div className="text-xs text-muted-foreground">Tempo Médio</div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  disabled={agent.status === 'active'}
                >
                  {agent.status === 'active' ? (
                    <>
                      <Pause className="mr-2 h-4 w-4" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Ativar
                    </>
                  )}
                </Button>
                <Button variant="outline" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredAgents.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Bot className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum agente encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? 'Tente ajustar os termos de busca.' : 'Comece criando seu primeiro agente.'}
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Agente
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
