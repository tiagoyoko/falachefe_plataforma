'use client'

import { useState, useEffect } from 'react'
import { useFullUser } from '@/hooks/use-full-user'
import { isSuperAdmin } from '@/lib/auth-utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Play, Square, RefreshCw, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

interface AgentTest {
  id: string
  agentType: string
  message: string
  response: any
  timestamp: Date
  status: 'running' | 'completed' | 'error'
  duration?: number
}

interface AgentInfo {
  id: string
  type: string
  name: string
  description: string
  capabilities: string[]
  status: 'active' | 'inactive' | 'error'
}

export default function PlaygroundPage() {
  const { user, isPending } = useFullUser()
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string>('')
  const [testMessage, setTestMessage] = useState('')
  const [testContext, setTestContext] = useState('{}')
  const [isLoading, setIsLoading] = useState(false)
  const [tests, setTests] = useState<AgentTest[]>([])
  const [showLogs, setShowLogs] = useState(true)
  const [logs, setLogs] = useState<string[]>([])

  // Verificar se usuário é super_admin
  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user || !isSuperAdmin(user.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert className="max-w-md">
          <AlertDescription>
            Acesso negado. Apenas super_admin pode acessar o playground de agentes.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Carregar agentes disponíveis
  useEffect(() => {
    loadAvailableAgents()
  }, [])

  const loadAvailableAgents = async () => {
    try {
      const response = await fetch('/api/admin/agents')
      if (response.ok) {
        const data = await response.json()
        setAgents(data.agents || [])
      }
    } catch (error) {
      console.error('Erro ao carregar agentes:', error)
      toast.error('Erro ao carregar agentes disponíveis')
    }
  }

  const executeAgentTest = async () => {
    if (!selectedAgent || !testMessage.trim()) {
      toast.error('Selecione um agente e digite uma mensagem')
      return
    }

    const testId = `test-${Date.now()}`
    const startTime = Date.now()

    // Adicionar teste em execução
    const newTest: AgentTest = {
      id: testId,
      agentType: selectedAgent,
      message: testMessage,
      response: null,
      timestamp: new Date(),
      status: 'running'
    }

    setTests(prev => [newTest, ...prev])
    setIsLoading(true)
    addLog(`Iniciando teste do agente ${selectedAgent}`)

    try {
      let context = {}
      try {
        context = JSON.parse(testContext)
      } catch {
        context = {}
      }

      const response = await fetch('/api/admin/agents/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agentType: selectedAgent,
          message: testMessage,
          context
        })
      })

      const data = await response.json()
      const duration = Date.now() - startTime

      if (response.ok) {
        // Atualizar teste com sucesso
        setTests(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'completed', response: data, duration }
            : test
        ))
        addLog(`Teste concluído em ${duration}ms`)
        toast.success('Teste executado com sucesso')
      } else {
        // Atualizar teste com erro
        setTests(prev => prev.map(test => 
          test.id === testId 
            ? { ...test, status: 'error', response: data, duration }
            : test
        ))
        addLog(`Erro no teste: ${data.error}`)
        toast.error(`Erro: ${data.error}`)
      }
    } catch (error) {
      const duration = Date.now() - startTime
      setTests(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'error', response: { error: error instanceof Error ? error.message : 'Erro desconhecido' }, duration }
          : test
      ))
      addLog(`Erro de conexão: ${error instanceof Error ? error.message : 'Erro desconhecido'}`)
      toast.error('Erro de conexão')
    } finally {
      setIsLoading(false)
    }
  }

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 99)]) // Manter apenas 100 logs
  }

  const clearTests = () => {
    setTests([])
    addLog('Histórico de testes limpo')
  }

  const clearLogs = () => {
    setLogs([])
  }

  const getStatusBadge = (status: AgentTest['status']) => {
    switch (status) {
      case 'running':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Executando</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Concluído</Badge>
      case 'error':
        return <Badge variant="destructive">Erro</Badge>
    }
  }

  const selectedAgentInfo = agents.find(agent => agent.type === selectedAgent)

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Playground de Agentes</h1>
          <p className="text-muted-foreground">
            Ambiente controlado para testar agentes do sistema
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowLogs(!showLogs)}
          >
            {showLogs ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showLogs ? 'Ocultar' : 'Mostrar'} Logs
          </Button>
          <Button
            variant="outline"
            onClick={loadAvailableAgents}
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </Button>
        </div>
      </div>

      <Tabs defaultValue="test" className="space-y-4">
        <TabsList>
          <TabsTrigger value="test">Teste de Agentes</TabsTrigger>
          <TabsTrigger value="history">Histórico de Testes</TabsTrigger>
          <TabsTrigger value="logs">Logs do Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="test" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Painel de Configuração */}
            <Card>
              <CardHeader>
                <CardTitle>Configuração do Teste</CardTitle>
                <CardDescription>
                  Configure o agente e a mensagem para teste
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Agente</label>
                  <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um agente" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((agent) => (
                        <SelectItem key={agent.id} value={agent.type}>
                          <div className="flex items-center gap-2">
                            <span>{agent.name}</span>
                            <Badge variant={agent.status === 'active' ? 'default' : 'secondary'}>
                              {agent.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedAgentInfo && (
                  <div className="p-3 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">{selectedAgentInfo.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      {selectedAgentInfo.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {selectedAgentInfo.capabilities.map((capability) => (
                        <Badge key={capability} variant="outline" className="text-xs">
                          {capability}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium">Mensagem de Teste</label>
                  <Textarea
                    placeholder="Digite a mensagem para testar o agente..."
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    rows={3}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Contexto (JSON)</label>
                  <Textarea
                    placeholder='{"userId": "123", "sessionId": "abc"}'
                    value={testContext}
                    onChange={(e) => setTestContext(e.target.value)}
                    rows={2}
                  />
                </div>

                <Button
                  onClick={executeAgentTest}
                  disabled={isLoading || !selectedAgent || !testMessage.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Executando...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Executar Teste
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Resultado do Teste */}
            <Card>
              <CardHeader>
                <CardTitle>Resultado do Teste</CardTitle>
                <CardDescription>
                  Resposta do agente será exibida aqui
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tests.length > 0 ? (
                  <div className="space-y-4">
                    {tests.slice(0, 1).map((test) => (
                      <div key={test.id} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {agents.find(a => a.type === test.agentType)?.name || test.agentType}
                            </span>
                            {getStatusBadge(test.status)}
                          </div>
                          {test.duration && (
                            <span className="text-xs text-muted-foreground">
                              {test.duration}ms
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm">
                          <strong>Mensagem:</strong> {test.message}
                        </div>

                        {test.response && (
                          <div className="space-y-2">
                            <strong className="text-sm">Resposta:</strong>
                            <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-64">
                              {JSON.stringify(test.response, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    Execute um teste para ver os resultados aqui
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Histórico de Testes</h3>
            <Button variant="outline" onClick={clearTests}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Histórico
            </Button>
          </div>
          
          <ScrollArea className="h-96">
            <div className="space-y-2">
              {tests.map((test) => (
                <Card key={test.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {agents.find(a => a.type === test.agentType)?.name || test.agentType}
                        </span>
                        {getStatusBadge(test.status)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {test.timestamp.toLocaleString()}
                        {test.duration && ` • ${test.duration}ms`}
                      </div>
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-2">
                      {test.message}
                    </div>

                    {test.response && (
                      <details className="text-xs">
                        <summary className="cursor-pointer hover:text-foreground">
                          Ver resposta completa
                        </summary>
                        <pre className="mt-2 bg-muted p-2 rounded overflow-auto">
                          {JSON.stringify(test.response, null, 2)}
                        </pre>
                      </details>
                    )}
                  </CardContent>
                </Card>
              ))}
              
              {tests.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum teste executado ainda
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Logs do Sistema</h3>
            <Button variant="outline" onClick={clearLogs}>
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Logs
            </Button>
          </div>
          
          <ScrollArea className="h-96">
            <div className="space-y-1">
              {logs.map((log, index) => (
                <div key={index} className="text-xs font-mono bg-muted p-2 rounded">
                  {log}
                </div>
              ))}
              
              {logs.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  Nenhum log disponível
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  )
}
