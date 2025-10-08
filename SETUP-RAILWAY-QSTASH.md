# 🚀 Setup: Railway + Upstash QStash

Guia completo para deploy da API CrewAI no Railway com fila QStash.

---

## 📋 **PRÉ-REQUISITOS**

1. ✅ Conta Upstash (gratuita) - https://upstash.com
2. ✅ Conta Railway (gratuita - $5 crédito) - https://railway.app
3. ✅ Git configurado

---

## 🔧 **PASSO 1: Configurar Upstash QStash**

### 1.1 Criar conta Upstash
1. Acesse: https://upstash.com
2. Sign up (gratuito)
3. Faça login

### 1.2 Obter credenciais QStash
1. No dashboard Upstash, vá em **QStash**
2. Clique em **Get Started** (se for primeira vez)
3. **Copie as credenciais:**
   ```
   QSTASH_TOKEN=eyJ...
   QSTASH_CURRENT_SIGNING_KEY=sig_...
   QSTASH_NEXT_SIGNING_KEY=sig_...
   ```

### 1.3 Configurar no Next.js (.env.local)
```bash
# Adicionar ao .env.local
QSTASH_TOKEN=eyJ...
```

### 1.4 Configurar na Vercel
```bash
cd /Users/tiagoyokoyama/Falachefe

# Adicionar QSTASH_TOKEN na Vercel
echo "SEU_QSTASH_TOKEN_AQUI" | vercel env add QSTASH_TOKEN production
```

---

## 🚂 **PASSO 2: Deploy no Railway**

### 2.1 Preparar repositório
```bash
cd /Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew

# Verificar arquivos criados
ls -la api_server.py
ls -la requirements-api.txt
ls -la Procfile
ls -la railway.json
```

### 2.2 Criar projeto no Railway

**Opção A: Via CLI (Recomendado)**
```bash
# Instalar Railway CLI
npm install -g @railway/cli

# Login
railway login

# Inicializar projeto
railway init

# Definir variáveis de ambiente
railway variables set OPENAI_API_KEY="sk-proj-..."
railway variables set UAZAPI_BASE_URL="https://falachefe.uazapi.com"
railway variables set UAZAPI_TOKEN="4fbeda58-0b8a-4905-9218-8ec89967a4a4"
railway variables set QSTASH_CURRENT_SIGNING_KEY="sig_..."
railway variables set QSTASH_NEXT_SIGNING_KEY="sig_..."

# Deploy
railway up
```

**Opção B: Via Dashboard**
1. Acesse: https://railway.app
2. Clique em **New Project**
3. Escolha **Deploy from GitHub repo**
4. Selecione o repositório `falachefe_plataforma`
5. **Root Directory**: `/crewai-projects/falachefe_crew`
6. **Build Command**: `pip install -r requirements-api.txt`
7. **Start Command**: `gunicorn api_server:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120`

### 2.3 Configurar variáveis de ambiente no Railway

No dashboard do Railway, vá em **Variables** e adicione:

```bash
# OpenAI (obrigatório)
OPENAI_API_KEY=sk-proj-SEU_TOKEN_OPENAI_AQUI

# UAZAPI (para enviar mensagens)
UAZAPI_BASE_URL=https://falachefe.uazapi.com
UAZAPI_TOKEN=4fbeda58-0b8a-4905-9218-8ec89967a4a4

# QStash (para validação de assinatura)
QSTASH_CURRENT_SIGNING_KEY=(copiar do Upstash)
QSTASH_NEXT_SIGNING_KEY=(copiar do Upstash)

# Database PostgreSQL (opcional)
POSTGRES_URL=postgres://postgres.zpdartuyaergbxmbmtur:Kv4QRf4P4dUakepm@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require
```

### 2.4 Obter URL do Railway

Após deploy, copie a URL gerada:
```
https://falachefe-crewai.up.railway.app
```

---

## 🔗 **PASSO 3: Conectar Next.js com Railway**

### 3.1 Adicionar URL do Railway no .env.local
```bash
# Adicionar ao .env.local
RAILWAY_WORKER_URL=https://falachefe-crewai.up.railway.app
CREWAI_API_URL=https://falachefe-crewai.up.railway.app
```

