# 🔄 Setup API CrewAI: api.falachefe.app.br

**Data**: 11 de Outubro de 2025  
**Servidor**: 37.27.248.13 (Hetzner)  
**Objetivo**: Configurar domínio dedicado para API CrewAI

> **⚠️ IMPORTANTE**: Este guia é APENAS para configurar o serviço CrewAI no servidor Hetzner.  
> A aplicação Next.js continua em `falachefe.app.br` (Vercel).

---

## 📋 Visão Geral da Arquitetura

```
┌──────────────────────────────────────┐
│   falachefe.app.br (Vercel)          │
│   • Aplicação Next.js                │
│   • Frontend + Backend               │
│   • Autenticação                     │
│   • Webhooks UAZAPI                  │
└──────────┬───────────────────────────┘
           │
           │ Chama API
           ▼
┌──────────────────────────────────────┐
│   api.falachefe.app.br (Hetzner)     │
│   • Serviço CrewAI (Python)          │
│   • Processamento de mensagens       │
│   • Docker Swarm + Traefik           │
└──────────────────────────────────────┘
```

**Ver documentação completa**: `ARQUITETURA-DOMINIOS.md`

---

## 🎯 O QUE SERÁ CONFIGURADO

✅ Domínio: `api.falachefe.app.br`  
✅ Servidor: Hetzner 37.27.248.13  
✅ Serviço: CrewAI API (Python)  
✅ SSL: Let's Encrypt (automático via Traefik)  
✅ Proxy: Traefik  

❌ **NÃO será alterado**: `falachefe.app.br` (aplicação continua na Vercel)

---

## 📝 PRÉ-REQUISITOS

- [ ] Acesso SSH ao servidor: `ssh root@37.27.248.13`
- [ ] Docker Swarm já configurado
- [ ] Traefik já rodando na rede `netrede`
- [ ] Imagem Docker `falachefe-crewai:latest` já buildada
- [ ] Acesso ao painel DNS do domínio

---

## 🌐 PASSO 1: Configurar DNS

### 1.1 Adicionar Registro DNS

No seu provedor DNS (Cloudflare, GoDaddy, Registro.br, etc.):

```
Tipo: A
Nome: api
Valor: 37.27.248.13
TTL: 3600 (ou Auto)
Proxy Status: DNS only (se usar Cloudflare)
```

**Resultado esperado**: `api.falachefe.app.br` → `37.27.248.13`

### 1.2 Verificar Propagação

```bash
# Do seu Mac
nslookup api.falachefe.app.br

# Deve retornar:
# Name:    api.falachefe.app.br
# Address: 37.27.248.13

# Ou com dig
dig +short api.falachefe.app.br
# Deve retornar: 37.27.248.13
```

⏰ **Tempo de propagação**: 5 minutos a 24 horas (geralmente 5-30 min)

---

## 🐳 PASSO 2: Atualizar Docker Stack

### 2.1 Conectar no Servidor

```bash
ssh root@37.27.248.13
cd /opt/falachefe-crewai
```

### 2.2 Editar docker-stack.yml

```bash
nano docker-stack.yml
```

**Conteúdo completo**:

```yaml
version: "3.8"

services:
  crewai-api:
    image: falachefe-crewai:latest
    networks:
      - netrede
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - UAZAPI_BASE_URL=${UAZAPI_BASE_URL}
      - UAZAPI_TOKEN=${UAZAPI_TOKEN}
      - UAZAPI_ADMIN_TOKEN=${UAZAPI_ADMIN_TOKEN}
      - GUNICORN_WORKERS=${GUNICORN_WORKERS:-2}
      - GUNICORN_THREADS=${GUNICORN_THREADS:-4}
      - GUNICORN_TIMEOUT=${GUNICORN_TIMEOUT:-120}
      - LOG_LEVEL=${LOG_LEVEL:-info}
      - PYTHONUNBUFFERED=1
    deploy:
      replicas: 1
      placement:
        constraints:
          - node.hostname == manager
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
      labels:
        # Habilitar Traefik
        - "traefik.enable=true"
        - "traefik.docker.network=netrede"
        
        # HTTP Router (Redirect para HTTPS)
        - "traefik.http.routers.crewai-http.rule=Host(`api.falachefe.app.br`)"
        - "traefik.http.routers.crewai-http.entrypoints=web"
        - "traefik.http.routers.crewai-http.middlewares=redirect-to-https"
        
        # HTTPS Router
        - "traefik.http.routers.crewai-https.rule=Host(`api.falachefe.app.br`)"
        - "traefik.http.routers.crewai-https.entrypoints=websecure"
        - "traefik.http.routers.crewai-https.tls=true"
        - "traefik.http.routers.crewai-https.tls.certresolver=letsencrypt"
        
        # Load Balancer
        - "traefik.http.services.crewai.loadbalancer.server.port=8000"
        
        # Middleware de Redirect
        - "traefik.http.middlewares.redirect-to-https.redirectscheme.scheme=https"
        - "traefik.http.middlewares.redirect-to-https.redirectscheme.permanent=true"

networks:
  netrede:
    external: true
```

