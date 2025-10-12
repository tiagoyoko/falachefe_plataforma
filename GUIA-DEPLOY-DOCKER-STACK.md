# 🐳 Guia de Deploy - Docker Stack com Traefik

**Baseado na análise do projeto FalaChefe**

---

## 📋 ARQUITETURA ATUAL

### Servidor Hetzner (37.27.248.13):
```
┌──────────────────────────────────────────────────┐
│  Docker Swarm                                    │
│                                                  │
│  ┌────────────────────────────────────────────┐ │
│  │  Traefik (Proxy Reverso)                   │ │
│  │  • Rede: netrede                           │ │
│  │  • Portas: 80, 443                         │ │
│  │  • SSL: Let's Encrypt automático           │ │
│  └─────────────┬──────────────────────────────┘ │
│                │                                 │
│  ┌─────────────▼──────────────────────────────┐ │
│  │  falachefe_crewai-api                      │ │
│  │  • Image: falachefe-crewai:latest          │ │
│  │  • Porta interna: 8000                     │ │
│  │  • Domínio: api.falachefe.app.br           │ │
│  │  • SSL: Automático via Traefik             │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

---

## 🚀 COMANDOS DE DEPLOY

### 1️⃣ Build da Imagem

```bash
# SSH no servidor
ssh root@37.27.248.13

# Ir para diretório
cd /opt/falachefe-crewai

# Build da imagem
docker build -t falachefe-crewai:latest .

# Verificar imagem criada
docker images | grep falachefe-crewai
```

### 2️⃣ Deploy do Stack no Swarm

```bash
cd /opt/falachefe-crewai

# Deploy com docker-stack.yml
docker stack deploy -c docker-stack.yml falachefe --with-registry-auth

# Aguardar 10-15s para inicialização
sleep 15

# Verificar status
docker service ls | grep falachefe
```

**Saída esperada**:
```
ID             NAME                   MODE        REPLICAS   IMAGE
xcysfn9tbet3   falachefe_crewai-api   replicated  1/1        falachefe-crewai:latest
```

### 3️⃣ Verificar Logs

```bash
# Logs em tempo real
docker service logs falachefe_crewai-api -f

# Últimas 50 linhas
docker service logs falachefe_crewai-api --tail=50

# Filtrar por erro
docker service logs falachefe_crewai-api 2>&1 | grep -i error
```

### 4️⃣ Testar Endpoints

```bash
# Health check (dentro do servidor)
curl http://localhost:8000/health

# Health check externo (via Traefik + SSL)
curl https://api.falachefe.app.br/health

# Processar mensagem
curl -X POST https://api.falachefe.app.br/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Teste",
    "userId": "user-123",
    "phoneNumber": "+5511999999999",
    "context": {}
  }'
```

---

## 🔄 ATUALIZAR STACK (Após Mudanças no Código)

```bash
# 1. SSH no servidor
ssh root@37.27.248.13

# 2. Atualizar código (se usar git)
cd /opt/falachefe-crewai
git pull origin master

# OU copiar arquivos via SCP do Mac:
# scp api_server.py root@37.27.248.13:/opt/falachefe-crewai/

# 3. Rebuild da imagem
docker build -t falachefe-crewai:latest .

# 4. Atualizar serviço (sem downtime)
docker service update --image falachefe-crewai:latest falachefe_crewai-api

# 5. Monitorar atualização
docker service ps falachefe_crewai-api

# 6. Verificar logs
docker service logs falachefe_crewai-api --tail=20
```

---

## 🔧 GERENCIAR STACK

### Ver Status

```bash
# Listar serviços
docker service ls

# Ver réplicas
docker service ps falachefe_crewai-api

# Inspecionar serviço
docker service inspect falachefe_crewai-api
```

### Escalar

```bash
# Aumentar réplicas (load balancing)
docker service scale falachefe_crewai-api=2

# Voltar para 1
docker service scale falachefe_crewai-api=1
```

### Remover Stack

```bash
# Parar todos os serviços do stack
docker stack rm falachefe