### 3.2 Adicionar na Vercel
```bash
cd /Users/tiagoyokoyama/Falachefe

# Adicionar variável
echo "https://falachefe-crewai.up.railway.app" | vercel env add RAILWAY_WORKER_URL production
echo "https://falachefe-crewai.up.railway.app" | vercel env add CREWAI_API_URL production
```

---

## 🧪 **PASSO 4: Testar**

### 4.1 Testar API Railway diretamente
```bash
curl -X POST "https://falachefe-crewai.up.railway.app/process" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Qual meu saldo?",
    "userId": "test-123",
    "phoneNumber": "5511994066248",
    "context": {
      "conversationId": "test-conv",
      "isNewUser": false
    }
  }'
```

**Resposta esperada:**
```json
{
  "success": true,
  "response": "Resposta do CrewAI...",
  "sent_to_user": true,
  "metadata": {...}
}
```

### 4.2 Testar fluxo completo
```bash
# Enviar mensagem WhatsApp para +55 47 9194-5151
# Mensagem: "Qual meu saldo?"

# Aguardar 10-30 segundos
# Você deve receber resposta no seu celular (+55 11 99406-6248)
```

---

## 📊 **FLUXO FINAL**

```
┌─────────────────────────────────────────┐
│ 1. Você envia mensagem WhatsApp         │
│    +55 11 99406-6248 → +55 47 9194-5151│
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 2. UAZAPI → Webhook Vercel              │
│    POST falachefe.app.br/api/webhook/uaz│
│    ⏱️  <500ms                            │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 3. Webhook valida + salva + enfileira   │
│    ✅ MessageService (PostgreSQL)       │
│    📬 QStash.publish()                  │
│    ✅ Retorna 200 OK                    │
│    ⏱️  <1s                               │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 4. QStash → Railway API                 │
│    POST railway.app/process             │
│    🔄 Retry automático se falhar        │
│    ⏱️  <1s                               │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 5. Railway processa com CrewAI          │
│    🤖 FalachefeCrew.kickoff()           │
│    ⏱️  10-30s (SEM timeout!)            │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 6. Railway → UAZAPI                     │
│    POST uazapi.com/send/text            │
│    📤 Envia resposta ao usuário         │
│    ⏱️  <1s                               │
└─────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────┐
│ 7. Você recebe resposta! 📱             │
│    +55 11 99406-6248                    │
└─────────────────────────────────────────┘
```

**Tempo total:** 12-32 segundos  
**Sem timeout!** Railway pode processar quanto precisar.

---

## 🎯 **PRÓXIMOS PASSOS**

Agora execute na ordem:

```bash
# 1. Obter QStash Token
# Acesse: https://console.upstash.com/qstash

# 2. Deploy no Railway
cd crewai-projects/falachefe_crew
railway login
railway init
railway variables set OPENAI_API_KEY="..."
railway variables set UAZAPI_TOKEN="4fbeda58-0b8a-4905-9218-8ec89967a4a4"
railway variables set UAZAPI_BASE_URL="https://falachefe.uazapi.com"
railway up

# 3. Copiar URL gerada pelo Railway
# Exemplo: https://falachefe-crewai.up.railway.app

# 4. Configurar na Vercel
cd ../..
echo "SUA_URL_RAILWAY" | vercel env add RAILWAY_WORKER_URL production
echo "SEU_QSTASH_TOKEN" | vercel env add QSTASH_TOKEN production

# 5. Redeploy Vercel
git add -A
git commit -m "feat: integrar Railway + QStash para processamento assíncrono"
git push

# 6. Testar!
# Envie mensagem WhatsApp para +55 47 9194-5151
```

---

## 📝 **VARIÁVEIS NECESSÁRIAS**

### Railway:
```
OPENAI_API_KEY
UAZAPI_BASE_URL
UAZAPI_TOKEN
QSTASH_CURRENT_SIGNING_KEY (opcional)
QSTASH_NEXT_SIGNING_KEY (opcional)
```

### Vercel:
```
QSTASH_TOKEN
RAILWAY_WORKER_URL
CREWAI_API_URL
```

---

Quer que eu te ajude com algum desses passos? 🚀

