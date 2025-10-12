# Relatório: Correção de Erros do Console

**Data:** 12/10/2025  
**Status:** ✅ Erro crítico corrigido | ⚠️ Erros menores pendentes

---

## 📋 Erros Identificados

### 🔴 **ERRO CRÍTICO - CORRIGIDO**

#### 1. POST /api/chat → 500 (Internal Server Error)

**Sintoma:**
```javascript
POST https://falachefe.app.br/api/chat 500 (Internal Server Error)
❌ Error sending message: Error: Erro ao processar mensagem
```

**Causa Raiz:**
- Chat web enviava `phoneNumber: '+5500000000'` (dummy) para CrewAI
- CrewAI tentava enviar **TODAS** as respostas via UAZAPI
- UAZAPI falhava com número inválido → Erro 500

**Solução Implementada:**
- Modificado `crewai-projects/falachefe_crew/api_server.py`
- Adicionada detecção de origem (web chat vs WhatsApp)
- Envio para UAZAPI apenas quando telefone é válido

```python
# Detectar se é chat web ou WhatsApp
is_web_chat = phone_number == '+5500000000' or context.get('source') == 'web-chat'

# Enviar resposta via UAZAPI apenas para WhatsApp
if not is_web_chat:
    send_result = send_to_uazapi(phone_number, response_text)
else:
    # Web chat: apenas retornar JSON
    print("💬 Web chat - skipping UAZAPI send", file=sys.stderr)
```

**Status:** ✅ **CORRIGIDO E DEPLOYADO**
- Commit: `e9dc538`
- Deploy: Servidor Hetzner atualizado
- Testável em: https://falachefe.app.br/chat

---

### 🟡 **ERROS MÉDIOS - PENDENTES**

#### 2-7. Rotas 404 (Não Implementadas)

**Sintomas:**
```javascript
GET /demo?_rsc=pmmii → 404
GET /agentes?_rsc=pmmii → 404  
GET /templates?_rsc=pmmii → 404
GET /blog?_rsc=pmmii → 404
GET /termos?_rsc=pmmii → 404
GET /privacidade?_rsc=pmmii → 404
```

**Causa:**
- Next.js faz prefetch de links que existem no HTML
- Páginas não foram criadas

**Soluções Possíveis:**
1. Remover links do HTML/navegação
2. Criar páginas placeholder "Em breve"

**Status:** ⚠️ **PENDENTE** (não afeta funcionalidade principal)

---

### 🟢 **ERROS BAIXOS - NÃO CRÍTICOS**

#### 8. Content Security Policy - Inline Script

**Sintoma:**
```javascript
Refused to execute inline script because it violates CSP directive
jquery-1.3.2.min.js:19
```

**Provável Causa:**
- Extensão do navegador ou código legacy
- jQuery muito antigo (versão 1.3.2 de 2009!)

**Status:** 🟢 **NÃO CRÍTICO** (não afeta usuário)

#### 9. screengrabber.js Error

**Sintoma:**
```javascript
Uncaught TypeError: Cannot set properties of null (setting 'src')
at screengrabber.js:14:40
```

**Provável Causa:**
- Extensão do navegador (screen recording/capture)

**Status:** 🟢 **NÃO CRÍTICO** (externo ao projeto)

---

## 🎯 Fluxo Correto Implementado

### Chat Web ✅
```
Frontend → /api/chat → CrewAI (Hetzner) → JSON Response → Frontend
```
- **NÃO** envia para UAZAPI
- Retorna resposta diretamente no JSON

### WhatsApp ✅
```
WhatsApp → UAZAPI Webhook → /api/webhook/uaz → QStash → CrewAI → UAZAPI → WhatsApp
```
- Envia resposta via `send_to_uazapi(phoneNumber, response)`
- Usa número real do WhatsApp (5511999999999)

---

## 📝 Arquivos Modificados

1. **crewai-projects/falachefe_crew/api_server.py**
   - Adicionada detecção de origem (linhas 266-280)
   - Condicionar envio para UAZAPI
   - Atualizar handler de erro (linhas 301-307)

2. **CORRECAO-CHAT-WEB-ERRO-500.md**
   - Documentação completa da correção

3. **DEPLOY-SERVIDOR-HETZNER.sh**
   - Script de deploy automatizado

---

## 🚀 Deploy Realizado

### GitHub
✅ Commit: `e9dc538`  
✅ Push: master atualizado  
✅ Link: https://github.com/tiagoyoko/falachefe_plataforma

### Servidor Hetzner
✅ Arquivo copiado via SCP  
✅ Container reiniciado  
✅ Health check: OK  
```json
{
  "status": "healthy",
  "service": "falachefe-crewai-api",
  "uazapi_configured": true,
  "uptime_seconds": 0
}
```

---

## 🧪 Como Testar

### Chat Web
1. Acessar: https://falachefe.app.br/chat
2. Fazer login com Google
3. Enviar mensagem: "oi"
4. ✅ Deve receber resposta no frontend
5. ❌ NÃO deve enviar para UAZAPI

**Logs Esperados (CrewAI):**
```
📨 Processing message:
  User ID: XwwWZgzal5jgUGzU8RqME8fQEVy7t4U2
  Phone: +5500000000
  Message: oi
🤖 Executing CrewAI...
✅ CrewAI completed in XXXms
💬 Web chat - skipping UAZAPI send
```

### WhatsApp
1. Enviar mensagem via WhatsApp
2. ✅ Deve receber resposta via WhatsApp
3. ✅ Deve enviar para UAZAPI

**Logs Esperados (CrewAI):**
```
📨 Processing message:
  User ID: ...
  Phone: 5511999999999
  Message: teste
🤖 Executing CrewAI...
✅ CrewAI completed in XXXms
📤 Sending response to WhatsApp user...
✅ Message sent: msg_xxx
```

---

## 📊 Resumo

| Erro | Status | Prioridade | Ação |
|------|--------|-----------|------|
| POST /api/chat 500 | ✅ Corrigido | 🔴 Crítica | Deployado |
| Rotas 404 | ⚠️ Pendente | 🟡 Média | Opcional |
| CSP Inline Script | 🟢 Ignorado | 🟢 Baixa | Não crítico |
| screengrabber.js | 🟢 Ignorado | 🟢 Baixa | Extensão browser |

---

## ✅ Próximos Passos (Opcionais)

1. **Remover links 404** (10 min)
   - Editar componentes de navegação
   - Remover links: /demo, /blog, /agentes, etc

2. **Criar páginas placeholder** (20 min)
   - Criar páginas "Em breve"
   - Melhorar UX

3. **Investigar jQuery legacy** (30 min)
   - Verificar se é necessário
   - Remover se não usado

**Nenhum destes é crítico para funcionamento do sistema!**

