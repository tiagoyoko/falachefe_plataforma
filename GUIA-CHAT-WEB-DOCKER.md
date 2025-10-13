# 🐳 Guia Completo: Chat Web + CrewAI via Docker

## 📋 Visão Geral

Este guia mostra como rodar a **arquitetura completa** do chat web integrado com CrewAI usando Docker.

## 🏗️ Arquitetura Real

```
┌─────────────────────────────────────────────────────────┐
│                    INTERFACE WEB                        │
│               http://localhost:3000/chat                │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ POST /api/chat
                      ▼
┌─────────────────────────────────────────────────────────┐
│              NEXT.JS (Host ou Docker)                   │
│                   Porta: 3000                           │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ HTTP
                      ▼
┌─────────────────────────────────────────────────────────┐
│              NGINX (Reverse Proxy)                      │
│                   Porta: 80/443                         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ proxy_pass
                      ▼
┌─────────────────────────────────────────────────────────┐
│            CREWAI FLASK API (Docker)                    │
│                   Porta: 8000                           │
│  • Endpoint: POST /process                              │
│  • Gunicorn: 2 workers, 4 threads                      │
│  • Timeout: 120s                                        │
│  • Health Check: GET /health                            │
└───────┬─────────────────────────────────┬───────────────┘
        │                                 │
        │                                 │
        ▼                                 ▼
┌──────────────────┐          ┌──────────────────────┐
│  REDIS (Docker)  │          │  POSTGRES (Docker)   │
│   Porta: 6379    │          │     Porta: 5432      │
│   Cache/Sessões  │          │   Dados Persistentes │
└──────────────────┘          └──────────────────────┘
```

## 🚀 Como Rodar

### Pré-requisitos

```bash
# Verificar instalações
docker --version      # Docker 20.10+
docker-compose --version  # Docker Compose 2.0+
node --version        # Node.js 18+
npm --version         # npm 9+
```

### Passo 1: Configurar Variáveis de Ambiente

```bash
cd crewai-projects/falachefe_crew

# Criar arquivo .env
cat > .env << 'EOF'
# OpenAI
OPENAI_API_KEY=sk-proj-your-key-here

# UAZAPI
UAZAPI_BASE_URL=https://falachefe.uazapi.com
UAZAPI_TOKEN=your-token-here
UAZAPI_ADMIN_TOKEN=your-admin-token-here

# Database
POSTGRES_DB=falachefe
POSTGRES_USER=crewai
POSTGRES_PASSWORD=your-secure-password-here

# Redis
REDIS_PASSWORD=your-redis-password-here

# Logging
LOG_LEVEL=info

# Workers
GUNICORN_WORKERS=2
GUNICORN_THREADS=4
GUNICORN_TIMEOUT=120

# Grafana
GRAFANA_PASSWORD=admin
EOF
```

### Passo 2: Subir o Stack CrewAI com Docker

```bash
cd crewai-projects/falachefe_crew

# Build e start de todos os serviços
docker-compose up -d --build

# Verificar status
docker-compose ps

# Verificar logs
docker-compose logs -f crewai-api
```

**Serviços que serão iniciados:**
- ✅ **crewai-api**: Flask API na porta 8000
- ✅ **nginx**: Reverse proxy nas portas 80/443
- ✅ **redis**: Cache na porta 6379
- ✅ **postgres**: Banco de dados na porta 5432
- ✅ **prometheus**: Métricas na porta 9090
- ✅ **grafana**: Dashboards na porta 3000 (conflito com Next.js!)

### Passo 3: Ajustar Porta do Grafana (Conflito)

Como Next.js usa porta 3000, precisamos mudar o Grafana:

```bash
cd crewai-projects/falachefe_crew

# Editar docker-compose.yml
nano docker-compose.yml

# Mudar linha do Grafana de:
#   ports:
#     - "3000:3000"
# Para:
#   ports:
#     - "3001:3000"

# Restart
docker-compose restart grafana
```

### Passo 4: Configurar Next.js

```bash
cd /Users/tiagoyokoyama/Falachefe

# Adicionar variável de ambiente
echo "CREWAI_API_URL=http://localhost:8000/process" >> .env.local

# OU para acessar via Nginx:
echo "CREWAI_API_URL=http://localhost:80/process" >> .env.local
```

