# 🚂 Deploy CrewAI API no Railway

Guia passo a passo para fazer deploy da API CrewAI no Railway.

---

## 🎯 **OPÇÃO 1: Deploy via CLI (Recomendado)**

### Passo 1: Instalar Railway CLI

```bash
npm install -g @railway/cli
```

### Passo 2: Login no Railway

```bash
railway login
```

Isso abrirá o navegador para você fazer login.

### Passo 3: Inicializar projeto

```bash
cd /Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew

# Criar novo projeto Railway
railway init
```

**Escolha:**
- Nome do projeto: `falachefe-crewai`
- Região: `us-west1` (mais próximo do Brasil disponível)

### Passo 4: Configurar variáveis de ambiente

```bash
# Copiar do .env.local (use sua chave OpenAI)
railway variables set OPENAI_API_KEY="sk-proj-SEU_TOKEN_OPENAI_AQUI"

railway variables set UAZAPI_BASE_URL="https://falachefe.uazapi.com"

railway variables set UAZAPI_TOKEN="4fbeda58-0b8a-4905-9218-8ec89967a4a4"

railway variables set POSTGRES_URL="postgres://postgres.zpdartuyaergbxmbmtur:Kv4QRf4P4dUakepm@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require"

railway variables set PORT="8000"

railway variables set FLASK_ENV="production"
```

### Passo 5: Deploy

```bash
railway up
```

Aguarde ~2-5 minutos para o build completar.

### Passo 6: Obter URL do serviço

```bash
railway domain
```

**OU** no dashboard: https://railway.app/project/YOUR_PROJECT/service/YOUR_SERVICE

Copie a URL gerada, exemplo:
```
https://falachefe-crewai-production.up.railway.app
```

---

## 🎯 **OPÇÃO 2: Deploy via GitHub (Mais simples)**

### Passo 1: Criar projeto no Railway

1. Acesse: https://railway.app
2. Clique **New Project**
3. Escolha **Deploy from GitHub repo**
4. Autorize Railway a acessar seu GitHub
5. Selecione: `tiagoyoko/falachefe_plataforma`
6. **Service Name**: `falachefe-crewai`

### Passo 2: Configurar Root Directory

No Railway Dashboard:
1. Vá em **Settings**
2. **Root Directory**: `/crewai-projects/falachefe_crew`
3. Salvar

### Passo 3: Configurar Build

Já configurado no `railway.json`, mas se precisar:

**Build Command:**
```bash
pip install -r requirements-api.txt
```

**Start Command:**
```bash
gunicorn api_server:app --bind 0.0.0.0:$PORT --workers 2 --timeout 120
```

### Passo 4: Adicionar variáveis de ambiente

No Railway Dashboard → Variables:

```
OPENAI_API_KEY = sk-proj-SEU_TOKEN_OPENAI_AQUI

UAZAPI_BASE_URL = https://falachefe.uazapi.com

UAZAPI_TOKEN = 4fbeda58-0b8a-4905-9218-8ec89967a4a4

POSTGRES_URL = postgres://postgres.zpdartuyaergbxmbmtur:Kv4QRf4P4dUakepm@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=require

PORT = 8000

FLASK_ENV = production
```

### Passo 5: Deploy

1. Clique em **Deploy**
2. Aguarde build completar (~3-5 min)
3. Verifique logs

### Passo 6: Configurar domínio público

1. Em **Settings** → **Networking**
2. Clique em **Generate Domain**
3. Copie a URL gerada

---

## ✅ **APÓS DEPLOY**

### Teste 1: Health Check

```bash
curl https://SUA-URL-RAILWAY.up.railway.app/health
```

**Resposta esperada:**
```json
{
  "status": "ok",
  "service": "falachefe-crewai-api",
  "crew_initialized": false,
  "uazapi_configured": true
}
```

### Teste 2: Processar mensagem

```bash
curl -X POST "https://SUA-URL-RAILWAY.up.railway.app/process" \
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

**E você deve receber mensagem no WhatsApp!** 📱

---

## 🔗 **CONFIGURAR NO VERCEL**

Depois do deploy, adicione a URL na Vercel:

```bash
cd /Users/tiagoyokoyama/Falachefe

# Remover variáveis antigas se existirem
vercel env rm RAILWAY_WORKER_URL production || true
vercel env rm CREWAI_API_URL production || true

# Adicionar nova URL
echo "https://SUA-URL-RAILWAY.up.railway.app" | vercel env add RAILWAY_WORKER_URL production
echo "https://SUA-URL-RAILWAY.up.railway.app" | vercel env add CREWAI_API_URL production

# Redeploy Vercel
vercel --prod
```

---

## 🐛 **TROUBLESHOOTING**

### Erro: "Module not found"
```bash
# Verificar se requirements-api.txt está completo
railway run pip list

# Se faltar algo, adicionar em requirements-api.txt
```

### Erro: "Timeout"
```bash
# Aumentar timeout no Procfile
# Editar: --timeout 180 (ao invés de 120)
```

### Erro: "Port already in use"
```bash
# Railway define PORT automaticamente
# Não definir PORT=8000 manualmente
```

### Build falha
```bash
# Ver logs completos
railway logs

# Ou no dashboard: Deployments → Ver logs
```

---

## 📊 **MONITORAMENTO**

### Ver logs em tempo real

```bash
railway logs --follow
```

### Ver métricas

No Railway Dashboard:
- **Metrics** → CPU, Memory, Network
- **Deployments** → Histórico de deploys
- **Logs** → Logs em tempo real

---

## 💰 **CUSTOS**

Railway oferece:
- **$5 crédito grátis/mês**
- **~550 horas grátis** (se usar 1 worker)
- **Mais que suficiente** para testes e uso moderado

Se precisar mais:
- **Hobby Plan**: $5/mês
- **Pro Plan**: $20/mês

---

**Pronto para fazer deploy?** Execute os comandos acima! 🚀

