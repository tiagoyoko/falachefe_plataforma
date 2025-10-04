# 🏗️ Arquitetura do Chat-Demo-App

## 📚 **Referências do Exemplo Original**

- **Repositório Agent Squad**: [https://github.com/awslabs/agent-squad](https://github.com/awslabs/agent-squad)
- **Exemplo Chat Demo App**: [https://github.com/awslabs/agent-squad/tree/main/examples/chat-demo-app](https://github.com/awslabs/agent-squad/tree/main/examples/chat-demo-app)
- **README do Exemplo**: [https://github.com/awslabs/agent-squad/blob/main/examples/chat-demo-app/README.md](https://github.com/awslabs/agent-squad/blob/main/examples/chat-demo-app/README.md)

## Diagrama de Arquitetura

```mermaid
graph TB
    subgraph "Frontend (Next.js + React)"
        A[Chat Interface] --> B[WebSocket Client]
        B --> C[Message Handler]
        C --> D[Agent Selector UI]
        E[Connection Status] --> A
        F[Loading States] --> A
        G[Error Handling] --> A
    end
    
    subgraph "Backend (Next.js API Routes)"
        H[WebSocket Server] --> I[Multi-Agent Handler]
        I --> J[Intent Classifier]
        J --> K[Agent Router]
        K --> L[Agent Manager]
        M[Memory System] --> I
        N[Streaming Service] --> I
    end
    
    subgraph "Agent Squad Framework"
        L --> O[Financial Agent]
        L --> P[Find Name Agent]
        L --> Q[Auth Agent]
        L --> R[Sync Agent]
        S[Base Agent] --> O
        S --> P
        S --> Q
        S --> R
    end
    
    subgraph "Data Layer"
        M --> T[Redis Cache]
        M --> U[PostgreSQL DB]
        V[Conversation Context] --> M
        W[Agent Memory] --> M
    end
    
    subgraph "Infrastructure (Docker)"
        X[Next.js Container] --> Y[Redis Container]
        X --> Z[PostgreSQL Container]
        AA[Docker Compose] --> X
        AA --> Y
        AA --> Z
    end
    
    subgraph "External Services"
        BB[External APIs] --> R
        CC[Authentication Service] --> Q
        DD[File Storage] --> R
    end
    
    A --> H
    I --> M
    O --> M
    P --> M
    Q --> M
    R --> M
    X --> H
    Y --> T
    Z --> U
```

## Fluxo de Dados

```mermaid
sequenceDiagram
    participant U as User
    participant C as Chat Interface
    participant W as WebSocket Client
    participant S as WebSocket Server
    participant M as Multi-Agent Handler
    participant I as Intent Classifier
    participant R as Agent Router
    participant A as Agent
    participant D as Database
    
    U->>C: Digite mensagem
    C->>W: Enviar mensagem
    W->>S: WebSocket message
    S->>M: Processar mensagem
    M->>I: Classificar intenção
    I->>R: Selecionar agente
    R->>A: Rotear para agente
    A->>D: Consultar/Atualizar dados
    D->>A: Retornar dados
    A->>M: Resposta do agente
    M->>S: Enviar resposta
    S->>W: WebSocket response
    W->>C: Atualizar UI
    C->>U: Mostrar resposta
```

## Componentes Detalhados

### 1. **Frontend Layer**
- **Chat Interface**: Interface principal do usuário
- **WebSocket Client**: Cliente para comunicação em tempo real
- **Message Handler**: Gerenciamento de mensagens
- **Agent Selector UI**: Interface para seleção de agentes
- **Connection Status**: Indicador de status da conexão
- **Loading States**: Estados de carregamento
- **Error Handling**: Tratamento de erros

### 2. **Backend Layer**
- **WebSocket Server**: Servidor WebSocket
- **Multi-Agent Handler**: Orquestrador principal
- **Intent Classifier**: Classificador de intenções
- **Agent Router**: Roteador de agentes
- **Agent Manager**: Gerenciador de agentes
- **Memory System**: Sistema de memória
- **Streaming Service**: Serviço de streaming

### 3. **Agent Squad Framework**
- **Base Agent**: Classe base para todos os agentes
- **Financial Agent**: Agente para gestão financeira
- **Find Name Agent**: Agente para busca de nomes
- **Auth Agent**: Agente para autenticação
- **Sync Agent**: Agente para sincronização

### 4. **Data Layer**
- **Redis Cache**: Cache em memória
- **PostgreSQL DB**: Banco de dados principal
- **Conversation Context**: Contexto da conversa
- **Agent Memory**: Memória dos agentes

### 5. **Infrastructure**
- **Docker Containers**: Containerização
- **Docker Compose**: Orquestração de containers
- **External Services**: Serviços externos

## Tecnologias Utilizadas

### **Frontend**
- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- WebSocket API
- Lucide React (ícones)

### **Backend**
- Next.js API Routes
- WebSocket Server
- Agent Squad Framework
- Node.js 18

### **Data**
- Redis 7
- PostgreSQL 15
- Prisma ORM

### **Infrastructure**
- Docker
- Docker Compose
- Nginx (proxy reverso)

### **Monitoring**
- Prometheus
- Grafana
- Winston (logging)

## Configuração de Desenvolvimento

### **Pré-requisitos**
- Node.js 18+
- Docker
- Docker Compose
- Git

### **Instalação**
```bash
# Clone do repositório
git clone <repository-url>
cd chat-demo-app

# Instalação de dependências
npm install

# Configuração do ambiente
cp .env.example .env.local

# Inicialização dos containers
docker-compose up -d

# Execução da aplicação
npm run dev
```

### **Scripts Disponíveis**
```bash
# Desenvolvimento
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Build da aplicação
npm run start        # Inicia servidor de produção
npm run lint         # Executa linter
npm run test         # Executa testes
npm run test:watch   # Executa testes em modo watch

# Docker
docker-compose up -d     # Inicia containers
docker-compose down      # Para containers
docker-compose logs -f   # Visualiza logs
docker-compose build    # Build das imagens

# Database
npm run db:migrate      # Executa migrações
npm run db:seed         # Popula banco com dados de teste
npm run db:reset        # Reseta banco de dados
```

## Configuração de Produção

### **Variáveis de Ambiente**
```bash
# Aplicação
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
REDIS_URL=redis://host:6379

# Autenticação
JWT_SECRET=your-jwt-secret
NEXTAUTH_SECRET=your-nextauth-secret
NEXTAUTH_URL=https://your-domain.com

# Agent Squad
AGENT_SQUAD_API_KEY=your-api-key
AGENT_SQUAD_ENDPOINT=https://api.agentsquad.com

# Monitoring
PROMETHEUS_ENDPOINT=http://prometheus:9090
GRAFANA_ENDPOINT=http://grafana:3000
```

### **Deploy**
```bash
# Build da aplicação
npm run build

# Build das imagens Docker
docker-compose -f docker-compose.prod.yml build

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Verificação
docker-compose -f docker-compose.prod.yml ps
```

## Monitoramento e Logs

### **Métricas**
- **Performance**: Tempo de resposta, throughput
- **Business**: Agentes mais usados, intenções comuns
- **Technical**: Uso de memória, CPU, conexões

### **Logs**
- **Application**: Logs da aplicação
- **Agent**: Logs dos agentes
- **WebSocket**: Logs de conexões
- **Database**: Logs de queries

### **Alertas**
- **High Error Rate**: Taxa de erro alta
- **Slow Response**: Resposta lenta
- **Memory Usage**: Uso alto de memória
- **Connection Drops**: Quedas de conexão

## Segurança

### **Autenticação**
- JWT tokens
- Session management
- Password hashing

### **Autorização**
- Role-based access
- Permission checks
- API rate limiting

### **Data Protection**
- Encryption at rest
- Encryption in transit
- PII protection

### **Network Security**
- HTTPS only
- CORS configuration
- Firewall rules

## Escalabilidade

### **Horizontal Scaling**
- Load balancer
- Multiple instances
- Database sharding

### **Vertical Scaling**
- Resource optimization
- Memory management
- CPU optimization

### **Caching**
- Redis caching
- CDN for static assets
- Database query caching

## Backup e Recovery

### **Database Backup**
- Daily automated backups
- Point-in-time recovery
- Cross-region replication

### **Application Backup**
- Code repository
- Configuration files
- Environment variables

### **Disaster Recovery**
- Multi-region deployment
- Failover procedures
- Recovery time objectives
