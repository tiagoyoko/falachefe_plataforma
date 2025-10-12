# 🌐 Chat Web + CrewAI - Documentação Completa

## 📋 Visão Geral

O projeto **Falachefe** possui um sistema completo de chat web integrado com agentes CrewAI via Docker, permitindo que usuários interajam com assistentes de IA especializados através de uma interface web moderna.

## 🏗️ Arquitetura

### Componentes

```
┌─────────────────────────────────────────────────────────┐
│  1. INTERFACE WEB                                       │
│     • Localização: /src/app/chat/page.tsx              │
│     • URL: http://localhost:3000/chat                   │
│     • Tecnologia: Next.js 14 + React 18                │
│     • Features: Markdown, Code Highlight, Copy          │
└──────────────────────┬──────────────────────────────────┘
                       │ POST /api/chat
                       ▼
┌─────────────────────────────────────────────────────────┐
│  2. NEXT.JS API ENDPOINT                                │
│     • Localização: /src/app/api/chat/route.ts          │
│     • Validações: userId, message                       │
│     • Timeout: 120s                                     │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTP Request
                       ▼
┌─────────────────────────────────────────────────────────┐
│  3. DOCKER COMPOSE STACK                                │
│                                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │  NGINX (Reverse Proxy)                            │ │
│  │  • Porta: 80/443                                  │ │
│  │  • SSL/TLS                                        │ │
│  │  • Load Balancing                                 │ │
│  └───────────────────┬───────────────────────────────┘ │
│                      │                                  │
│  ┌───────────────────▼───────────────────────────────┐ │
│  │  CREWAI FLASK API                                 │ │
│  │  • Porta: 8000                                    │ │
│  │  • Arquivo: api_server.py                         │ │
│  │  • Gunicorn: 2 workers, 4 threads                 │ │
│  │  • Timeout: 120s                                  │ │
│  │  • Endpoints:                                     │ │
│  │    - POST /process (processar mensagem)           │ │
│  │    - GET /health (health check)                   │ │
│  └───────┬──────────────────────────┬────────────────┘ │
│          │                          │                   │
│  ┌───────▼──────┐        ┌──────────▼────────────┐    │
│  │  REDIS       │        │  POSTGRESQL            │    │
│  │  • Porta:    │        │  • Porta: 5432         │    │
│  │    6379      │        │  • Database: falachefe │    │
│  │  • Cache     │        │  • Persistência        │    │
│  └──────────────┘        └────────────────────────┘    │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │  PROMETHEUS + GRAFANA                           │   │
│  │  • Prometheus: 9090                             │   │
│  │  • Grafana: 3001                                │   │
│  │  • Métricas e Dashboards                        │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

1. **Usuário** envia mensagem na interface web
2. **Hook** `useAgentChat` faz POST para `/api/chat`
3. **Endpoint** `/api/chat` valida e encaminha para API Flask
4. **API Flask** recebe em `/process` e inicializa `FalachefeCrew`
5. **CrewAI** orquestra agentes especializados
6. **Resposta** volta pela stack até a interface web

## 🚀 Como Usar

### Início Rápido (Automatizado)

```bash
# Um único comando para subir tudo!
./scripts/start-chat-web-docker.sh
```

O script automatiza:
- ✅ Verifica pré-requisitos
- ✅ Sobe stack Docker
- ✅ Configura Next.js
- ✅ Health checks
- ✅ Inicia servidor de desenvolvimento

### Início Manual

#### 1. Configurar CrewAI Docker

```bash
cd crewai-projects/falachefe_crew

# Criar .env com suas credenciais
cp .env.example .env
nano .env

# Subir containers
docker-compose up -d --build

# Verificar status
docker-compose ps
docker-compose logs -f crewai-api
```

#### 2. Configurar Next.js

```bash
cd /Users/tiagoyokoyama/Falachefe

# Adicionar variável de ambiente
echo "CREWAI_API_URL=http://localhost:8000/process" >> .env.local

# Instalar dependências
npm install

# Iniciar servidor
npm run dev
```

#### 3. Acessar

- **Chat Web**: http://localhost:3000/chat
- **CrewAI API**: http://localhost:8000
- **Grafana**: http://localhost:3001
- **Prometheus**: http://localhost:9090

## 🧪 Testes

### Teste 1: Health Checks

```bash
# CrewAI API
curl http://localhost:8000/health

# Next.js Chat Endpoint
curl http://localhost:3000/api/chat
```

### Teste 2: Processar Mensagem

```bash
curl -X POST http://localhost:8000/process \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "Qual é o meu saldo?",
    "user_id": "test-user",
    "phone_number": "+5511999999999"
  }'
```

### Teste 3: Chat Integrado

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá! Qual é o meu saldo?",
    "userId": "test-user"
  }'
```

### Teste 4: Interface Web

1. Abra: http://localhost:3000/chat
2. Faça login
3. Digite uma mensagem
4. Aguarde resposta (~10-30s)

### Teste 5: Script Automatizado

```bash
./scripts/testing/test-web-chat.sh local
```

## 📁 Estrutura de Arquivos

