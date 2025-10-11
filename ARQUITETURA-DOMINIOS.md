# 🌐 Arquitetura de Domínios - FalaChefe

**Data**: 11 de Outubro de 2025  
**Status**: ✅ DOCUMENTAÇÃO OFICIAL

---

## 📋 Visão Geral

O projeto FalaChefe utiliza **dois domínios distintos** para separar responsabilidades e otimizar a arquitetura:

| Domínio | Serviço | Tecnologia | Hospedagem | Função |
|---------|---------|------------|------------|--------|
| **`falachefe.app.br`** | Aplicação Principal | Next.js 15 + React 19 | Vercel | Frontend + Backend API |
| **`api.falachefe.app.br`** | API CrewAI | Python + CrewAI | Hetzner (Docker Swarm) | Processamento IA |

---

## 🏗️ Arquitetura Detalhada

```
┌─────────────────────────────────────────────────────────────┐
│                    falachefe.app.br                         │
│                     (Vercel - Next.js)                       │
│                                                              │
│  ┌────────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │   Frontend     │  │  Backend API │  │  Autenticação   │ │
│  │   (React 19)   │  │  (Next.js)   │  │  (Better Auth)  │ │
│  └────────────────┘  └──────────────┘  └─────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Webhooks UAZAPI (WhatsApp)                     │ │
│  │         /api/webhook/uaz                               │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         Rotas API REST                                 │ │
│  │         /api/auth/*, /api/users/*, /api/messages/*     │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ HTTP Request (Message Processing)
                       │ POST /process
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                  api.falachefe.app.br                       │
│              (Hetzner - Docker Swarm + Traefik)             │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              CrewAI Service (Python)                   │ │
│  │                                                        │ │
│  │  • Orchestrator Agent                                 │ │
│  │  • Sales Agent                                        │ │
│  │  • Support Agent                                      │ │
│  │  • Marketing Agent                                    │ │
│  │  • Finance Agent                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Endpoints Disponíveis                     │ │
│  │  • POST /process         - Processar mensagem         │ │
│  │  • POST /process-audio   - Processar áudio            │ │
│  │  • POST /process-image   - Processar imagem           │ │
│  │  • POST /process-document - Processar documento       │ │
│  │  • GET  /health          - Health check               │ │
│  │  • GET  /metrics         - Métricas Prometheus        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Traefik (Proxy Reverso)                   │ │
│  │  • SSL/TLS Let's Encrypt                              │ │
│  │  • Redirect HTTP → HTTPS                              │ │
│  │  • Load Balancing                                     │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔧 Configurações por Domínio

### 1️⃣ falachefe.app.br (Aplicação Next.js)

#### Variáveis de Ambiente

```bash
# URL da aplicação principal
NEXT_PUBLIC_APP_URL=https://falachefe.app.br

# URL da API CrewAI externa
CREWAI_API_URL=https://api.falachefe.app.br

# Autenticação
BETTER_AUTH_SECRET=xxx
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx

# Database
POSTGRES_URL=xxx

# UAZ API (WhatsApp)
UAZAPI_BASE_URL=https://falachefe.uazapi.com
UAZAPI_TOKEN=xxx
UAZAPI_ADMIN_TOKEN=xxx

# Redis Cache
UPSTASH_REDIS_REST_URL=xxx
UPSTASH_REDIS_REST_TOKEN=xxx

# OpenAI (para processamento local leve)
OPENAI_API_KEY=xxx
```

#### Arquivos Importantes

| Arquivo | Configuração | Valor |
|---------|--------------|-------|
| `vercel.json` | `NEXT_PUBLIC_APP_URL` | `https://falachefe.app.br` |
| `src/lib/auth/auth.ts` | `baseURL` | `https://falachefe.app.br` |
| `src/lib/auth/auth-client.ts` | `baseURL` | `https://falachefe.app.br` |
| `src/lib/cors.ts` | `allowedOrigins` | Inclui `falachefe.app.br` |
| `src/lib/message-routing/message-router.ts` | `CREWAI_API_URL` | `https://api.falachefe.app.br` |

#### Endpoints Públicos

```
https://falachefe.app.br/
https://falachefe.app.br/dashboard
https://falachefe.app.br/chat
https://falachefe.app.br/api/auth/*
https://falachefe.app.br/api/webhook/uaz
https://falachefe.app.br/api/messages/*
```

