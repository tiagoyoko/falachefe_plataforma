# ✅ Resumo: Correção da Arquitetura de Domínios

**Data**: 11 de Outubro de 2025  
**Status**: ✅ CORRIGIDO

---

## 🎯 O QUE FOI FEITO

### ❌ Problema Identificado

No commit `7804ae6` (10/10/2025), foram feitas alterações **INCORRETAS** que mudaram o domínio da aplicação Next.js de `falachefe.app.br` para `api.falachefe.app.br`.

**Arquitetura Incorreta**:
```
Aplicação Next.js → api.falachefe.app.br ❌
API CrewAI → api.falachefe.app.br ❌
```

### ✅ Correção Aplicada

**Arquitetura Correta**:
```
Aplicação Next.js → falachefe.app.br ✅ (Vercel)
API CrewAI → api.falachefe.app.br ✅ (Hetzner)
```

---

## 📝 ARQUIVOS CORRIGIDOS

### 1. vercel.json ✅

**Revertido**:
- `NEXT_PUBLIC_APP_URL`: `api.falachefe.app.br` → `falachefe.app.br`
- Header CORS: `api.falachefe.app.br` → `falachefe.app.br`

### 2. src/lib/cors.ts ✅

**Revertido**:
- Adicionado `falachefe.app.br` em `allowedOrigins`
- Mantido `api.falachefe.app.br` (para comunicação com API)
- Origem padrão: `api.falachefe.app.br` → `falachefe.app.br`

### 3. src/lib/auth/auth.ts ✅

**Revertido**:
- `baseURL`: `api.falachefe.app.br` → `falachefe.app.br`

### 4. src/lib/auth/auth-client.ts ✅

**Revertido**:
- `baseURL`: `api.falachefe.app.br` → `falachefe.app.br`

### 5. config/env.example ✅

**Revertido e melhorado**:
- `UAZ_WEBHOOK_URL`: `api.falachefe.app.br` → `falachefe.app.br`
- **Adicionado**: `CREWAI_API_URL=https://api.falachefe.app.br`

### 6. src/lib/message-routing/message-router.ts ✅

**Mantido correto** (já estava usando `api.falachefe.app.br` para chamadas à API CrewAI)

---

## 📚 DOCUMENTAÇÃO CRIADA

### 1. ARQUITETURA-DOMINIOS.md ✅ NOVO

Documentação completa explicando:
- Separação de domínios e responsabilidades
- Fluxos de comunicação
- Configurações por domínio
- Troubleshooting
- Testes e validação

### 2. ATUALIZACAO-DOMINIO-API.md ✅ ATUALIZADO

Guia passo a passo **APENAS** para configurar `api.falachefe.app.br` no servidor Hetzner:
- Configuração DNS
- Docker Stack com Traefik
- Testes e validação
- Não altera mais arquivos da aplicação

### 3. RESUMO-ATUALIZACAO-DOMINIO.md ✅ ATUALIZADO

Este arquivo - resumo das correções aplicadas

---

## 🏗️ ARQUITETURA FINAL

```
┌─────────────────────────────────────┐
│    falachefe.app.br (Vercel)        │
│                                      │
│  • Aplicação Next.js 15              │
│  • Frontend React 19                 │
│  • Backend API Routes                │
│  • Autenticação (Better Auth)        │
│  • Webhooks UAZAPI                   │
│  • NEXT_PUBLIC_APP_URL =             │
│    https://falachefe.app.br          │
└──────────┬──────────────────────────┘
           │
           │ HTTP Request
           │ CREWAI_API_URL =
           │ https://api.falachefe.app.br
           │
           ▼
┌─────────────────────────────────────┐
│  api.falachefe.app.br (Hetzner)     │
│                                      │
│  • API CrewAI (Python)               │
│  • Orchestrator + Agentes            │
│  • Processamento IA                  │
│  • Docker Swarm                      │
│  • Traefik (Proxy + SSL)             │
│  • Endpoints: /process, /health      │
└─────────────────────────────────────┘
```

---

## 🔍 COMPARAÇÃO: ANTES vs DEPOIS

