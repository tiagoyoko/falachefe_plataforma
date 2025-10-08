# 🌐 ÉPICO 4: Integração Completa - Produção e Monitoramento

## 📋 **Resumo do Épico**

**Objetivo**: Finalizar a integração CrewAI com produção completa, incluindo integração com UAZ API, interface de chat, dashboard de métricas e sistema de monitoramento.

**Duração Estimada**: 2 semanas  
**Prioridade**: Crítica  
**Complexidade**: Muito Alta  

---

## 🎯 **Objetivos Específicos**

### **Funcionalidades Principais**
- ✅ Integração completa com UAZ API (WhatsApp)
- ✅ Integração com interface de chat existente
- ✅ Dashboard de métricas e monitoramento
- ✅ Sistema de human-in-the-loop
- ✅ Deploy em produção com rollback automático
- ✅ Monitoramento em tempo real

### **Requisitos Técnicos**
- 🔧 Webhook handler adaptado para CrewAI
- 🔧 Chat interface integrada
- 🔧 Dashboard de métricas completo
- 🔧 Sistema de aprovação humana
- 🔧 Monitoramento e alertas
- 🔧 Sistema de rollback automático

---

## 📊 **User Stories**

### **US-4.1: Integração UAZ API**
```
Como sistema
Quero processar mensagens do WhatsApp via UAZ API
Para que os usuários possam interagir com agentes CrewAI

Critérios de Aceitação:
- [ ] Webhook handler adaptado para CrewAI
- [ ] Processamento de mensagens WhatsApp
- [ ] Respostas enviadas via UAZ API
- [ ] Suporte a mídias (imagens, documentos)
- [ ] Tratamento de erros de API
- [ ] Rate limiting e controle de spam
```

### **US-4.2: Interface de Chat Integrada**
```
Como usuário
Quero usar a interface de chat existente
Para interagir com os agentes CrewAI

Critérios de Aceitação:
- [ ] Chat interface funcionando com CrewAI
- [ ] Indicadores de agente ativo
- [ ] Histórico de conversa preservado
- [ ] Notificações de handoff
- [ ] Suporte a mídias
- [ ] Interface responsiva
```

### **US-4.3: Dashboard de Métricas**
```
Como administrador
Quero visualizar métricas dos agentes CrewAI
Para monitorar performance e custos

Critérios de Aceitação:
- [ ] Dashboard com métricas em tempo real
- [ ] Métricas por crew e agente
- [ ] Análise de custos e tokens
- [ ] Métricas de handoff
- [ ] Performance de resposta
- [ ] Satisfação do usuário
```

### **US-4.4: Human-in-the-Loop**
```
Como sistema
Quero solicitar aprovação humana quando necessário
Para garantir qualidade e segurança

Critérios de Aceitação:
- [ ] Detecção de situações que requerem aprovação
- [ ] Interface de aprovação para humanos
- [ ] Workflow de aprovação configurável
- [ ] Notificações de pendências
- [ ] Logs de aprovações
- [ ] Timeout e fallback automático
```

### **US-4.5: Monitoramento e Alertas**
```
Como operador
Quero receber alertas sobre problemas do sistema
Para manter alta disponibilidade

Critérios de Aceitação:
- [ ] Monitoramento de saúde dos agentes
- [ ] Alertas de performance degradada
- [ ] Alertas de custos excessivos
- [ ] Alertas de falhas de handoff
- [ ] Dashboard de status do sistema
- [ ] Integração com sistemas de alerta
```

---

## 🔧 **Tarefas Técnicas Detalhadas**

### **Sprint 4.1: Integração UAZ e Chat (Semana 1)**

#### **T4.1.1: Webhook Handler Adaptado**
```typescript
// src/app/api/webhook/uaz/route.ts
export async function POST(request: NextRequest) {
  try {
    // 1. Validar webhook UAZ
    const webhookData = await validateUAZWebhook(request);
    
    // 2. Extrair dados da mensagem
    const messageData = extractMessageData(webhookData);
    
    // 3. Chamar CrewAI Orquestrador
    const orchestrator = new FalachefeOrchestrator({
      companyId: messageData.companyId,
      userId: messageData.userId,
      conversationId: messageData.conversationId,
      redisClient: redisClient,
      memorySystem: memorySystem
    });
    
    const response = await orchestrator.processMessage(messageData.text);
    
    // 4. Enviar resposta via UAZ API
    await sendUAZResponse(messageData.userId, response.response);
    
    // 5. Registrar métricas
    await recordMetrics(response.metadata);
    
  } catch (error) {
    await handleWebhookError(error);
  }
}
```

#### **T4.1.2: Chat Interface Adaptada**
```typescript
// src/app/api/chat/route.ts
export async function POST(request: NextRequest) {
  try {
    // 1. Autenticar usuário
    const user = await authenticateUser(request);
    
    // 2. Extrair dados da mensagem
    const { message, conversationId } = await request.json();
    
    // 3. Chamar CrewAI Orquestrador
    const orchestrator = new FalachefeOrchestrator({
      companyId: user.companyId,
      userId: user.id,
      conversationId,
      redisClient: redisClient,
      memorySystem: memorySystem
    });
    
    const response = await orchestrator.processMessage(message);
    
    // 4. Retornar resposta formatada
    return NextResponse.json({
      response: response.response,
      agentId: response.agentId,
      confidence: response.confidence,
      processingTime: response.processingTime,
      metadata: response.metadata
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar mensagem' },
      { status: 500 }
    );
  }
}
```

