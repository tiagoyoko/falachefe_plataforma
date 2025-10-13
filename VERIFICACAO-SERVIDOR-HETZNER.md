# 🔧 Verificação e Correção - Servidor Hetzner

**Data**: 13 de Outubro de 2025  
**Objetivo**: Verificar e corrigir erro 500 no `/api/chat`

---

## 📋 Passo 1: Verificar Status do Servidor CrewAI

### 1.1 Acessar Servidor via SSH

```bash
ssh root@37.27.248.13
```

### 1.2 Verificar Serviços Docker

```bash
# Listar todos os serviços
docker service ls

# Procurar especificamente o CrewAI
docker service ls | grep crewai
```

**Resultado Esperado:**
```
ID             NAME                    MODE         REPLICAS   IMAGE                      PORTS
xxxxxxxxx      falachefe_crewai-api    replicated   1/1        falachefe-crewai:latest    
```

**Status Bom:** `1/1` (1 réplica rodando de 1 desejada)  
**Status Ruim:** `0/1` (nenhuma réplica rodando)

---

### 1.3 Verificar Logs do Serviço

```bash
# Ver últimas 50 linhas de log
docker service logs falachefe_crewai-api --tail 50

# Seguir logs em tempo real
docker service logs falachefe_crewai-api -f
```

**O que procurar:**
- ✅ `✓ CrewAI server started successfully` 
- ✅ `Running on http://0.0.0.0:8000`
- ❌ Erros de Python/dependências
- ❌ `ModuleNotFoundError`
- ❌ `Connection refused`

---

### 1.4 Testar Health Check

```bash
# Dentro do servidor ou localmente
curl https://api.falachefe.app.br/health
```

**Resposta Esperada (200 OK):**
```json
{
  "status": "ok",
  "service": "CrewAI API",
  "timestamp": "2025-10-13T..."
}
```

**Se retornar 502/503:** Serviço está offline

---

## 📋 Passo 2: Verificar Correção Web Chat Detection

### 2.1 Verificar Código Atual

```bash
cd /opt/falachefe-crewai
grep -A 10 "is_web_chat" api_server.py
```

**Código Correto (DEVE EXISTIR):**
```python
# Detectar se é chat web ou WhatsApp
is_web_chat = phone_number == '+5500000000' or context.get('source') == 'web-chat'

send_result = {
    "success": True,
    "source": "web-chat" if is_web_chat else "whatsapp"
}

# Enviar resposta via UAZAPI apenas para WhatsApp
if not is_web_chat:
    print("📤 Sending response to WhatsApp user...", file=sys.stderr)
    send_result = send_to_uazapi(phone_number, response_text)
else:
    print("💬 Web chat - skipping UAZAPI send", file=sys.stderr)
```

**Se NÃO EXISTIR:** Aplicar correção abaixo.

---

### 2.2 Aplicar Correção (se necessário)

```bash
cd /opt/falachefe-crewai

# Baixar última versão do código
git pull origin master

# Verificar se correção foi aplicada
grep -A 5 "is_web_chat" api_server.py

# Se ainda não tiver, editar manualmente
nano api_server.py
```

**Procurar a função que processa mensagens** (geralmente `process_message` ou similar) e modificar:

```python
# ANTES (INCORRETO):
response_text = str(result)
send_result = send_to_uazapi(phone_number, response_text)  # Sempre envia

# DEPOIS (CORRETO):
response_text = str(result)

# Detectar se é chat web ou WhatsApp
is_web_chat = phone_number == '+5500000000' or context.get('source') == 'web-chat'

send_result = {
    "success": True,
    "source": "web-chat" if is_web_chat else "whatsapp"
}

# Enviar resposta via UAZAPI apenas para WhatsApp
if not is_web_chat:
    print("📤 Sending response to WhatsApp user...", file=sys.stderr)
    send_result = send_to_uazapi(phone_number, response_text)
else:
    print("💬 Web chat - skipping UAZAPI send", file=sys.stderr)
```

**Salvar:** `Ctrl+O` → Enter → `Ctrl+X`

---

### 2.3 Reiniciar Serviço

```bash
# Opção 1: Restart do serviço Docker Swarm
docker service update --force falachefe_crewai-api

# Opção 2: Restart completo da stack
cd /opt/falachefe-crewai
docker stack deploy -c docker-stack.yml falachefe --with-registry-auth

# Aguardar 10 segundos
sleep 10

# Verificar se subiu
docker service ls | grep crewai
```

---

## 📋 Passo 3: Testar Chat Web

### 3.1 Teste via Curl (do servidor ou local)

```bash
# Preparar payload
cat > /tmp/test-chat.json << 'EOF'
{
  "message": "Olá, teste do chat web",
  "userId": "test-user-123",
  "phoneNumber": "+5500000000",
  "context": {
    "source": "web-chat",
    "conversationId": "web_test_123"
  }
}
EOF

# Testar endpoint local do CrewAI
curl -X POST http://localhost:8000/process \
  -H "Content-Type: application/json" \
  -d @/tmp/test-chat.json
```