### Variáveis de Ambiente

| Variável | ❌ Incorreto (antes) | ✅ Correto (depois) |
|----------|---------------------|---------------------|
| `NEXT_PUBLIC_APP_URL` | `api.falachefe.app.br` | `falachefe.app.br` |
| `CREWAI_API_URL` | (não existia) | `api.falachefe.app.br` |
| Better Auth `baseURL` | `api.falachefe.app.br` | `falachefe.app.br` |
| Auth Client `baseURL` | `api.falachefe.app.br` | `falachefe.app.br` |
| CORS default origin | `api.falachefe.app.br` | `falachefe.app.br` |
| UAZ Webhook URL | `api.falachefe.app.br/api/...` | `falachefe.app.br/api/...` |

### Fluxo de Autenticação

**❌ Antes (Incorreto)**:
```
Google OAuth → api.falachefe.app.br/api/auth/callback/google
                ↓
              ERRO: Domínio não existe ainda
```

**✅ Depois (Correto)**:
```
Google OAuth → falachefe.app.br/api/auth/callback/google
                ↓
              ✅ Funciona (já deployado no Vercel)
```

### Fluxo de Webhook WhatsApp

**❌ Antes (Incorreto)**:
```
UAZAPI → api.falachefe.app.br/api/webhook/uaz
          ↓
        ERRO: Domínio não existe
```

**✅ Depois (Correto)**:
```
UAZAPI → falachefe.app.br/api/webhook/uaz
          ↓
        Next.js processa
          ↓
        Chama: api.falachefe.app.br/process
          ↓
        CrewAI processa e responde
```

---

## ✅ STATUS ATUAL

### Código Local (Aplicação Next.js)

| Item | Status |
|------|--------|
| Domínio corrigido para `falachefe.app.br` | ✅ |
| CORS permite ambos domínios | ✅ |
| Better Auth aponta para `falachefe.app.br` | ✅ |
| MessageRouter chama `api.falachefe.app.br` | ✅ |
| Variável `CREWAI_API_URL` documentada | ✅ |
| Documentação completa | ✅ |

### Ainda Precisa Fazer (Servidor Hetzner)

| Item | Status |
|------|--------|
| DNS: `api` → `37.27.248.13` | ⏳ Pendente |
| Docker Stack com labels Traefik | ⏳ Pendente |
| Certificado SSL Let's Encrypt | ⏳ Pendente |
| Variável `CREWAI_API_URL` no Vercel | ⏳ Pendente |
| Testes de integração | ⏳ Pendente |

---

## 🚀 PRÓXIMOS PASSOS

### 1. Commitar Correções (AGORA)

```bash
cd /Users/tiagoyokoyama/Falachefe

# Ver arquivos alterados
git status

# Adicionar correções
git add \
  vercel.json \
  src/lib/cors.ts \
  src/lib/auth/auth.ts \
  src/lib/auth/auth-client.ts \
  config/env.example \
  ARQUITETURA-DOMINIOS.md \
  ATUALIZACAO-DOMINIO-API.md \
  RESUMO-ATUALIZACAO-DOMINIO.md

# Commit
git commit -m "fix: corrigir arquitetura de domínios

- Reverter mudanças incorretas do commit 7804ae6
- Aplicação Next.js permanece em falachefe.app.br
- API CrewAI será movida para api.falachefe.app.br
- Adicionar documentação completa da arquitetura
- Documentar variável CREWAI_API_URL"

# Push
git push origin master
```

### 2. Deploy no Vercel (se necessário)

```bash
# Se houve mudanças relevantes, redeploy
vercel --prod
```

### 3. Configurar Servidor Hetzner

Seguir guia: **`ATUALIZACAO-DOMINIO-API.md`**

Passos:
1. DNS: adicionar registro A `api` → `37.27.248.13`
2. SSH no servidor e editar `docker-stack.yml`
3. Deploy da stack com Traefik
4. Aguardar certificado SSL
5. Testar endpoints

**Tempo estimado**: 30-45 minutos

### 4. Atualizar Variável no Vercel