---

### 2️⃣ api.falachefe.app.br (API CrewAI)

#### Servidor

- **IP**: 37.27.248.13 (Hetzner)
- **Sistema**: Ubuntu Server
- **Orquestração**: Docker Swarm
- **Proxy**: Traefik
- **SSL**: Let's Encrypt (automático)

#### Variáveis de Ambiente (no servidor)

```bash
# OpenAI
OPENAI_API_KEY=sk-proj-xxx

# UAZ API
UAZAPI_BASE_URL=https://falachefe.uazapi.com
UAZAPI_TOKEN=xxx
UAZAPI_ADMIN_TOKEN=xxx

# Gunicorn (servidor Python)
GUNICORN_WORKERS=2
GUNICORN_THREADS=4
GUNICORN_TIMEOUT=120

# Logging
LOG_LEVEL=info
PYTHONUNBUFFERED=1
```

#### Docker Stack

```yaml
# /opt/falachefe-crewai/docker-stack.yml
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
    deploy:
      labels:
        # HTTPS Router
        - "traefik.http.routers.crewai-https.rule=Host(`api.falachefe.app.br`)"
        - "traefik.http.routers.crewai-https.entrypoints=websecure"
        - "traefik.http.routers.crewai-https.tls=true"
        - "traefik.http.routers.crewai-https.tls.certresolver=letsencrypt"
        
        # Load Balancer
        - "traefik.http.services.crewai.loadbalancer.server.port=8000"
```

#### Endpoints Públicos

```
https://api.falachefe.app.br/health
https://api.falachefe.app.br/metrics
https://api.falachefe.app.br/process
https://api.falachefe.app.br/process-audio
https://api.falachefe.app.br/process-image
https://api.falachefe.app.br/process-document
```

---

## 🔄 Fluxo de Comunicação

### Cenário 1: Webhook WhatsApp

```
1. WhatsApp → UAZAPI
2. UAZAPI → Webhook: https://falachefe.app.br/api/webhook/uaz
3. Next.js processa webhook
4. MessageRouter analisa mensagem
5. Next.js → API CrewAI: https://api.falachefe.app.br/process
6. CrewAI processa com agentes
7. CrewAI → Next.js (resposta)
8. Next.js → UAZAPI (enviar resposta)
9. UAZAPI → WhatsApp → Usuário
```

### Cenário 2: Dashboard (Frontend)

```
1. Usuário acessa: https://falachefe.app.br/dashboard
2. Browser carrega React app
3. React chama: https://falachefe.app.br/api/messages/list
4. Next.js API responde com dados
5. React renderiza interface
```

### Cenário 3: Processamento Manual

```
1. Admin: https://falachefe.app.br/admin/process
2. Admin submete mensagem via form
3. Next.js → https://api.falachefe.app.br/process
4. CrewAI processa
5. Next.js recebe resposta
6. Exibe resultado para admin
```

---

## 🔒 Segurança e CORS

### CORS em falachefe.app.br

```typescript
// src/lib/cors.ts
const allowedOrigins = [
  'https://falachefe-plataforma-dq7j.vercel.app',  // Preview Vercel
  'https://falachefe.app.br',                       // Produção
  'https://api.falachefe.app.br',                   // API Externa
  'http://localhost:3000',                          // Dev local
  'http://localhost:3001'
]
```

### Autenticação

- **Better Auth** usa `falachefe.app.br` como `baseURL`
- **Google OAuth** redirect: `https://falachefe.app.br/api/auth/callback/google`
- **Sessões JWT** armazenadas no PostgreSQL (Vercel)

### API CrewAI

- **Sem autenticação pública** (apenas chamadas internas do Next.js)
- **Firewall**: Pode restringir acesso apenas de IPs Vercel (opcional)
- **Rate Limiting**: Implementado no Traefik

---

## 📊 DNS e SSL

### Configuração DNS

| Registro | Tipo | Nome | Valor | TTL |
|----------|------|------|-------|-----|
| Aplicação | CNAME | `@` ou `falachefe.app.br` | `cname.vercel-dns.com` | 3600 |
| API CrewAI | A | `api` | `37.27.248.13` | 3600 |

### SSL/TLS

