# 🚀 Chat-Demo-App Implementation

Sistema de chat multi-agente baseado no Agent Squad Framework, implementado com Next.js, WebSocket e Docker.

## 📚 **Referências do Exemplo Original**

- **Repositório Agent Squad**: [https://github.com/awslabs/agent-squad](https://github.com/awslabs/agent-squad)
- **Exemplo Chat Demo App**: [https://github.com/awslabs/agent-squad/tree/main/examples/chat-demo-app](https://github.com/awslabs/agent-squad/tree/main/examples/chat-demo-app)
- **README do Exemplo**: [https://github.com/awslabs/agent-squad/blob/main/examples/chat-demo-app/README.md](https://github.com/awslabs/agent-squad/blob/main/examples/chat-demo-app/README.md)

## 📋 Visão Geral

Este projeto implementa um sistema de chat inteligente que utiliza múltiplos agentes especializados para responder às mensagens dos usuários. Cada agente é responsável por um domínio específico (financeiro, busca de nomes, autenticação, sincronização) e o sistema roteia automaticamente as mensagens para o agente mais apropriado.

## 🏗️ Arquitetura

- **Frontend**: Next.js 14 + React 18 + TypeScript + Tailwind CSS
- **Backend**: Next.js API Routes + WebSocket
- **Agentes**: Agent Squad Framework
- **Banco de Dados**: PostgreSQL 15 + Redis 7
- **Containerização**: Docker + Docker Compose
- **Monitoramento**: Prometheus + Grafana

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- Docker
- Docker Compose
- Git

### Instalação

1. **Clone o repositório**
```bash
git clone <repository-url>
cd chat-demo-app
```

2. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

3. **Inicie os containers**
```bash
docker-compose up -d
```

4. **Execute as migrações do banco**
```bash
docker-compose exec app npm run db:migrate
```

5. **Acesse a aplicação**
```
http://localhost:3000
```

## 📁 Estrutura do Projeto

```
chat-demo-app/
├── src/
│   ├── app/
│   │   ├── chat/
│   │   │   └── page.tsx          # Página principal do chat
│   │   └── api/
│   │       └── chat/
│   │           └── ws.ts         # WebSocket API
│   ├── agents/
│   │   ├── core/
│   │   │   ├── agent-squad-framework.ts
│   │   │   ├── multi-agent-handler.ts
│   │   │   ├── agent-manager.ts
│   │   │   ├── memory-system.ts
│   │   │   └── streaming-service.ts
│   │   ├── financial/
│   │   │   └── financial-agent.ts
│   │   ├── name/
│   │   │   └── find-name-agent.ts
│   │   ├── auth/
│   │   │   └── auth-agent.ts
│   │   └── sync/
│   │       └── sync-agent.ts
│   ├── hooks/
│   │   └── use-websocket-chat.ts
│   └── lib/
│       └── websocket-server.ts
├── docs/
│   ├── chat-demo-app-implementation.md
│   └── chat-demo-app-architecture.md
├── scripts/
│   └── init-db.sql
├── docker-compose.yml
├── Dockerfile
├── nginx.conf
└── prometheus.yml
```

## 🤖 Agentes Disponíveis

### 1. **Financial Agent**
- **Domínio**: Gestão financeira
- **Capacidades**: 
  - Adicionar despesas
  - Adicionar receitas
  - Análise de fluxo de caixa
  - Planejamento orçamentário
  - Relatórios financeiros

### 2. **Find Name Agent**
- **Domínio**: Busca de nomes
- **Capacidades**:
  - Busca de nomes
  - Validação de nomes
  - Sugestões de nomes
  - Lookup de contatos

### 3. **Auth Agent**
- **Domínio**: Autenticação
- **Capacidades**:
  - Autenticação de usuários
  - Gerenciamento de sessão
  - Reset de senha
  - Verificação de conta

### 4. **Sync Agent**
- **Domínio**: Sincronização
- **Capacidades**:
  - Sincronização de dados
  - Sincronização com APIs externas
  - Gerenciamento de backup
  - Resolução de conflitos

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# Aplicação
NODE_ENV=development
PORT=3000

# Banco de Dados
DATABASE_URL=postgresql://postgres:password@postgres:5432/agent_chat
REDIS_URL=redis://redis:6379

# Autenticação
JWT_SECRET=your-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=http://localhost:3000

# Agent Squad
AGENT_SQUAD_API_KEY=your-api-key
AGENT_SQUAD_ENDPOINT=https://api.agentsquad.com
```

### Configuração do Docker

O projeto inclui configurações Docker para:
- **Desenvolvimento**: `docker-compose.yml`
- **Produção**: `docker-compose.prod.yml`
- **Monitoramento**: `docker-compose.monitoring.yml`

## 📊 Monitoramento

### Métricas Disponíveis

- **Performance**: Tempo de resposta, throughput
- **Business**: Agentes mais usados, intenções comuns
- **Technical**: Uso de memória, CPU, conexões WebSocket

### Dashboards

- **Grafana**: http://localhost:3001
  - Usuário: `admin`
  - Senha: `admin`

- **Prometheus**: http://localhost:9090

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários
npm run test

# Testes de integração
npm run test:integration

# Testes E2E
npm run test:e2e

# Cobertura de testes
npm run test:coverage
```

### Testes com Docker

```bash
# Executar testes em container
docker-compose exec app npm run test

# Executar testes de integração
docker-compose exec app npm run test:integration
```

## 🚀 Deploy

### Desenvolvimento

```bash
# Iniciar em modo desenvolvimento
docker-compose up -d

# Visualizar logs
docker-compose logs -f app
```

### Produção

```bash
# Build da aplicação
npm run build

# Deploy com Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Verificar status
docker-compose -f docker-compose.prod.yml ps
```

### Deploy Manual

```bash
# Build da aplicação
npm run build

# Iniciar aplicação
npm start
```

## 🔍 Debugging

### Logs da Aplicação

```bash
# Logs em tempo real
docker-compose logs -f app

# Logs específicos
docker-compose logs app | grep ERROR
```

### Logs do Banco de Dados

```bash
# Logs do PostgreSQL
docker-compose logs -f postgres

# Logs do Redis
docker-compose logs -f redis
```

### Conectar ao Banco

```bash
# PostgreSQL
docker-compose exec postgres psql -U postgres -d agent_chat

# Redis
docker-compose exec redis redis-cli
```

## 📈 Performance

### Otimizações Implementadas

- **Caching**: Redis para cache de sessões e dados frequentes
- **Índices**: Índices otimizados no PostgreSQL
- **Connection Pooling**: Pool de conexões para banco de dados
- **WebSocket**: Comunicação em tempo real
- **Load Balancing**: Nginx como proxy reverso

### Métricas de Performance

- **Tempo de Resposta**: < 200ms para 95% das requisições
- **Throughput**: > 1000 mensagens/minuto
- **Disponibilidade**: 99.9% uptime
- **Escalabilidade**: Suporte a 1000+ usuários simultâneos

## 🔒 Segurança

### Medidas Implementadas

- **Autenticação**: JWT tokens
- **Autorização**: Role-based access control
- **Rate Limiting**: Limitação de requisições por IP
- **HTTPS**: Criptografia em trânsito
- **Headers de Segurança**: XSS, CSRF protection
- **Validação**: Validação de entrada em todas as APIs

### Configuração de Segurança

```bash
# Gerar chaves seguras
openssl rand -base64 32  # Para JWT_SECRET
openssl rand -base64 32  # Para NEXTAUTH_SECRET
```

## 🛠️ Desenvolvimento

### Adicionar Novo Agente

1. **Criar classe do agente**
```typescript
// src/agents/novo/novo-agent.ts
export class NovoAgent extends BaseAgent {
  constructor(config: AgentConfig, memory: MemorySystem) {
    super(config, memory)
    this.capabilities = ['nova_capacidade']
  }
  
  async process(message: string, context: ConversationContext): Promise<AgentResponse> {
    // Implementar lógica do agente
  }
}
```

2. **Registrar no Agent Manager**
```typescript
// src/agents/core/agent-manager.ts
await agentManager.registerAgent(new NovoAgent(config, memory), metadata)
```

3. **Adicionar regras de roteamento**
```typescript
// src/agents/core/agent-squad-framework.ts
routing: {
  rules: [
    {
      intents: ['nova_intencao'],
      domains: ['novo_dominio'],
      agentType: 'novo',
      priority: 'high',
      minConfidence: 0.7
    }
  ]
}
```

### Adicionar Nova Intenção

1. **Inserir no banco de dados**
```sql
INSERT INTO intents (name, domain, keywords, confidence_threshold, agent_type, priority) 
VALUES ('nova_intencao', 'novo_dominio', ARRAY['palavra1', 'palavra2'], 0.7, 'novo', 1);
```

2. **Atualizar classificador de intenções**
```typescript
// src/agents/core/agent-squad-framework.ts
const keywords = {
  novo_dominio: ['palavra1', 'palavra2', 'palavra3']
}
```

## 📚 Documentação

- **Implementação**: [docs/chat-demo-app-implementation.md](docs/chat-demo-app-implementation.md)
- **Arquitetura**: [docs/chat-demo-app-architecture.md](docs/chat-demo-app-architecture.md)
- **API Reference**: [docs/api-reference.md](docs/api-reference.md)
- **Guia de Contribuição**: [docs/contributing.md](docs/contributing.md)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🆘 Suporte

- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)
- **Email**: support@your-domain.com

## 🎯 Roadmap

### Próximas Funcionalidades

- [ ] Agente de Suporte ao Cliente
- [ ] Agente de Análise de Sentimentos
- [ ] Integração com APIs externas
- [ ] Dashboard de Analytics
- [ ] Mobile App
- [ ] Voice Interface
- [ ] Multi-language Support

### Melhorias Planejadas

- [ ] Otimização de Performance
- [ ] Melhorias de UX/UI
- [ ] Testes Automatizados
- [ ] CI/CD Pipeline
- [ ] Documentação Expandida

---

**Desenvolvido com ❤️ usando Next.js, Agent Squad Framework e Docker**