### Passo 5: Iniciar Next.js

```bash
# Instalar dependências (se necessário)
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### Passo 6: Testar a Integração

#### Teste 1: Health Check da API CrewAI
```bash
curl http://localhost:8000/health

# Resposta esperada:
# {"status": "ok", "timestamp": "..."}
```

#### Teste 2: Health Check via Nginx
```bash
curl http://localhost:80/health

# Resposta esperada:
# {"status": "ok", "timestamp": "..."}
```

#### Teste 3: Processar Mensagem
```bash
curl -X POST http://localhost:8000/process \
  -H "Content-Type: application/json" \
  -d '{
    "user_message": "Qual é o meu saldo?",
    "user_id": "test-user",
    "phone_number": "+5511999999999",
    "context": {
      "source": "web-chat"
    }
  }'

# Aguarde 10-30s para resposta...
```

#### Teste 4: Chat Web Completo
```bash
# Terminal 1: Next.js já rodando (npm run dev)
# Terminal 2: Docker já rodando (docker-compose up -d)

# Terminal 3: Testar endpoint integrado
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá! Qual é o meu saldo?",
    "userId": "test-user",
    "conversationId": "test-conv"
  }'
```

#### Teste 5: Interface Web
```
1. Abra navegador: http://localhost:3000/chat
2. Faça login
3. Digite: "Qual é o meu saldo?"
4. Aguarde resposta (~10-30s)
```

## 📊 Monitoramento

### Acessar Dashboards

- **Grafana**: http://localhost:3001
  - User: admin
  - Password: (definido no .env)

- **Prometheus**: http://localhost:9090

- **Redis**: `redis-cli -h localhost -p 6379 -a your-password`

- **PostgreSQL**: 
  ```bash
  docker exec -it falachefe-postgres psql -U crewai -d falachefe
  ```

### Logs em Tempo Real

```bash
# Todos os serviços
docker-compose logs -f

# Apenas CrewAI API
docker-compose logs -f crewai-api

# Apenas Nginx
docker-compose logs -f nginx

# Últimas 100 linhas
docker-compose logs --tail=100 crewai-api
```

## 🔧 Comandos Úteis

### Gerenciar Containers

```bash
# Parar todos os serviços
docker-compose down

# Parar e remover volumes (⚠️ PERDE DADOS)
docker-compose down -v

# Restart de um serviço específico
docker-compose restart crewai-api

# Rebuild sem cache
docker-compose build --no-cache crewai-api
docker-compose up -d crewai-api

# Ver recursos utilizados
docker stats
```

### Debug

```bash
# Entrar no container
docker exec -it falachefe-crewai-api bash

# Ver variáveis de ambiente
docker exec falachefe-crewai-api env

# Executar script manualmente
docker exec falachefe-crewai-api python webhook_processor.py

# Verificar conectividade
docker exec falachefe-crewai-api ping redis
docker exec falachefe-crewai-api ping postgres
```

### Limpeza

```bash
# Remover containers parados
docker container prune -f

# Remover imagens não usadas
docker image prune -a -f

# Remover volumes não usados
docker volume prune -f

# Limpeza completa (⚠️ CUIDADO)
docker system prune -a -f --volumes
```

## 🌍 Deploy em Produção

### Opção A: Docker Compose em VPS

```bash
# Servidor (ex: Hetzner, DigitalOcean, AWS EC2)
ssh user@your-server

# Clone repo
git clone https://github.com/seu-usuario/falachefe.git
cd falachefe/crewai-projects/falachefe_crew

# Configure .env com credenciais de produção
nano .env

# Suba os serviços
docker-compose -f docker-compose.yml up -d

# Configure domínio no Nginx
# Edite nginx/nginx.conf com seu domínio
```

### Opção B: Servidor Hetzner

O projeto já está deployado no servidor Hetzner com Docker Swarm:
- **IP**: 37.27.248.13:8000
- **Stack**: Docker Compose
- **Proxy**: Traefik (api.falachefe.app.br)

Veja `DEPLOY-HETZNER-SUCCESS.md` e `ARQUITETURA-DOMINIOS.md` para detalhes.

### Opção C: Google Cloud Run

```bash
# Build da imagem
docker build -t gcr.io/seu-projeto/crewai-api .

