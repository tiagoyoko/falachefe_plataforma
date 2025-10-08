# Source Tree

## Estrutura de Diretórios Proposta

```
falachefe-crewai/
├── src/
│   ├── lib/
│   │   ├── auth/                      # Sistema de Autenticação
│   │   │   ├── whatsapp-auth.ts       # Autenticação WhatsApp híbrida
│   │   │   ├── verification-code.ts   # Sistema de códigos de verificação
│   │   │   ├── session-manager.ts     # Gerenciamento de sessões WhatsApp
│   │   │   ├── rate-limiter.ts        # Rate limiting e proteção
│   │   │   ├── audit-logger.ts        # Logs de auditoria
│   │   │   └── types.ts               # Tipos de autenticação
│   │   ├── crewai/                    # Sistema CrewAI
│   │   │   ├── orchestrator.ts        # Orquestrador principal
│   │   │   ├── agents/                # Agentes especializados
│   │   │   │   ├── financial-agent.ts # Agente financeiro
│   │   │   │   ├── customer-agent.ts  # Agente de atendimento
│   │   │   │   └── handoff-agent.ts   # Agente de transferência
│   │   │   ├── memory/                # Sistema de memória
│   │   │   │   ├── crew-memory.ts     # Memória de crews
│   │   │   │   ├── context-manager.ts # Gerenciador de contexto
│   │   │   │   └── learning-system.ts # Sistema de aprendizado
│   │   │   ├── tasks/                 # Definições de tarefas
│   │   │   │   ├── task-factory.ts    # Factory de tarefas
│   │   │   │   └── task-templates.ts  # Templates de tarefas
│   │   │   └── tools/                 # Ferramentas dos agentes
│   │   │       ├── uaz-tools.ts       # Ferramentas UAZ
│   │   │       ├── database-tools.ts  # Ferramentas de banco
│   │   │       └── external-tools.ts  # Ferramentas externas
│   │   ├── database/                  # Camada de Dados
│   │   │   ├── schema.ts              # Schema principal
│   │   │   ├── migrations/            # Migrações do banco
│   │   │   │   ├── 0001_crews.sql     # Migração crews
│   │   │   │   ├── 0002_whatsapp_auth.sql # Migração auth WhatsApp
│   │   │   │   └── 0003_metrics.sql   # Migração métricas
│   │   │   └── queries/               # Queries organizadas
│   │   │       ├── crew-queries.ts    # Queries de crews
│   │   │       ├── whatsapp-queries.ts # Queries WhatsApp
│   │   │       ├── session-queries.ts  # Queries de sessão
│   │   │       └── metrics-queries.ts  # Queries de métricas
│   │   ├── api/                       # Integrações Externas
│   │   │   ├── uaz-client.ts          # Cliente UAZ API
│   │   │   ├── openai-client.ts       # Cliente OpenAI
│   │   │   ├── supabase-client.ts     # Cliente Supabase
│   │   │   └── redis-client.ts        # Cliente Redis
│   │   ├── config/                    # Configurações
│   │   │   ├── whatsapp-auth-config.ts # Config auth WhatsApp
│   │   │   ├── crewai-config.ts       # Config CrewAI
│   │   │   ├── database-config.ts     # Config banco de dados
│   │   │   └── environment.ts         # Variáveis de ambiente
│   │   ├── utils/                     # Utilitários
│   │   │   ├── validation.ts          # Validações
│   │   │   ├── encryption.ts          # Criptografia
│   │   │   ├── logging.ts             # Sistema de logs
│   │   │   └── error-handling.ts      # Tratamento de erros
│   │   └── types/                     # Definições de Tipos
│   │       ├── crewai.ts              # Tipos CrewAI
│   │       ├── whatsapp.ts            # Tipos WhatsApp
│   │       ├── database.ts            # Tipos banco de dados
│   │       └── api.ts                 # Tipos APIs externas
│   ├── app/                           # Next.js App Router
│   │   ├── api/                       # API Routes
│   │   │   ├── webhook/               # Webhooks
│   │   │   │   └── uaz/
│   │   │   │       └── route.ts       # Webhook UAZ
│   │   │   ├── auth/                  # Autenticação
│   │   │   │   └── whatsapp/
│   │   │   │       ├── verify/route.ts # Verificar código
│   │   │   │       └── resend/route.ts # Reenviar código
│   │   │   ├── crewai/                # CrewAI APIs
│   │   │   │   ├── process/route.ts   # Processar mensagem
│   │   │   │   ├── status/route.ts    # Status do sistema
│   │   │   │   └── metrics/route.ts   # Métricas
│   │   │   └── admin/                 # Admin APIs
│   │   │       ├── sessions/route.ts  # Gerenciar sessões
│   │   │       └── logs/route.ts      # Logs de auditoria
│   │   ├── (dashboard)/               # Dashboard (grupo de rotas)
│   │   │   └── dashboard/             # Painel administrativo
│   │   │       ├── page.tsx           # Dashboard principal
│   │   │       ├── whatsapp-auth/     # Configurações WhatsApp
│   │   │       │   └── page.tsx       # Config auth WhatsApp
│   │   │       ├── crewai/            # Configurações CrewAI
│   │   │       │   ├── page.tsx       # Config principal
│   │   │       │   ├── agents/page.tsx # Gerenciar agentes
│   │   │       │   └── memory/page.tsx # Configurar memória
│   │   │       ├── analytics/         # Analytics
│   │   │       │   ├── page.tsx       # Dashboard analytics
│   │   │       │   └── reports/page.tsx # Relatórios
│   │   │       └── settings/          # Configurações gerais
│   │   │           └── page.tsx       # Settings
│   │   ├── globals.css                # Estilos globais
│   │   ├── layout.tsx                 # Layout principal
│   │   └── page.tsx                   # Página inicial
│   └── components/                    # Componentes React
│       ├── ui/                        # Componentes base (shadcn/ui)
│       │   ├── button.tsx             # Botão
│       │   ├── input.tsx              # Input
│       │   ├── card.tsx               # Card
│       │   └── ...                    # Outros componentes UI
│       ├── chat/                      # Componentes de Chat
│       │   ├── whatsapp-verification.tsx # Verificação WhatsApp
│       │   ├── session-status.tsx     # Status da sessão
│       │   ├── message-bubble.tsx     # Bolha de mensagem
│       │   └── chat-interface.tsx     # Interface de chat
│       ├── admin/                     # Componentes Admin
│       │   ├── whatsapp-sessions.tsx  # Gerenciar sessões
│       │   ├── crewai-config.tsx      # Config CrewAI
│       │   ├── metrics-dashboard.tsx  # Dashboard métricas
│       │   └── audit-logs.tsx         # Logs de auditoria
│       ├── forms/                     # Formulários
│       │   ├── verification-form.tsx  # Form verificação
│       │   ├── agent-config-form.tsx  # Form config agente
│       │   └── company-settings-form.tsx # Form config empresa
│       └── layout/                    # Componentes de Layout
│           ├── header.tsx             # Cabeçalho
│           ├── sidebar.tsx            # Barra lateral
│           ├── footer.tsx             # Rodapé
│           └── navigation.tsx         # Navegação
├── public/                            # Arquivos estáticos
│   ├── icons/                         # Ícones
│   │   ├── whatsapp.svg               # Ícone WhatsApp
│   │   ├── crewai.svg                 # Ícone CrewAI
│   │   └── logo.svg                   # Logo Falachefe
│   └── images/                        # Imagens
│       ├── auth/                      # Imagens de auth
│       └── dashboard/                 # Imagens dashboard
├── scripts/                           # Scripts utilitários
│   ├── database/                      # Scripts de banco
│   │   ├── migrate.ts                 # Executar migrações
│   │   ├── seed.ts                    # Popular banco
│   │   └── backup.ts                  # Backup banco
│   ├── auth/                          # Scripts de auth
│   │   ├── generate-codes.ts          # Gerar códigos teste
│   │   └── cleanup-sessions.ts        # Limpar sessões
│   └── crewai/                        # Scripts CrewAI
│       ├── test-agents.ts             # Testar agentes
│       └── benchmark.ts               # Benchmark performance
├── tests/                             # Testes
│   ├── unit/                          # Testes unitários
│   │   ├── auth/                      # Testes autenticação
│   │   ├── crewai/                    # Testes CrewAI
│   │   └── utils/                     # Testes utilitários
│   ├── integration/                   # Testes integração
│   │   ├── api/                       # Testes APIs
│   │   ├── webhook/                   # Testes webhooks
│   │   └── database/                  # Testes banco
│   └── e2e/                           # Testes end-to-end
│       ├── whatsapp-auth.spec.ts      # Teste auth WhatsApp
│       └── crewai-flow.spec.ts        # Teste fluxo CrewAI
├── docs/                              # Documentação
│   ├── architecture.md                # Arquitetura (este arquivo)
│   ├── api/                           # Documentação APIs
│   │   ├── whatsapp-auth.md           # API auth WhatsApp
│   │   └── crewai.md                  # API CrewAI
│   ├── deployment/                    # Documentação deploy
│   │   ├── production.md              # Deploy produção
│   │   └── staging.md                 # Deploy staging
│   └── development/                   # Documentação desenvolvimento
│       ├── setup.md                   # Setup ambiente
│       └── contributing.md            # Guia contribuição
├── docker/                            # Docker
│   ├── Dockerfile                     # Dockerfile principal
│   ├── docker-compose.yml             # Compose desenvolvimento
│   ├── docker-compose.prod.yml        # Compose produção
│   └── nginx.conf                     # Configuração Nginx
├── .github/                           # GitHub Actions
│   └── workflows/                     # Workflows CI/CD
│       ├── ci.yml                     # Continuous Integration
│       ├── deploy-staging.yml         # Deploy staging
│       └── deploy-production.yml      # Deploy produção
├── package.json                       # Dependências Node.js
├── tsconfig.json                      # Configuração TypeScript
├── next.config.ts                     # Configuração Next.js
├── tailwind.config.js                 # Configuração Tailwind
├── drizzle.config.ts                  # Configuração Drizzle ORM
├── .env.example                       # Exemplo variáveis ambiente
├── .gitignore                         # Arquivos ignorados Git
└── README.md                          # Documentação principal
```