**Resposta Esperada:**
```json
{
  "success": true,
  "response": "Olá! Como posso ajudar?",
  "metadata": {
    "source": "web-chat",
    ...
  }
}
```

---

### 3.2 Verificar Logs Durante Teste

```bash
# Em outro terminal, seguir logs
docker service logs falachefe_crewai-api -f
```

**O que procurar:**
- ✅ `💬 Web chat - skipping UAZAPI send`
- ✅ Request processado com sucesso
- ❌ Tentativa de envio para UAZAPI com `+5500000000`
- ❌ Erro 500 ou exception

---

### 3.3 Testar via Frontend

```bash
# Acessar no browser
https://falachefe.app.br/chat

# 1. Fazer login
# 2. Enviar mensagem: "oi"
# 3. Verificar:
#    - Mensagem aparece no chat
#    - Resposta do agente chega
#    - Console SEM erro 500
```

**Console Esperado (DevTools F12):**
```
📤 Sending message with userId: XwwWZgzal5jgUGzU8RqME8fQEVy7t4U2
✅ Message sent successfully
🔍 Chat Messages Updated: Array(2)
```

**❌ Se ainda houver erro 500:**
- Voltar para Passo 2 e verificar correção
- Ver logs do serviço para erro específico

---

## 📋 Passo 4: Diagnóstico Avançado

Se após todos os passos o erro persistir:

### 4.1 Verificar Conectividade Vercel → Hetzner

```bash
# Do servidor Hetzner
curl -X POST http://localhost:8000/process \
  -H "Content-Type: application/json" \
  -d '{"message":"test","userId":"test","phoneNumber":"+5500000000","context":{"source":"web-chat"}}'
```

**Se funcionar localmente mas não via internet:**
- Verificar firewall: `ufw status`
- Verificar Traefik: `docker service logs traefik_traefik | grep api.falachefe`
- Verificar DNS: `dig api.falachefe.app.br`

---

### 4.2 Verificar Traefik (Proxy Reverso)

```bash
# Ver rotas configuradas
docker service inspect falachefe_crewai-api | grep -A 10 "Labels"

# Ver logs do Traefik
docker service logs traefik_traefik --tail 50
```

**Labels Esperados:**
```yaml
traefik.http.routers.crewai-https.rule: Host(`api.falachefe.app.br`)
traefik.http.routers.crewai-https.entrypoints: websecure
traefik.http.routers.crewai-https.tls: true
traefik.http.services.crewai.loadbalancer.server.port: 8000
```

---

### 4.3 Verificar Variáveis de Ambiente

```bash
# Ver variáveis do serviço
docker service inspect falachefe_crewai-api | grep -A 20 "Env"
```

**Variáveis Críticas:**
- `OPENAI_API_KEY` - Deve estar definida
- `UAZAPI_TOKEN` - Deve estar definida
- `GUNICORN_TIMEOUT=120` - Timeout adequado
- `GUNICORN_WORKERS=2` - Workers suficientes

---

## ✅ Checklist Final

Marque cada item após verificar:

- [ ] **1.1** Serviço CrewAI está rodando (`1/1` réplicas)
- [ ] **1.2** Logs sem erros críticos
- [ ] **1.3** Health check retorna 200 OK
- [ ] **2.1** Código tem detecção `is_web_chat`
- [ ] **2.2** Correção aplicada corretamente
- [ ] **2.3** Serviço reiniciado após mudanças
- [ ] **3.1** Teste curl retorna sucesso
- [ ] **3.2** Logs mostram `💬 Web chat - skipping UAZAPI send`
- [ ] **3.3** Frontend funciona sem erro 500
- [ ] **4.1** Conectividade Vercel → Hetzner OK
- [ ] **4.2** Traefik roteando corretamente
- [ ] **4.3** Variáveis de ambiente corretas

---

## 🎯 Resultado Esperado

### Antes da Correção
```
POST /api/chat → 500 Internal Server Error
Erro: CrewAI tentou enviar para UAZAPI com número dummy
```

### Depois da Correção
```
POST /api/chat → 200 OK
{
  "success": true,
  "content": "Olá! Como posso ajudar?",
  "metadata": {
    "source": "web-chat",
    "conversationId": "web_..."
  }
}
```

### Logs CrewAI Corretos
```
💬 Web chat - skipping UAZAPI send
✓ Response sent successfully
```

---

## 📞 Suporte

Se precisar de ajuda adicional:

1. **Copiar logs relevantes:**
   ```bash
   docker service logs falachefe_crewai-api --tail 100 > /tmp/crewai-logs.txt
   ```

2. **Compartilhar informações:**
   - Status do serviço (`docker service ls`)
   - Logs de erro
   - Resultado do curl test

3. **Verificar documentos:**
   - `CORRECAO-CHAT-WEB-ERRO-500.md`
   - `TROUBLESHOOTING-SERVIDOR-HETZNER.md`

---

**Status:** ✅ Guia Completo de Verificação  
**Tempo Estimado:** 15-30 minutos  
**Nível:** Intermediário