Salvar: `Ctrl+O`, `Enter`, `Ctrl+X`

### 2.3 Verificar Arquivo .env

```bash
cat .env
```

Deve conter:

```bash
OPENAI_API_KEY=sk-proj-...
UAZAPI_BASE_URL=https://falachefe.uazapi.com
UAZAPI_TOKEN=4fbeda58-0b8a-4905-9218-8ec89967a4a4
UAZAPI_ADMIN_TOKEN=aCOqY35qDa9NCd25XmwgOKnBbKyxymZZfStBRaHzb8NiIqqfPn
GUNICORN_WORKERS=2
GUNICORN_THREADS=4
GUNICORN_TIMEOUT=120
LOG_LEVEL=info
```

### 2.4 Deploy da Stack

```bash
# Deploy com novo domínio
docker stack deploy -c docker-stack.yml falachefe --with-registry-auth

# Verificar status
docker service ls | grep falachefe
# Deve mostrar: falachefe_crewai-api   replicated   1/1

# Ver logs
docker service logs falachefe_crewai-api -f --tail=50
```

### 2.5 Aguardar Certificado SSL

O Traefik irá automaticamente:
1. Detectar o domínio `api.falachefe.app.br`
2. Solicitar certificado Let's Encrypt
3. Configurar HTTPS

⏰ **Tempo**: 1-2 minutos

**Verificar logs do Traefik**:

```bash
# Encontrar container do Traefik
docker ps | grep traefik

# Ver logs (substituir XXX pelo ID/nome)
docker logs traefik_traefik.1.XXX --tail=50 | grep -i "api.falachefe"
```

---

## 🧪 PASSO 3: Testar API

### 3.1 Teste DNS

```bash
# Do seu Mac
curl -I https://api.falachefe.app.br/health

# Deve retornar:
# HTTP/2 200
# content-type: application/json
```

### 3.2 Teste Health Check

```bash
curl -s https://api.falachefe.app.br/health | jq

# Resposta esperada:
{
  "status": "healthy",
  "service": "falachefe-crewai-api",
  "version": "1.0.0",
  "timestamp": "2025-10-11T...",
  "crew_initialized": false,
  "uazapi_configured": true,
  "system": {
    "cpu_percent": 2.3,
    "memory_percent": 47.1,
    "disk_percent": 85.8
  }
}
```

### 3.3 Teste HTTPS Redirect

```bash
curl -sI http://api.falachefe.app.br/health

# Deve retornar:
# HTTP/1.1 301 Moved Permanently
# Location: https://api.falachefe.app.br/health
```

### 3.4 Teste Certificado SSL

```bash
echo | openssl s_client -connect api.falachefe.app.br:443 2>/dev/null | openssl x509 -noout -issuer -dates

# Deve retornar:
# issuer=C = US, O = Let's Encrypt, CN = ...
# notBefore=Oct 11 ...
# notAfter=Jan 09 ...
```

### 3.5 Teste de Processamento

```bash
curl -X POST https://api.falachefe.app.br/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Teste de integração",
    "userId": "user-test-123",
    "phoneNumber": "5511999999999",
    "context": {}
  }'

# Deve processar e retornar resposta (pode levar 30s-3min)
```

---

## 🔄 PASSO 4: Configurar Aplicação Next.js (Vercel)

### 4.1 Variável de Ambiente no Vercel

A aplicação Next.js em `falachefe.app.br` precisa saber a URL da API CrewAI.

**Opção A: Via Dashboard Vercel**

1. Acesse: https://vercel.com/tiago-6739s-projects/falachefe
2. Vá em **Settings** → **Environment Variables**
3. Adicione ou atualize:
   - Nome: `CREWAI_API_URL`
   - Valor: `https://api.falachefe.app.br`
   - Environment: **Production**
4. Salvar
5. **Deployments** → **Redeploy** (latest)

**Opção B: Via CLI**

```bash
cd /Users/tiagoyokoyama/Falachefe

# Remover variável antiga (se existir)
vercel env rm CREWAI_API_URL production

# Adicionar nova
echo "https://api.falachefe.app.br" | vercel env add CREWAI_API_URL production

# Redeploy
vercel --prod
```

### 4.2 Verificar .env Local (Desenvolvimento)

```bash
cd /Users/tiagoyokoyama/Falachefe

# Adicionar ao seu .env local (se não existir)
echo "CREWAI_API_URL=https://api.falachefe.app.br" >> .env
```

---

## 📊 PASSO 5: Validação Final

### 5.1 Checklist Servidor

```bash
ssh root@37.27.248.13

# DNS resolve
dig +short api.falachefe.app.br
# ✅ Deve retornar: 37.27.248.13

# Serviço rodando
docker service ls | grep falachefe
# ✅ Deve mostrar: 1/1

# Health check OK
curl -s https://api.falachefe.app.br/health | jq .status
# ✅ Deve retornar: "healthy"

# SSL válido
curl -sI https://api.falachefe.app.br/health | head -1
# ✅ Deve retornar: HTTP/2 200
```