```bash
# Via CLI
echo "https://api.falachefe.app.br" | vercel env add CREWAI_API_URL production
vercel --prod

# Ou via Dashboard:
# https://vercel.com → Settings → Environment Variables
# Adicionar: CREWAI_API_URL = https://api.falachefe.app.br
```

### 5. Validação Final

```bash
# Testar aplicação
curl https://falachefe.app.br

# Testar API
curl https://api.falachefe.app.br/health

# Testar integração
curl -X POST https://falachefe.app.br/api/test-crewai \
  -H "Content-Type: application/json" \
  -d '{"message":"teste"}'
```

---

## 📊 RESUMO DAS MUDANÇAS

### Commits

| Commit | Descrição | Status |
|--------|-----------|--------|
| `7804ae6` (10/10) | ❌ Mudanças incorretas | Revertido |
| **NOVO** (11/10) | ✅ Correção da arquitetura | Pronto para commit |

### Arquivos Modificados

```
/Users/tiagoyokoyama/Falachefe/
├── vercel.json                              ✅ Corrigido
├── config/env.example                       ✅ Corrigido + melhorado
├── src/lib/
│   ├── cors.ts                              ✅ Corrigido
│   └── auth/
│       ├── auth.ts                          ✅ Corrigido
│       └── auth-client.ts                   ✅ Corrigido
├── src/lib/message-routing/
│   └── message-router.ts                    ✅ Já estava correto
├── ARQUITETURA-DOMINIOS.md                  ✅ NOVO
├── ATUALIZACAO-DOMINIO-API.md               ✅ Atualizado
└── RESUMO-ATUALIZACAO-DOMINIO.md            ✅ Este arquivo
```

---

## 🎯 CHECKLIST FINAL

### Código Local ✅

- [x] vercel.json usa `falachefe.app.br`
- [x] CORS permite ambos domínios
- [x] Better Auth usa `falachefe.app.br`
- [x] Auth Client usa `falachefe.app.br`
- [x] MessageRouter chama `api.falachefe.app.br`
- [x] env.example documenta `CREWAI_API_URL`
- [x] Documentação completa criada

### Deploy Vercel ⏳

- [ ] Commit e push das correções
- [ ] Deploy no Vercel (se necessário)
- [ ] Adicionar variável `CREWAI_API_URL`
- [ ] Verificar aplicação funcionando

### Servidor Hetzner ⏳

- [ ] DNS configurado
- [ ] Docker Stack atualizado
- [ ] Certificado SSL gerado
- [ ] Endpoints respondendo
- [ ] Logs sem erros

### Validação ⏳

- [ ] `falachefe.app.br` acessível
- [ ] `api.falachefe.app.br/health` OK
- [ ] Autenticação funcionando
- [ ] Webhook UAZAPI funcionando
- [ ] Integração CrewAI funcionando

---

## 📞 SUPORTE

### Documentação

- 📖 **`ARQUITETURA-DOMINIOS.md`** - Visão completa da arquitetura
- 🛠️ **`ATUALIZACAO-DOMINIO-API.md`** - Guia de setup do servidor
- 📋 **`RESUMO-ATUALIZACAO-DOMINIO.md`** - Este arquivo

### Comandos Rápidos

```bash
# Ver status
git status

# Testar aplicação local
npm run dev

# Testar API (após deploy)
curl https://api.falachefe.app.br/health

# SSH servidor
ssh root@37.27.248.13

# Logs servidor
ssh root@37.27.248.13 'docker service logs falachefe_crewai-api -f'
```

---

## ✅ CONCLUSÃO

**Status**: Código corrigido, pronto para commit e deploy

**O que mudou**:
- ✅ Aplicação permanece em `falachefe.app.br`
- ✅ API CrewAI será configurada em `api.falachefe.app.br`
- ✅ Arquitetura documentada e clara
- ✅ Fluxos de comunicação definidos

**Próxima ação**: Commitar mudanças e seguir guia de setup do servidor

---

**Última Atualização**: 11 de Outubro de 2025  
**Status**: ✅ Pronto para execução