#### **T4.1.3: Componente de Chat Atualizado**
```typescript
// src/components/chat/chat-interface.tsx
export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const sendMessage = async (text: string) => {
    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, conversationId })
      });
      
      const data = await response.json();
      
      // Adicionar mensagem do usuário
      setMessages(prev => [...prev, {
        id: Date.now(),
        text,
        sender: 'user',
        timestamp: new Date()
      }]);
      
      // Adicionar resposta do agente
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: data.response,
        sender: 'agent',
        agentId: data.agentId,
        confidence: data.confidence,
        timestamp: new Date()
      }]);
      
      // Atualizar agente ativo
      setCurrentAgent(data.agentId);
      
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="chat-interface">
      <div className="agent-indicator">
        Agente Ativo: {currentAgent}
      </div>
      <div className="messages">
        {messages.map(message => (
          <MessageComponent key={message.id} message={message} />
        ))}
      </div>
      <MessageInput onSend={sendMessage} disabled={isProcessing} />
    </div>
  );
}
```

### **Sprint 4.2: Dashboard e Monitoramento (Semana 2)**

#### **T4.2.1: Dashboard de Métricas**
```typescript
// src/app/(dashboard)/dashboard/crews/page.tsx
export default function CrewsDashboard() {
  const [metrics, setMetrics] = useState<CrewMetrics[]>([]);
  const [selectedCrew, setSelectedCrew] = useState<string>('');

  useEffect(() => {
    const fetchMetrics = async () => {
      const response = await fetch('/api/crewai/metrics');
      const data = await response.json();
      setMetrics(data);
    };
    
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Atualizar a cada 30s
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="crews-dashboard">
      <h1>Dashboard CrewAI</h1>
      
      <div className="metrics-grid">
        <MetricCard
          title="Total de Crews Ativas"
          value={metrics.filter(m => m.status === 'active').length}
          trend="+12%"
        />
        <MetricCard
          title="Mensagens Processadas (24h)"
          value={metrics.reduce((sum, m) => sum + m.messages24h, 0)}
          trend="+8%"
        />
        <MetricCard
          title="Taxa de Sucesso"
          value={`${metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length}%`}
          trend="+2%"
        />
        <MetricCard
          title="Custo Total (24h)"
          value={`$${metrics.reduce((sum, m) => sum + m.cost24h, 0).toFixed(2)}`}
          trend="-5%"
        />
      </div>
      
      <div className="crews-list">
        {metrics.map(crew => (
          <CrewCard
            key={crew.id}
            crew={crew}
            selected={selectedCrew === crew.id}
            onSelect={() => setSelectedCrew(crew.id)}
          />
        ))}
      </div>
      
      {selectedCrew && (
        <CrewDetails crewId={selectedCrew} />
      )}
    </div>
  );
}
```

#### **T4.2.2: Sistema de Human-in-the-Loop**
```typescript
// src/app/api/crewai/approval/route.ts
export async function POST(request: NextRequest) {
  try {
    const { taskId, action, approverId, comments } = await request.json();
    
    if (action === 'approve') {
      // Aprovar tarefa e continuar execução
      await approveTask(taskId, approverId, comments);
      
      // Continuar execução do agente
      const task = await getTask(taskId);
      const result = await continueTaskExecution(task);
      
      return NextResponse.json({ 
        status: 'approved',
        result 
      });
      
    } else if (action === 'reject') {
      // Rejeitar tarefa
      await rejectTask(taskId, approverId, comments);
      
      return NextResponse.json({ 
        status: 'rejected',
        message: 'Tarefa rejeitada pelo supervisor'
      });
    }
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Erro ao processar aprovação' },
      { status: 500 }
    );
  }
}
```

#### **T4.2.3: Sistema de Monitoramento**
```typescript
// src/lib/crewai/monitoring-system.ts
export class MonitoringSystem {
  async checkSystemHealth(): Promise<HealthStatus> {
    const checks = await Promise.all([
      this.checkCrewsHealth(),
      this.checkRedisConnection(),
      this.checkDatabaseConnection(),
      this.checkUAZAPI(),
      this.checkOpenAIAPI()
    ]);
    
    return {
      overall: checks.every(c => c.status === 'healthy') ? 'healthy' : 'degraded',
      checks,
      timestamp: new Date()
    };
  }
  
  async sendAlert(alert: Alert): Promise<void> {
    // Enviar alerta via email, Slack, etc.
    await this.notificationService.send(alert);
    
    // Registrar no banco de dados
    await this.alertRepository.create(alert);
  }
  
  async getMetrics(timeRange: DateRange): Promise<SystemMetrics> {
    return {
      responseTime: await this.getAverageResponseTime(timeRange),
      successRate: await this.getSuccessRate(timeRange),
      costPerMessage: await this.getCostPerMessage(timeRange),
      handoffRate: await this.getHandoffRate(timeRange),
      userSatisfaction: await this.getUserSatisfaction(timeRange)
    };
  }
}
```

