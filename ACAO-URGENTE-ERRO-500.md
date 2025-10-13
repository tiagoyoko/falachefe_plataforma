# 🚨 AÇÃO URGENTE: Corrigir Erro 500 no Chat Web

**Data**: 13 de Outubro de 2025  
**Problema**: `/api/chat` retorna 500 - CrewAI falha ao processar mensagem  
**Status**: ⚠️ **REQUER AÇÃO IMEDIATA**

---

## 🔴 Problema Confirmado

### Console do Browser Mostra:
```
✅ Usuário autenticado: XwwWZgzal5jgUGzU8RqME8fQEVy7t4U2
✅ Mensagem enviada: "Olá"
❌ api/chat:1 Failed to load resource: 500
❌ Error: Erro ao processar mensagem
```

### Fluxo do Erro:
```
Browser → /api/chat (Next.js) → https://api.falachefe.app.br/process → ❌ ERRO 500
```

---

## 🔧 SOLUÇÃO: Verificar e Corrigir Servidor Hetzner

### PASSO 1: Conectar no Servidor

```bash
ssh root@37.27.248.13
```

### PASSO 2: Verificar Status do CrewAI

```bash
# Verificar se serviço está rodando
docker service ls | grep crewai
```

**Resultado Esperado:**
```
ID             NAME                    MODE         REPLICAS   IMAGE
xxxxxxxxx      falachefe_crewai-api    replicated   1/1        falachefe-crewai:latest
```

**Se mostrar `0/1`** → Serviço está offline!

---

### PASSO 3: Ver Logs do Erro

```bash
# Ver últimas 50 linhas de log
docker service logs falachefe_crewai-api --tail 50
```

**Procurar por:**
- ❌ Tentativa de envio para UAZAPI com `+5500000000`
- ❌ `UAZAPIError` ou erro HTTP
- ❌ Exception/traceback Python

---

### PASSO 4: Verificar Se Correção Foi Aplicada

```bash
cd /opt/falachefe-crewai
grep -A 10 "is_web_chat" api_server.py
```

**DEVE MOSTRAR:**
```python
# Detectar se é chat web ou WhatsApp
is_web_chat = phone_number == '+5500000000' or context.get('source') == 'web-chat'

# Enviar resposta via UAZAPI apenas para WhatsApp
if not is_web_chat:
    print("📤 Sending response to WhatsApp user...", file=sys.stderr)
    send_result = send_to_uazapi(phone_number, response_text)
else:
    print("💬 Web chat - skipping UAZAPI send", file=sys.stderr)
```

**Se NÃO MOSTRAR** → Correção não foi aplicada!

---

## 🛠️ APLICAR CORREÇÃO AGORA

### Se a correção NÃO foi aplicada:

```bash
# 1. Ir para diretório
cd /opt/falachefe-crewai

# 2. Baixar última versão do código
git pull origin master

# 3. Verificar se código tem a correção
grep -A 10 "is_web_chat" api_server.py

# 4. Se ainda não tiver, editar manualmente
nano api_server.py
```

### Encontrar a função de processamento e modificar:

**PROCURAR POR:**
```python
response_text = str(result)
send_result = send_to_uazapi(phone_number, response_text)  # ❌ SEMPRE ENVIA
```

**SUBSTITUIR POR:**
```python
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

### PASSO 5: Reiniciar Serviço

```bash
# Reiniciar com força
docker service update --force falachefe_crewai-api

# Aguardar 10 segundos
sleep 10

# Verificar se subiu
docker service ls | grep crewai
```

**DEVE MOSTRAR:** `1/1` (1 réplica rodando)

---

### PASSO 6: Testar Novamente

```bash
# Seguir logs em tempo real
docker service logs falachefe_crewai-api -f
```

**Em outra aba do terminal, testar:**
```bash
curl -X POST http://localhost:8000/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "teste",
    "userId": "test-123",
    "phoneNumber": "+5500000000",
    "context": {"source": "web-chat"}
  }'
```

**Log DEVE MOSTRAR:**
```
💬 Web chat - skipping UAZAPI send
```

---

### PASSO 7: Testar no Browser

1. Acessar: https://falachefe.app.br/chat
2. Fazer login
3. Enviar mensagem: "oi"
4. **DEVE RECEBER RESPOSTA SEM ERRO 500**

---

## 🎯 Checklist de Verificação

Execute na ordem:

- [ ] **1.** SSH no servidor Hetzner
- [ ] **2.** Verificar serviço rodando (1/1)
- [ ] **3.** Ver logs de erro
- [ ] **4.** Verificar código tem correção `is_web_chat`
- [ ] **5.** Se não tiver, aplicar correção manualmente
- [ ] **6.** Reiniciar serviço
- [ ] **7.** Verificar logs mostram "💬 Web chat - skipping UAZAPI send"
- [ ] **8.** Testar no browser: https://falachefe.app.br/chat
- [ ] **9.** Confirmar: SEM erro 500

---

## ⏱️ Tempo Estimado

- Verificação: **5 minutos**
- Correção (se necessário): **10 minutos**
- Total: **15 minutos**

---

## 📞 Se Precisar de Ajuda

### Copiar e compartilhar:

```bash
# Status do serviço
docker service ls | grep crewai > /tmp/status.txt

# Últimos logs
docker service logs falachefe_crewai-api --tail 100 > /tmp/logs.txt

# Verificar correção
grep -A 15 "is_web_chat" /opt/falachefe-crewai/api_server.py > /tmp/code.txt

# Enviar arquivos:
cat /tmp/status.txt
cat /tmp/logs.txt
cat /tmp/code.txt
```

---

## ✅ Resultado Esperado

### Logs Corretos (após correção):
```
POST /process - phoneNumber: +5500000000, source: web-chat
💬 Web chat - skipping UAZAPI send
✓ Response sent successfully
```

### Console Browser (após correção):
```
✅ 📤 Sending message with userId: XwwWZgzal5jgUGzU8RqME8fQEVy7t4U2
✅ Message sent successfully
✅ Response received: "Olá! Como posso ajudar?"
```

---

**Status:** 🚨 **REQUER AÇÃO IMEDIATA**  
**Prioridade:** 🔴 **CRÍTICA**  
**Tempo:** ~15 minutos