| Domínio | Provedor | Renovação | Status |
|---------|----------|-----------|--------|
| `falachefe.app.br` | Vercel (automático) | Automática | ✅ |
| `api.falachefe.app.br` | Let's Encrypt via Traefik | Automática | 🟡 Pendente configuração |

---

## 🚀 Deploy e CI/CD

### falachefe.app.br

```bash
# Deploy automático via Vercel
git push origin master

# Ou manual
vercel --prod
```

**Triggers:**
- Push para `master` → Deploy automático
- Pull Request → Deploy preview
- Variáveis de ambiente via Vercel Dashboard

### api.falachefe.app.br

```bash
# SSH no servidor
ssh root@37.27.248.13

# Build da imagem
cd /opt/falachefe-crewai
docker build -t falachefe-crewai:latest .

# Deploy da stack
docker stack deploy -c docker-stack.yml falachefe --with-registry-auth

# Verificar status
docker service ls
docker service logs falachefe_crewai-api -f
```

**Não possui CI/CD automático** (deploy manual)

---

## 🧪 Testes

### falachefe.app.br

```bash
# Teste local
curl https://falachefe.app.br/api/health

# Teste autenticação
curl https://falachefe.app.br/api/auth/session

# Teste webhook
curl -X POST https://falachefe.app.br/api/webhook/uaz \
  -H "Content-Type: application/json" \
  -d '{"event":"message.received","data":{...}}'
```

### api.falachefe.app.br

```bash
# Health check
curl https://api.falachefe.app.br/health

# Teste processamento
curl -X POST https://api.falachefe.app.br/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá, preciso de ajuda",
    "userId": "test-123",
    "phoneNumber": "5511999999999",
    "context": {}
  }'

# Métricas
curl https://api.falachefe.app.br/metrics
```

---

## 📝 Checklist de Configuração

### ✅ Aplicação (falachefe.app.br)

- [x] Código local correto (domínio: `falachefe.app.br`)
- [x] Variável `NEXT_PUBLIC_APP_URL=https://falachefe.app.br`
- [x] Variável `CREWAI_API_URL=https://api.falachefe.app.br`
- [x] Better Auth configurado com `falachefe.app.br`
- [x] CORS permite ambos os domínios
- [ ] Deploy no Vercel
- [ ] DNS apontando para Vercel
- [ ] Webhook UAZAPI configurado

### 🔲 API CrewAI (api.falachefe.app.br)

- [ ] DNS: registro A `api` → `37.27.248.13`
- [ ] Docker Stack com labels Traefik corretos
- [ ] Certificado SSL gerado pelo Let's Encrypt
- [ ] Endpoints `/health`, `/process` respondendo
- [ ] Variável `CREWAI_API_URL` no Vercel configurada
- [ ] Firewall permitindo acesso (portas 80, 443)
- [ ] Logs sem erros

---

## 🔍 Troubleshooting

### Problema: Erro CORS

**Sintoma**: `Access to fetch at 'https://api.falachefe.app.br' from origin 'https://falachefe.app.br' has been blocked by CORS`

**Solução**: Verificar `src/lib/cors.ts` inclui ambos os domínios

### Problema: Autenticação falha

**Sintoma**: Redirect após login falha ou sessão não persiste

**Solução**: 
- Verificar `NEXT_PUBLIC_APP_URL=https://falachefe.app.br`
- Verificar callback Google OAuth aponta para `falachefe.app.br`
- Verificar Better Auth `baseURL` está correto

### Problema: CrewAI não responde

**Sintoma**: Timeout ao chamar `api.falachefe.app.br`

**Solução**:
- Verificar DNS propagou: `dig api.falachefe.app.br`
- Verificar serviço rodando: `ssh root@37.27.248.13 'docker service ls'`
- Verificar logs: `docker service logs falachefe_crewai-api`
- Verificar Traefik: `docker service logs traefik_traefik | grep api.falachefe`

---

## 📞 Suporte

**Documentos Relacionados:**
- `DOMINIO-TRAEFIK-SUCCESS.md` - Setup Traefik no Hetzner
- `DEPLOY-HETZNER-SUCCESS.md` - Deploy inicial Docker Swarm
- `MESSAGE-ROUTER-GUIDE.md` - Sistema de roteamento de mensagens

**Status**: ✅ Documentação Oficial  
**Última Atualização**: 11 de Outubro de 2025