# Aguardar remoção completa
docker service ls | grep falachefe
```

### Reiniciar Serviço

```bash
# Forçar restart (todos os containers)
docker service update --force falachefe_crewai-api

# Ou remover e redeployar
docker stack rm falachefe
sleep 5
docker stack deploy -c docker-stack.yml falachefe --with-registry-auth
```

---

## 📊 MONITORAMENTO

### Ver Logs de Produção

```bash
# Tempo real
docker service logs falachefe_crewai-api -f

# Últimas N linhas
docker service logs falachefe_crewai-api --tail=100

# Desde timestamp
docker service logs falachefe_crewai-api --since 2025-10-12T10:00:00

# Filtrar por texto
docker service logs falachefe_crewai-api 2>&1 | grep "Processing message"
```

### Métricas do Container

```bash
# Stats em tempo real
docker stats $(docker ps | grep falachefe | awk '{print $1}')

# Ou via endpoint
curl https://api.falachefe.app.br/metrics
```

---

## 🆚 DOCKER COMPOSE vs DOCKER STACK

### Situação Atual:

**Hoje usamos**: `docker-compose` (porta 8000 exposta)
```bash
docker compose -f docker-compose.minimal.yml up -d
# Acesso: http://37.27.248.13:8000
```

**Deveríamos usar**: `docker stack` (Traefik + SSL)
```bash
docker stack deploy -c docker-stack.yml falachefe
# Acesso: https://api.falachefe.app.br
```

### Diferenças:

| Aspecto | Docker Compose | Docker Stack |
|---------|---------------|--------------|
| **Porta Externa** | 8000 exposta | Não exposta (Traefik) |
| **Domínio** | Apenas IP | api.falachefe.app.br |
| **SSL** | Não | Let's Encrypt automático |
| **Load Balancing** | Não | Traefik balanceia |
| **Escalabilidade** | Limitada | Múltiplas réplicas |
| **Modo** | Single host | Swarm cluster |

---

## 🎯 MIGRAR DE COMPOSE PARA STACK

Execute no servidor:

```bash
# 1. Parar Docker Compose atual
cd /opt/falachefe-crewai
docker compose down

# 2. Verificar se Swarm está ativo
docker info | grep "Swarm: active"

# 3. Se não estiver, inicializar Swarm
docker swarm init

# 4. Verificar rede netrede (usada pelo Traefik)
docker network ls | grep netrede

# 5. Se não existir, criar
docker network create --driver=overlay netrede

# 6. Verificar se Traefik está rodando
docker service ls | grep traefik

# 7. Build da imagem
docker build -t falachefe-crewai:latest .

# 8. Deploy do stack
docker stack deploy -c docker-stack.yml falachefe --with-registry-auth

# 9. Verificar
docker service ls | grep falachefe
docker service logs falachefe_crewai-api -f
```

---

## ⚠️ IMPORTANTE

### DNS Necessário

Para usar `api.falachefe.app.br`, configure DNS:

```
Tipo: A
Nome: api
Valor: 37.27.248.13
TTL: 3600
```

### Verificar DNS Propagou

```bash
# Do seu Mac
nslookup api.falachefe.app.br

# Deve retornar: 37.27.248.13
```

---

## 📝 COMANDOS RÁPIDOS (Copiar/Colar no Servidor)

### Deploy Completo

```bash
cd /opt/falachefe-crewai && \
echo "🔨 Building image..." && \
docker build -t falachefe-crewai:latest . && \
echo "🚀 Deploying stack..." && \
docker stack deploy -c docker-stack.yml falachefe --with-registry-auth && \
echo "⏳ Waiting 15s..." && \
sleep 15 && \
echo "📊 Service status:" && \
docker service ls | grep falachefe && \
echo "🔍 Testing health..." && \
curl -s http://localhost:8000/health | jq .status
```

### Status Rápido

```bash
docker service ls | grep falachefe && \
docker service ps falachefe_crewai-api && \
curl -s http://localhost:8000/health | jq '{status, uptime: .uptime_seconds}'
```

---

**Próximo**: Migrar de Docker Compose para Docker Stack para usar domínio + SSL

