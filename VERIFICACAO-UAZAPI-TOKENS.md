# 🔍 Verificação Completa UAZAPI Tokens
**Data:** 13 de outubro de 2025  
**Token Correto:** `4fbeda58-0b8a-4905-9218-8ec89967a4a4`

---

## ✅ Status por Ambiente

### 1. **`.env.local`** (Desenvolvimento Local) ✅ **CORRETO**
```bash
UAZAPI_TOKEN="4fbeda58-0b8a-4905-9218-8ec89967a4a4"
UAZAPI_INSTANCE_TOKEN="4fbeda58-0b8a-4905-9218-8ec89967a4a4"
```
**Status:** ✅ Nenhuma ação necessária

---

### 2. **`crewai-projects/falachefe_crew/.env`** (Dev CrewAI Local) ❌ **INCORRETO**
```bash
# ATUAL (ERRADO):
UAZAPI_TOKEN="6818e86e-ddf2-436c-952c-0d190b627624"
UAZAPI_INSTANCE_TOKEN="6818e86e-ddf2-436c-952c-0d190b627624"

# DEVE SER:
UAZAPI_TOKEN="4fbeda58-0b8a-4905-9218-8ec89967a4a4"
UAZAPI_INSTANCE_TOKEN="4fbeda58-0b8a-4905-9218-8ec89967a4a4"
```
**Status:** ❌ **REQUER CORREÇÃO**

---

### 3. **`crewai-projects/falachefe_crew/.env.production`** ⚠️ **PARCIAL**
```bash
# ATUAL:
UAZAPI_TOKEN=4fbeda58-0b8a-4905-9218-8ec89967a4a4 ✅
UAZAPI_INSTANCE_TOKEN=AUSENTE ❌

# DEVE ADICIONAR:
UAZAPI_INSTANCE_TOKEN=4fbeda58-0b8a-4905-9218-8ec89967a4a4
```
**Status:** ⚠️ **REQUER ADICIONAR VARIÁVEL**

---

### 4. **`.env.vercel`** (Arquivo Local Vercel) ❌ **INCORRETO**
```bash
# ATUAL (ERRADO):
UAZAPI_TOKEN="6818e86e-ddf2-436c-952c-0d190b627624"
UAZAPI_INSTANCE_TOKEN="6818e86e-ddf2-436c-952c-0d190b627624"

# DEVE SER:
UAZAPI_TOKEN="4fbeda58-0b8a-4905-9218-8ec89967a4a4"
UAZAPI_INSTANCE_TOKEN="4fbeda58-0b8a-4905-9218-8ec89967a4a4"
```
**Status:** ❌ **REQUER CORREÇÃO**

---

### 5. **Servidor Hetzner** (`37.27.248.13:/opt/falachefe-crewai/.env`) ⚠️ **PARCIAL**
```bash
# ATUAL:
UAZAPI_TOKEN=4fbeda58-0b8a-4905-9218-8ec89967a4a4 ✅
UAZAPI_INSTANCE_TOKEN=AUSENTE ❌

# DEVE ADICIONAR:
UAZAPI_INSTANCE_TOKEN=4fbeda58-0b8a-4905-9218-8ec89967a4a4
```
**Status:** ⚠️ **REQUER ADICIONAR VARIÁVEL**

---

### 6. **Vercel Produção** (Dashboard/CLI) ❌ **PARCIALMENTE INCORRETO**
```bash
# ATUAL:
UAZAPI_TOKEN="4fbeda58-0b8a-4905-9218-8ec89967a4a4" ✅ CORRETO
UAZAPI_INSTANCE_TOKEN="6818e86e-ddf2-436c-952c-0d190b627624" ❌ INCORRETO

# DEVE CORRIGIR:
UAZAPI_INSTANCE_TOKEN="4fbeda58-0b8a-4905-9218-8ec89967a4a4"
```
**URL Dashboard:** https://vercel.com/tiagos-projects-a1qqodu5/falachefe/settings/environment-variables