### 5.2 Checklist Aplicação

```bash
# Do seu Mac

# Verificar Vercel tem variável
vercel env ls production | grep CREWAI_API_URL
# ✅ Deve listar a variável

# Testar integração end-to-end (via aplicação)
curl -X POST https://falachefe.app.br/api/test-crewai \
  -H "Content-Type: application/json" \
  -d '{"message":"teste"}'
# ✅ Deve processar via api.falachefe.app.br
```

---

## 🎉 RESULTADO FINAL

Após completar todos os passos:

### Domínios Configurados

| Domínio | Serviço | Status |
|---------|---------|--------|
| `falachefe.app.br` | Aplicação Next.js (Vercel) | ✅ Inalterado |
| `api.falachefe.app.br` | API CrewAI (Hetzner) | ✅ Novo |

### Endpoints Disponíveis

**Aplicação (Vercel)**:
- `https://falachefe.app.br/` - Frontend
- `https://falachefe.app.br/dashboard` - Dashboard
- `https://falachefe.app.br/api/auth/*` - Autenticação
- `https://falachefe.app.br/api/webhook/uaz` - Webhook WhatsApp

**API CrewAI (Hetzner)**:
- `https://api.falachefe.app.br/health` - Health check
- `https://api.falachefe.app.br/metrics` - Métricas
- `https://api.falachefe.app.br/process` - Processar mensagem
- `https://api.falachefe.app.br/process-audio` - Processar áudio
- `https://api.falachefe.app.br/process-image` - Processar imagem

### Fluxo de Integração

```
WhatsApp → UAZAPI → falachefe.app.br/api/webhook/uaz
                   → MessageRouter analisa
                   → api.falachefe.app.br/process
                   → CrewAI processa
                   → Resposta → UAZAPI → WhatsApp
```

---

## 🔍 TROUBLESHOOTING

### Problema 1: DNS não resolve

```bash
# Verificar
dig api.falachefe.app.br

# Se não resolver:
# 1. Verificar configuração no provedor DNS
# 2. Aguardar propagação (até 24h)
# 3. Limpar cache DNS local:
sudo dscacheutil -flushcache  # Mac
sudo systemd-resolve --flush-caches  # Linux
```

### Problema 2: Certificado SSL não gera

```bash
# Verificar logs Traefik
ssh root@37.27.248.13
docker logs traefik_traefik.1.XXX | grep -i "acme\|letsencrypt\|api.falachefe"

# Causas comuns:
# - Portas 80/443 bloqueadas no firewall
# - DNS não propagado
# - Rate limit Let's Encrypt (5 certs/semana)

# Solução: Forçar renovação
docker service update --force falachefe_crewai-api
```

### Problema 3: Erro 502 Bad Gateway

```bash
# Verificar serviço
ssh root@37.27.248.13
docker service ps falachefe_crewai-api

# Verificar logs
docker service logs falachefe_crewai-api --tail=50

# Restart
docker service update --force falachefe_crewai-api
```

### Problema 4: Timeout ao processar

```bash
# Aumentar timeout no docker-stack.yml
GUNICORN_TIMEOUT=300  # 5 minutos

# Redeploy
docker stack deploy -c docker-stack.yml falachefe --with-registry-auth
```

---

## 📝 COMANDOS ÚTEIS

### Servidor Hetzner

```bash
# Conectar
ssh root@37.27.248.13

# Status
docker service ls
docker service ps falachefe_crewai-api

# Logs
docker service logs falachefe_crewai-api -f
docker service logs traefik_traefik -f | grep api.falachefe

# Restart
docker service update --force falachefe_crewai-api

# Redeploy
cd /opt/falachefe-crewai
docker stack deploy -c docker-stack.yml falachefe --with-registry-auth
```

### Do Seu Mac

```bash
# Testar API
curl -s https://api.falachefe.app.br/health | jq

# Testar processamento
curl -X POST https://api.falachefe.app.br/process \
  -H "Content-Type: application/json" \
  -d '{"message":"teste","userId":"123","phoneNumber":"5511999999999","context":{}}'

# Verificar DNS
dig +short api.falachefe.app.br

# Verificar SSL
curl -vI https://api.falachefe.app.br/health 2>&1 | grep "SSL\|certificate"
```

---

## 📚 DOCUMENTAÇÃO RELACIONADA

- **`ARQUITETURA-DOMINIOS.md`** - Visão completa da arquitetura de domínios
- **`DOMINIO-TRAEFIK-SUCCESS.md`** - Setup inicial Traefik
- **`DEPLOY-HETZNER-SUCCESS.md`** - Deploy inicial Docker Swarm
- **`MESSAGE-ROUTER-GUIDE.md`** - Sistema de roteamento de mensagens

---

**Status**: ✅ Guia Oficial de Setup  
**Última Atualização**: 11 de Outubro de 2025  
**Próxima Ação**: Executar passos 1-5 neste documento
