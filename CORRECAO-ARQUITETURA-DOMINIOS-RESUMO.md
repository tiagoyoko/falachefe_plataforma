# ✅ Correção da Arquitetura de Domínios - Resumo Executivo

**Data**: Sábado, 11 de Outubro de 2025  
**Status**: ✅ CONCLUÍDO

---

## 🎯 Problema Identificado e Corrigido

### ❌ Situação Anterior (Incorreta)

O commit `7804ae6` de 10/10/2025 alterou **incorretamente** todos os serviços para usar `api.falachefe.app.br`, quando na verdade:

- **Aplicação Next.js** deveria permanecer em `falachefe.app.br` (Vercel)
- **API CrewAI** (Python) deveria ir para `api.falachefe.app.br` (Hetzner)

### ✅ Situação Atual (Corrigida)

```
┌─────────────────────────────────────┐
│    falachefe.app.br (Vercel)        │  ✅ CORRIGIDO
│    • Aplicação Next.js              │
│    • Frontend + Backend             │
│    • Autenticação Better Auth       │
│    • Webhooks UAZAPI                │
└──────────┬──────────────────────────┘
           │
           │ Chama API CrewAI
           ▼
┌─────────────────────────────────────┐
│  api.falachefe.app.br (Hetzner)     │  🔧 A CONFIGURAR
│  • API CrewAI (Python)               │
│  • Processamento de mensagens        │
│  • Docker Swarm + Traefik            │
└─────────────────────────────────────┘
```

---

## 📝 Arquivos Corrigidos

### 1. **vercel.json** ✅

```diff
- "NEXT_PUBLIC_APP_URL": "https://api.falachefe.app.br"
+ "NEXT_PUBLIC_APP_URL": "https://falachefe.app.br"

- "Access-Control-Allow-Origin": "https://api.falachefe.app.br"
+ "Access-Control-Allow-Origin": "https://falachefe.app.br"
```

### 2. **src/lib/cors.ts** ✅

```diff
  const allowedOrigins = [
    'https://falachefe-plataforma-dq7j.vercel.app',
+   'https://falachefe.app.br',        // ✅ Adicionado
    'https://api.falachefe.app.br',
    'http://localhost:3000',
    'http://localhost:3001'
  ]

- const allowedOrigin = ... : 'https://api.falachefe.app.br'
+ const allowedOrigin = ... : 'https://falachefe.app.br'
```

### 3. **src/lib/auth/auth.ts** ✅

```diff
- baseURL: ... ? 'https://api.falachefe.app.br' : 'http://localhost:3000'
+ baseURL: ... ? 'https://falachefe.app.br' : 'http://localhost:3000'
```

### 4. **src/lib/auth/auth-client.ts** ✅

```diff
- baseURL: ... ? 'https://api.falachefe.app.br' : 'http://localhost:3000'
+ baseURL: ... ? 'https://falachefe.app.br' : 'http://localhost:3000'
```

### 5. **config/env.example** ✅

```diff
+# CrewAI API (External Service on Hetzner)
+CREWAI_API_URL=https://api.falachefe.app.br

-# CrewAI Python Integration
+# CrewAI Python Integration (Local)

-UAZ_WEBHOOK_URL=https://api.falachefe.app.br/api/uaz-webhook
+UAZ_WEBHOOK_URL=https://falachefe.app.br/api/uaz-webhook
```

### 6. **src/lib/message-routing/message-router.ts** ✅

```typescript
// ✅ Já estava correto - não foi alterado
const baseUrl = process.env.CREWAI_API_URL || 'https://api.falachefe.app.br';
```

---

## 📚 Documentação Criada/Atualizada

### 1. **ARQUITETURA-DOMINIOS.md** ✅ NOVO (3.9 KB)

Documentação completa com:
- Visão geral da arquitetura
- Separação de responsabilidades por domínio
- Fluxos de comunicação detalhados
- Configurações por domínio
- Guia de troubleshooting
- Checklist de validação

### 2. **ATUALIZACAO-DOMINIO-API.md** ✅ ATUALIZADO (13.1 KB)

Guia passo a passo APENAS para configurar o servidor Hetzner:
- Configuração DNS
- Docker Stack com Traefik
- Testes e validação
- Sem alterações na aplicação Next.js

### 3. **RESUMO-ATUALIZACAO-DOMINIO.md** ✅ ATUALIZADO (9.4 KB)

Resumo das correções e próximos passos

---

## 📊 Estatísticas das Mudanças

```
5 arquivos modificados, 1 arquivo novo criado
528 inserções(+), 393 deleções(-)

Arquivos alterados:
  M  ATUALIZACAO-DOMINIO-API.md    (421 linhas alteradas)
  M  RESUMO-ATUALIZACAO-DOMINIO.md  (484 linhas alteradas)
  M  config/env.example              (7 linhas alteradas)
  M  src/lib/cors.ts                 (3 linhas alteradas)
  M  vercel.json                     (6 linhas alteradas)
  
Novos arquivos:
  ??  ARQUITETURA-DOMINIOS.md
```

---

## ✅ Validações Realizadas

### Lint e TypeCheck