**Status:** ❌ **REQUER CORREÇÃO NO DASHBOARD**

---

## 📋 Resumo de Ações Necessárias

| Arquivo/Ambiente | Status | Ação |
|-----------------|--------|------|
| `.env.local` | ✅ Correto | Nenhuma |
| `crewai-projects/falachefe_crew/.env` | ❌ Incorreto | Corrigir ambos tokens |
| `crewai-projects/falachefe_crew/.env.production` | ⚠️ Parcial | Adicionar INSTANCE_TOKEN |
| `.env.vercel` | ❌ Incorreto | Corrigir ambos tokens |
| Servidor Hetzner | ⚠️ Parcial | Adicionar INSTANCE_TOKEN |
| **Vercel Produção** | ❌ **Parcial** | **Corrigir INSTANCE_TOKEN** |

---

## 🔧 Plano de Correção

### Etapa 1: Arquivos Locais
1. ✅ Corrigir `crewai-projects/falachefe_crew/.env`
2. ✅ Adicionar variável em `crewai-projects/falachefe_crew/.env.production`
3. ✅ Corrigir `.env.vercel`

### Etapa 2: Servidor Hetzner
1. ✅ Adicionar `UAZAPI_INSTANCE_TOKEN` no arquivo `.env`
2. ✅ Reiniciar stack Docker para aplicar mudanças

### Etapa 3: Vercel Produção ⚠️ **CRÍTICO**
1. ✅ Corrigir `UAZAPI_INSTANCE_TOKEN` no dashboard
   - Valor atual: `6818e86e-ddf2-436c-952c-0d190b627624`
   - Valor correto: `4fbeda58-0b8a-4905-9218-8ec89967a4a4`
2. ✅ Redeployar para aplicar mudanças

---

## ⚠️ Impacto

**Ambientes Afetados:**
- ❌ Desenvolvimento CrewAI local
- ❌ Arquivo de referência Vercel local
- ⚠️ Produção Hetzner (parcial - falta INSTANCE_TOKEN)
- ❌ **PRODUÇÃO VERCEL (INSTANCE_TOKEN incorreto)** ⚠️ **CRÍTICO**

**Funcionalidade Impactada:**
- 🚨 **Produção:** Envio de mensagens WhatsApp pode falhar
- 🚨 **Produção:** Webhook UAZAPI pode não autenticar corretamente
- 🚨 **Produção:** Integração WhatsApp usando token misto (TOKEN correto, INSTANCE_TOKEN errado)

---

## 🚀 Próximos Passos

1. ✅ **Executar correções automáticas** (arquivos locais + Hetzner)
2. 🚨 **URGENTE: Corrigir Vercel Produção** via dashboard
   - Dashboard: https://vercel.com/tiagos-projects-a1qqodu5/falachefe/settings/environment-variables
   - Alterar `UAZAPI_INSTANCE_TOKEN` para `4fbeda58-0b8a-4905-9218-8ec89967a4a4`
   - Redeployar para aplicar
3. ✅ **Testar integração** WhatsApp após correções
4. ✅ **Validar** webhook UAZAPI funcionando

---

## 📝 Comandos para Correção

### Arquivos Locais
```bash
# Será executado automaticamente
```

### Servidor Hetzner
```bash
ssh root@37.27.248.13 "echo 'UAZAPI_INSTANCE_TOKEN=4fbeda58-0b8a-4905-9218-8ec89967a4a4' >> /opt/falachefe-crewai/.env && cd /opt/falachefe-crewai && docker stack deploy -c docker-compose.yml falachefe"
```

### Vercel Produção (Manual)
```bash
# Via Dashboard ou CLI:
vercel env rm UAZAPI_INSTANCE_TOKEN production
vercel env add UAZAPI_INSTANCE_TOKEN production
# Valor: 4fbeda58-0b8a-4905-9218-8ec89967a4a4
vercel --prod
```