## Organização por Responsabilidades

### 🔐 **Autenticação (`src/lib/auth/`)**
- **whatsapp-auth.ts**: Lógica principal de autenticação híbrida
- **verification-code.ts**: Sistema de códigos de verificação
- **session-manager.ts**: Gerenciamento de sessões e tokens
- **rate-limiter.ts**: Proteção contra spam e ataques
- **audit-logger.ts**: Logs de auditoria e compliance

### 🤖 **CrewAI (`src/lib/crewai/`)**
- **orchestrator.ts**: Orquestrador principal do sistema
- **agents/**: Agentes especializados por domínio
- **memory/**: Sistema de memória e contexto
- **tasks/**: Definições e templates de tarefas
- **tools/**: Ferramentas disponíveis para agentes

### 🗄️ **Dados (`src/lib/database/`)**
- **schema.ts**: Schema principal do banco
- **migrations/**: Migrações organizadas por versão
- **queries/**: Queries organizadas por domínio

### 🔌 **Integrações (`src/lib/api/`)**
- **uaz-client.ts**: Cliente para UAZ API
- **openai-client.ts**: Cliente para OpenAI
- **supabase-client.ts**: Cliente para Supabase
- **redis-client.ts**: Cliente para Redis

### ⚙️ **Configuração (`src/lib/config/`)**
- **whatsapp-auth-config.ts**: Configurações de autenticação
- **crewai-config.ts**: Configurações CrewAI
- **database-config.ts**: Configurações de banco
- **environment.ts**: Gerenciamento de variáveis

## Estrutura de APIs (`src/app/api/`)

```
api/
├── webhook/uaz/route.ts              # Webhook principal UAZ
├── auth/whatsapp/
│   ├── verify/route.ts               # POST: Verificar código
│   └── resend/route.ts               # POST: Reenviar código
├── crewai/
│   ├── process/route.ts              # POST: Processar mensagem
│   ├── status/route.ts               # GET: Status sistema
│   └── metrics/route.ts              # GET: Métricas
└── admin/
    ├── sessions/route.ts             # CRUD: Sessões WhatsApp
    └── logs/route.ts                 # GET: Logs auditoria
```

## Componentes de Interface (`src/components/`)

```
components/
├── ui/                               # Componentes base (shadcn/ui)
├── chat/                             # Interface de chat
├── admin/                            # Painel administrativo
├── forms/                            # Formulários
└── layout/                           # Layout e navegação
```

## Scripts de Automação (`scripts/`)

```
scripts/
├── database/                         # Scripts de banco de dados
├── auth/                             # Scripts de autenticação
└── crewai/                           # Scripts CrewAI
```

## Testes Organizados (`tests/`)

```
tests/
├── unit/                             # Testes unitários por domínio
├── integration/                      # Testes de integração
└── e2e/                              # Testes end-to-end
```

## Documentação Estruturada (`docs/`)

```
docs/
├── architecture.md                   # Este documento
├── api/                              # Documentação APIs
├── deployment/                       # Guias de deploy
└── development/                      # Guias desenvolvimento
```

## Benefícios desta Estrutura

✅ **Separação Clara**: Cada domínio tem sua pasta dedicada  
✅ **Escalabilidade**: Fácil adicionar novos agentes/ferramentas  
✅ **Manutenibilidade**: Código organizado por responsabilidade  
✅ **Testabilidade**: Estrutura clara para testes  
✅ **Documentação**: Docs organizadas por contexto  
✅ **Deploy**: Scripts e configs separados por ambiente  

**Esta estrutura reflete a arquitetura híbrida de autenticação WhatsApp e o sistema CrewAI integrado. Pronto para prosseguir para a próxima seção?**