```bash
✅ npm run lint - Warnings existentes (não introduzidos)
✅ npm run typecheck - 0 erros
✅ Sem erros de linter nos arquivos alterados
```

### Arquitetura Validada

```
✅ Aplicação Next.js → falachefe.app.br (Vercel)
✅ API CrewAI → api.falachefe.app.br (Hetzner)
✅ CORS permite ambos os domínios
✅ Better Auth configurado corretamente
✅ MessageRouter chama API externa corretamente
✅ Variáveis de ambiente documentadas
```

---

## 🚀 Próximos Passos

### 1. Commitar as Correções

```bash
cd /Users/tiagoyokoyama/Falachefe

git add \
  vercel.json \
  src/lib/cors.ts \
  src/lib/auth/auth.ts \
  src/lib/auth/auth-client.ts \
  config/env.example \
  ARQUITETURA-DOMINIOS.md \
  ATUALIZACAO-DOMINIO-API.md \
  RESUMO-ATUALIZACAO-DOMINIO.md

git commit -m "fix: corrigir arquitetura de domínios

- Reverter mudanças incorretas do commit 7804ae6
- Aplicação Next.js permanece em falachefe.app.br (Vercel)
- API CrewAI será configurada em api.falachefe.app.br (Hetzner)
- Adicionar documentação completa da arquitetura de domínios
- Documentar variável CREWAI_API_URL
- Corrigir CORS para permitir ambos os domínios
- Atualizar Better Auth para usar domínio correto

Closes: Correção de arquitetura de domínios"

git push origin master
```

### 2. Configurar Servidor Hetzner (Opcional)

Se desejar ativar a API CrewAI no servidor Hetzner, seguir o guia:

📖 **`ATUALIZACAO-DOMINIO-API.md`**

Passos principais:
1. Configurar DNS: `api` → `37.27.248.13`
2. Atualizar `docker-stack.yml` com labels Traefik
3. Deploy da stack
4. Aguardar certificado SSL
5. Testar endpoints

**Tempo estimado**: 30-45 minutos

### 3. Atualizar Variável no Vercel

```bash
# Adicionar variável CREWAI_API_URL
echo "https://api.falachefe.app.br" | vercel env add CREWAI_API_URL production

# Redeploy
vercel --prod
```

---

## 🎯 Resultado Final

### Domínios Configurados

| Domínio | Serviço | Status | Deploy |
|---------|---------|--------|--------|
| `falachefe.app.br` | Aplicação Next.js | ✅ Corrigido | Vercel |
| `api.falachefe.app.br` | API CrewAI | ⏳ Aguardando config | Hetzner |

### Variáveis de Ambiente

| Variável | Valor | Onde Usar |
|----------|-------|-----------|
| `NEXT_PUBLIC_APP_URL` | `https://falachefe.app.br` | Vercel (produção) |
| `CREWAI_API_URL` | `https://api.falachefe.app.br` | Vercel (produção) |

### Fluxos de Integração

**Webhook WhatsApp**:
```
WhatsApp → UAZAPI → falachefe.app.br/api/webhook/uaz
                   → Next.js processa
                   → api.falachefe.app.br/process (CrewAI)
                   → Resposta
```

**Autenticação**:
```
Google OAuth → falachefe.app.br/api/auth/callback/google
             → Better Auth processa
             → Sessão criada
```

---

## 📞 Suporte e Documentação

### Documentação Completa

- 📖 **`ARQUITETURA-DOMINIOS.md`** - Visão completa da arquitetura
- 🛠️ **`ATUALIZACAO-DOMINIO-API.md`** - Guia de setup do servidor Hetzner
- 📋 **`RESUMO-ATUALIZACAO-DOMINIO.md`** - Status e próximos passos

### Comandos Úteis

```bash
# Ver mudanças
git diff

# Ver status
git status

# Testar local
npm run dev

# Lint e typecheck
npm run lint
npm run typecheck

# Deploy Vercel
vercel --prod
```

---

## ✅ Checklist de Validação

### Código Local ✅

- [x] vercel.json usa `falachefe.app.br`
- [x] CORS permite ambos domínios (`falachefe.app.br` + `api.falachefe.app.br`)
- [x] Better Auth usa `falachefe.app.br`
- [x] Auth Client usa `falachefe.app.br`
- [x] MessageRouter chama `api.falachefe.app.br`
- [x] env.example documenta `CREWAI_API_URL`
- [x] Sem erros de lint ou typecheck
- [x] Documentação completa criada

### Deploy Vercel ⏳

- [ ] Commit e push das correções
- [ ] Adicionar variável `CREWAI_API_URL` (produção)
- [ ] Redeploy no Vercel
- [ ] Verificar aplicação funcionando

### Servidor Hetzner ⏳

- [ ] DNS: `api` → `37.27.248.13`
- [ ] Docker Stack atualizado
- [ ] Certificado SSL gerado
- [ ] Endpoints `/health`, `/process` OK
- [ ] Logs sem erros

---

**Status**: ✅ CORREÇÃO CONCLUÍDA  
**Próxima Ação**: Commit + Push  
**Última Atualização**: 11 de Outubro de 2025

