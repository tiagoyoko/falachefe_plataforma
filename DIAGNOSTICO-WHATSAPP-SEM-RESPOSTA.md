# 🚨 Diagnóstico: WhatsApp sem Resposta

**Data:** 13 de outubro de 2025  
**Problema:** Mensagens enviadas pelo WhatsApp não retornam resposta

---

## 🔍 Análise Realizada

### ✅ Verificações OK

1. **Vercel (Frontend/Backend Next.js)**
   - Deploy: `dpl_H4BkHEvbZhrxttRUypnQ4hVrGVut`
   - Status: `READY` ✅
   - Build: Concluído com sucesso
   - Webhook `/api/webhook/uaz`: Configurado corretamente

2. **Supabase (Database)**
   - Conexão: OK ✅
   - Usuário `11994066248`: Cadastrado com empresa ativa
   - Company: `Falachefe - Default` (ID: `bd7c774b-e790-46ea-9a91-91d8f4527087`)
   - Subscription: Ativa

3. **Código**
   - Lógica de roteamento: Correta
   - Detecção de usuário com empresa: Funcionando
   - MessageService: Implementado corretamente

### ❌ Problema Identificado

**SERVIDOR CREWAI NO HETZNER ESTÁ OFFLINE** 🔴

```bash
$ curl http://37.27.248.13:8000/health
# Sem resposta (timeout)
```

**Servidor:** 37.27.248.13:8000  
**Aplicação:** Flask API com CrewAI  
**Arquivo:** `crewai-projects/falachefe_crew/api_server.py`

---

## 🛠️ Solução

### Passo 1: Acessar o Servidor Hetzner

```bash
ssh root@37.27.248.13
```

**Senha:** (você tem acesso)

### Passo 2: Verificar Status dos Containers

```bash
cd /opt/falachefe-crewai
docker compose ps
```

**Saída esperada se offline:**
```
NAME                         IMAGE    COMMAND    SERVICE    CREATED    STATUS    PORTS
falachefe-crewai-api-1       ...      ...        api        ...        Exited    -
```

### Passo 3: Verificar Logs (se houver erro)

```bash
docker compose logs api --tail 100
```

### Passo 4: Reiniciar o Servidor

```bash
# Parar containers existentes
docker compose down

# Reconstruir e iniciar
docker compose up -d --build

# Aguardar 30 segundos
sleep 30

# Verificar status
docker compose ps
```

### Passo 5: Validar Funcionamento

```bash
# Teste local no servidor
curl http://localhost:8000/health

# Teste externo (do seu computador)
curl http://37.27.248.13:8000/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-13T...",
  "crew_loaded": true
}
```

---

## 🔄 Fluxo Completo de Mensagem WhatsApp

### Quando tudo estiver funcionando:

1. **WhatsApp → UAZAPI**
   - Usuário envia mensagem pelo WhatsApp
   - UAZAPI recebe e envia webhook

2. **UAZAPI → Vercel**
   - `POST https://falachefe.app.br/api/webhook/uaz`
   - Webhook processa mensagem

3. **Vercel → MessageService**
   - Valida usuário e empresa
   - Identifica que usuário TEM empresa ativa

4. **MessageService → MessageRouter**
   - Roteia para CrewAI
   - `POST http://37.27.248.13:8000/process`

5. **CrewAI (Hetzner) → Processamento**
   - CrewAI processa mensagem (10-60s)
   - Gera resposta inteligente

6. **CrewAI → UAZAPI**
   - Envia resposta para usuário
   - `POST https://falachefe.uazapi.com/send_message`

7. **UAZAPI → WhatsApp**
   - Usuário recebe resposta

---

## 📊 Checklist de Debug

- [x] Vercel deploy funcionando
- [x] Banco de dados acessível
- [x] Usuário com empresa cadastrada
- [x] Webhook configurado
- [x] Código atualizado
- [ ] **Servidor Hetzner online** ← PROBLEMA AQUI
- [ ] Container Docker rodando
- [ ] Porta 8000 acessível
- [ ] Health check respondendo

---

## 🎯 Próximos Passos

### Imediato (Você precisa fazer):

```bash
# 1. Acessar servidor
ssh root@37.27.248.13

# 2. Ir para diretório do projeto
cd /opt/falachefe-crewai

# 3. Reiniciar serviço
docker compose down
docker compose up -d --build

# 4. Verificar logs
docker compose logs -f api
```

### Validação:

Após reiniciar, testar enviando mensagem pelo WhatsApp.

**Mensagem de teste:**
```
Olá, preciso de ajuda com vendas
```

**Comportamento esperado:**
- Resposta do CrewAI em 10-60 segundos
- Resposta contextualizada sobre vendas

---

## 📝 Informações Técnicas

### Servidor Hetzner
- **IP:** 37.27.248.13
- **Porta:** 8000
- **Path:** `/opt/falachefe-crewai`
- **Container:** `falachefe-crewai-api-1`
- **Imagem:** Python 3.12 + Flask + CrewAI

### Stack CrewAI
- **Framework:** CrewAI
- **API:** Flask
- **Workers:** Gunicorn (2 workers, 4 threads)
- **Timeout:** 120s
- **Endpoint:** `/process`

### Variáveis de Ambiente
```env
OPENAI_API_KEY=sk-...
UAZAPI_TOKEN=...
POSTGRES_URL=postgresql://...
```

---

## 🚨 Se o Problema Persistir

### 1. Verificar Firewall
```bash
# No servidor Hetzner
ufw status
ufw allow 8000/tcp
```

### 2. Verificar Porta
```bash
netstat -tuln | grep 8000
# Deve mostrar: 0.0.0.0:8000
```

### 3. Verificar Docker
```bash
docker ps
docker logs falachefe-crewai-api-1
```

### 4. Reconstruir Imagem
```bash
cd /opt/falachefe-crewai
docker compose down
docker system prune -f
docker compose build --no-cache
docker compose up -d
```

---

## ✅ Confirmação de Sucesso

Quando tudo estiver funcionando:

1. ✅ `curl http://37.27.248.13:8000/health` retorna JSON
2. ✅ Mensagem no WhatsApp recebe resposta
3. ✅ Logs mostram processamento CrewAI
4. ✅ UAZAPI envia mensagem de volta

---

**Resumo:** O servidor CrewAI no Hetzner está offline. Você precisa acessar via SSH e reiniciar os containers Docker.