```
falachefe/
├── src/
│   ├── app/
│   │   ├── chat/
│   │   │   └── page.tsx              # Interface web do chat
│   │   └── api/
│   │       └── chat/
│   │           └── route.ts          # Endpoint Next.js
│   └── hooks/
│       └── use-agent-chat.ts         # Hook React para chat
│
├── crewai-projects/
│   └── falachefe_crew/
│       ├── Dockerfile                # Container CrewAI
│       ├── docker-compose.yml        # Orquestração completa
│       ├── api_server.py             # Flask API
│       ├── webhook_processor.py      # Processador CrewAI
│       └── src/
│           └── falachefe_crew/
│               ├── crew.py           # Definição da crew
│               ├── config/
│               │   ├── agents.yaml   # Configuração dos agentes
│               │   └── tasks.yaml    # Configuração das tarefas
│               └── tools/            # Ferramentas customizadas
│
├── scripts/
│   ├── start-chat-web-docker.sh      # Script de setup automático
│   └── testing/
│       └── test-web-chat.sh          # Testes automatizados
│
└── docs/
    └── technical/
        └── chat-web-crewai-integration.md  # Documentação técnica
```

## 🔧 Configuração

### Variáveis de Ambiente

#### CrewAI (`.env`)

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-...

# UAZAPI (WhatsApp)
UAZAPI_BASE_URL=https://falachefe.uazapi.com
UAZAPI_TOKEN=...
UAZAPI_ADMIN_TOKEN=...

# Database
POSTGRES_DB=falachefe
POSTGRES_USER=crewai
POSTGRES_PASSWORD=...

# Redis
REDIS_PASSWORD=...

# Workers
GUNICORN_WORKERS=2
GUNICORN_THREADS=4
GUNICORN_TIMEOUT=120
```

#### Next.js (`.env.local`)

```bash
# CrewAI API
CREWAI_API_URL=http://localhost:8000/process

# Outros...
DATABASE_URL=...
NEXTAUTH_SECRET=...
```

## 📊 Monitoramento

### Métricas Disponíveis

- **Prometheus**: http://localhost:9090
  - Métricas de sistema
  - Métricas de aplicação
  - Health checks

- **Grafana**: http://localhost:3001
  - Dashboards visuais
  - Alertas configuráveis
  - Análise de performance

### Logs

```bash
# Todos os serviços
docker-compose -f crewai-projects/falachefe_crew/docker-compose.yml logs -f

# CrewAI API apenas
docker-compose -f crewai-projects/falachefe_crew/docker-compose.yml logs -f crewai-api

# Últimas 100 linhas
docker-compose -f crewai-projects/falachefe_crew/docker-compose.yml logs --tail=100 crewai-api
```

## 🚀 Deploy

### Desenvolvimento

✅ **Funciona perfeitamente**:
- Docker Compose local
- Todos os serviços integrados
- Hot reload do Next.js
- Health checks automáticos

### Produção

#### Opção A: VPS com Docker

```bash
# Servidor (Hetzner, DigitalOcean, AWS EC2)
ssh user@server

# Clone e configure
git clone repo
cd falachefe/crewai-projects/falachefe_crew
nano .env

# Deploy
docker-compose up -d
```

#### Opção B: Railway.app

```bash
cd crewai-projects/falachefe_crew
railway up
```

#### Opção C: Google Cloud Run

```bash
# Build e push
docker build -t gcr.io/projeto/crewai-api .
docker push gcr.io/projeto/crewai-api

# Deploy
gcloud run deploy --image gcr.io/projeto/crewai-api
```

## 🐛 Troubleshooting

### Porta em uso

```bash
# Verificar e matar processo
lsof -i :8000
kill -9 PID
```

### Container não inicia

```bash
# Verificar logs
docker-compose logs crewai-api

# Rebuild
docker-compose build --no-cache crewai-api
docker-compose up -d
```

### Timeout

```bash
# Aumentar timeout no docker-compose.yml
environment:
  - GUNICORN_TIMEOUT=300
```

### Out of Memory

```yaml
# docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G
```

## 📚 Documentação Adicional

- [Guia Completo Docker](./GUIA-CHAT-WEB-DOCKER.md)
- [Documentação Técnica](./docs/technical/chat-web-crewai-integration.md)
- [Integração CrewAI](./docs/business/crewai_falachefe_integracao.md)
- [Arquivos README do CrewAI](./crewai-projects/falachefe_crew/README*.md)

## 🎯 Status Atual

| Componente | Status | Notas |
|------------|--------|-------|
| Interface Web | ✅ Completo | React + Markdown |
| Endpoint `/api/chat` | ✅ Completo | Validações OK |
| Docker Compose | ✅ Completo | 6 serviços |
| CrewAI Flask API | ✅ Completo | Gunicorn |
| Integração | ✅ Completo | End-to-end |
| Testes | ✅ Completo | Scripts automáticos |
| Documentação | ✅ Completo | Guias completos |
| Deploy Local | ✅ Funcional | Docker |
| Deploy Produção | 🚀 Pronto | Railway/GCR |

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 👨‍💻 Autor

**Falachefe Team**
- Website: https://falachefe.app.br
- Email: contato@falachefe.app.br

---

**Última Atualização**: 11/10/2025  
**Versão**: 2.0.0  
**Status**: ✅ Production Ready (com Docker)