# Push para GCR
docker push gcr.io/seu-projeto/crewai-api

# Deploy
gcloud run deploy crewai-api \
  --image gcr.io/seu-projeto/crewai-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --port 8000 \
  --timeout 120 \
  --memory 2Gi \
  --cpu 2 \
  --set-env-vars "OPENAI_API_KEY=...,UAZAPI_TOKEN=..."
```

## 🐛 Troubleshooting

### Problema 1: Container não inicia

**Erro**: `Error response from daemon: Ports are not available`

**Solução**:
```bash
# Verificar portas em uso
lsof -i :8000
lsof -i :80
lsof -i :6379

# Matar processos conflitantes
kill -9 PID

# Ou mudar porta no docker-compose.yml
```

### Problema 2: API retorna timeout

**Erro**: `CrewAI processing timed out`

**Solução**:
```bash
# Aumentar timeout no docker-compose.yml
environment:
  - GUNICORN_TIMEOUT=300  # 5 minutos

# Restart
docker-compose restart crewai-api
```

### Problema 3: Out of Memory

**Erro**: `Container killed (OOM)`

**Solução**:
```yaml
# docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G  # Aumentar de 2G para 4G
```

### Problema 4: Conexão recusada

**Erro**: `ECONNREFUSED localhost:8000`

**Solução**:
```bash
# Verificar se container está rodando
docker ps | grep crewai-api

# Verificar logs
docker-compose logs crewai-api

# Verificar health
curl http://localhost:8000/health
```

## 📈 Performance

### Métricas Típicas

| Métrica | Desenvolvimento | Produção |
|---------|----------------|----------|
| Startup time | ~20s | ~15s |
| Latência /health | <50ms | <100ms |
| Latência /process | 10-30s | 15-40s |
| Memória (idle) | ~500MB | ~800MB |
| Memória (pico) | ~1.5GB | ~2GB |
| CPU (idle) | <5% | <10% |
| CPU (processando) | 50-100% | 70-100% |

### Otimizações

**1. Aumentar workers (mais requests simultâneos)**:
```yaml
environment:
  - GUNICORN_WORKERS=4  # de 2 para 4
  - GUNICORN_THREADS=8  # de 4 para 8
```

**2. Cache de respostas**:
```python
# api_server.py
import redis
r = redis.Redis(host='redis', port=6379)

# Cachear respostas comuns
cache_key = f"response:{hash(user_message)}"
cached = r.get(cache_key)
if cached:
    return json.loads(cached)
```

**3. Pré-carregar modelos**:
```python
# Inicializar crew no startup
crew_instance = FalachefeCrew()
```

## 🎯 Checklist Completo

### Desenvolvimento
- [x] Docker e Docker Compose instalados
- [x] Variáveis de ambiente configuradas (.env)
- [x] CrewAI API rodando (porta 8000)
- [x] Redis rodando (porta 6379)
- [x] Postgres rodando (porta 5432)
- [x] Next.js rodando (porta 3000)
- [x] CREWAI_API_URL configurado
- [x] Health checks passando
- [x] Teste de mensagem funcionando
- [x] Interface web acessível

### Produção
- [ ] Domínio configurado
- [ ] SSL/TLS certificado
- [ ] Nginx configurado com SSL
- [ ] Variáveis de ambiente seguras
- [ ] Backup automático (Postgres)
- [ ] Logs persistentes
- [ ] Monitoring (Prometheus/Grafana)
- [ ] Alertas configurados
- [ ] Auto-scaling (se necessário)
- [ ] Load balancer (se necessário)

## 📚 Referências

- [Docker Compose](https://docs.docker.com/compose/)
- [Gunicorn](https://docs.gunicorn.org/)
- [Flask](https://flask.palletsprojects.com/)
- [CrewAI](https://docs.crewai.com/)
- [Nginx](https://nginx.org/en/docs/)
- [Docker Swarm](https://docs.docker.com/engine/swarm/)

---

**Data**: 11/10/2025  
**Status**: ✅ Arquitetura Docker Completa  
**Testado**: ✅ Local (Mac/Linux)  
**Produção**: 🚀 Pronto para deploy