---

## 🧪 **Critérios de Teste**

### **Testes de Integração**
- [ ] Teste de webhook UAZ completo
- [ ] Teste de chat interface
- [ ] Teste de dashboard de métricas
- [ ] Teste de human-in-the-loop
- [ ] Teste de monitoramento

### **Testes de Performance**
- [ ] Teste de carga com múltiplas empresas
- [ ] Teste de latência de resposta
- [ ] Teste de throughput de mensagens
- [ ] Teste de escalabilidade

### **Testes de Produção**
- [ ] Teste de deploy automático
- [ ] Teste de rollback automático
- [ ] Teste de monitoramento em tempo real
- [ ] Teste de alertas

---

## 📊 **Métricas de Sucesso**

### **Métricas Técnicas**
- ✅ Uptime > 99.9%
- ✅ Tempo de resposta < 3 segundos
- ✅ Taxa de sucesso > 98%
- ✅ Zero perda de mensagens

### **Métricas de Negócio**
- ✅ 20 empresas simultâneas suportadas
- ✅ Redução de 50% no tempo de resposta
- ✅ Aumento de 30% na satisfação do usuário
- ✅ Redução de 25% nos custos operacionais

---

## 🚨 **Riscos e Mitigações**

### **Risco 1: Falha na Integração UAZ**
- **Probabilidade**: Média
- **Impacto**: Crítico
- **Mitigação**: Fallback para sistema legado

### **Risco 2: Performance em Produção**
- **Probabilidade**: Média
- **Impacto**: Alto
- **Mitigação**: Load testing extensivo e auto-scaling

### **Risco 3: Custos Excessivos**
- **Probabilidade**: Baixa
- **Impacto**: Alto
- **Mitigação**: Monitoramento de custos e alertas

---

## 🔗 **Dependências**

### **Dependências dos Épicos Anteriores**
- ✅ Épico 1: Fundação CrewAI
- ✅ Épico 2: Agente Financeiro
- ✅ Épico 3: Sistema de Handoff

### **Dependências Externas**
- UAZ API funcionando
- Interface de chat existente
- Sistema de monitoramento
- Infraestrutura de produção

---

## 📅 **Cronograma Detalhado**

### **Semana 1: Integração UAZ e Chat**
- **Dia 1-2**: Webhook handler e integração UAZ
- **Dia 3-4**: Chat interface adaptada
- **Dia 5**: Testes de integração

### **Semana 2: Dashboard e Monitoramento**
- **Dia 1-2**: Dashboard de métricas
- **Dia 3-4**: Human-in-the-loop e monitoramento
- **Dia 5**: Deploy em produção e testes finais

---

## 🎯 **Entregáveis**

### **Código**
- [ ] Webhook handler UAZ adaptado
- [ ] Chat interface integrada
- [ ] Dashboard de métricas completo
- [ ] Sistema de human-in-the-loop
- [ ] Sistema de monitoramento
- [ ] Scripts de deploy automático

### **Documentação**
- [ ] Guia de deploy em produção
- [ ] Documentação de monitoramento
- [ ] Guia de troubleshooting
- [ ] Runbook de operações

### **Infraestrutura**
- [ ] Ambiente de produção configurado
- [ ] Sistema de monitoramento ativo
- [ ] Alertas configurados
- [ ] Backup e recovery testados

---

## ✅ **Definition of Done**

- [ ] Integração UAZ API funcionando 100%
- [ ] Chat interface integrada e responsiva
- [ ] Dashboard de métricas em tempo real
- [ ] Sistema de human-in-the-loop operacional
- [ ] Monitoramento ativo com alertas
- [ ] Deploy em produção com rollback automático
- [ ] Testes de produção passando
- [ ] Métricas de sucesso atingidas
- [ ] Documentação completa
- [ ] Treinamento da equipe concluído
- [ ] Go-live aprovado

---

## 🚀 **Plano de Deploy**

### **Fase 1: Deploy Gradual**
1. Deploy em 1 empresa piloto
2. Monitoramento intensivo por 48h
3. Ajustes baseados em feedback
4. Deploy em 5 empresas
5. Monitoramento por 1 semana

### **Fase 2: Deploy Completo**
1. Deploy em todas as empresas
2. Monitoramento contínuo
3. Suporte 24/7 por 2 semanas
4. Otimizações baseadas em métricas

---

## 📈 **Pós-Deploy**

### **Monitoramento Contínuo**
- Métricas em tempo real
- Alertas automáticos
- Relatórios diários
- Revisões semanais

### **Otimizações**
- Ajustes de performance
- Otimização de custos
- Melhorias baseadas em feedback
- Novos agentes conforme necessário

---

**Este épico finaliza a integração CrewAI e coloca o sistema em produção com monitoramento completo!** 🌐🚀
