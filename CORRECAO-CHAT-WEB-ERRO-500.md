# Correção: Erro 500 no Chat Web

## 🐛 Problema Identificado

Ao enviar mensagem pelo chat web, o sistema retornava erro 500:
```
POST /api/chat → 500 Internal Server Error
Erro: Erro ao processar mensagem
```

## 🔍 Causa Raiz

O CrewAI estava tentando enviar **TODAS** as respostas via UAZAPI, incluindo do chat web:

```python
# api_server.py (ANTES)
response_text = str(result)
send_result = send_to_uazapi(phone_number, response_text)  # ❌ Sempre envia
```

Quando o chat web enviava `phoneNumber: '+5500000000'` (dummy), a UAZAPI falhava porque o número é inválido.

## ✅ Solução Implementada

Modificado `api_server.py` para **detectar origem** e enviar via UAZAPI apenas para WhatsApp:

```python
# api_server.py (DEPOIS)
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

## 🎯 Fluxo Correto Implementado

### Chat Web
```
Frontend → /api/chat → CrewAI → JSON Response → Frontend
```
- **NÃO** envia para UAZAPI
- Retorna resposta diretamente no JSON

### WhatsApp
```
WhatsApp → UAZAPI Webhook → /api/webhook/uaz → QStash → CrewAI → UAZAPI → WhatsApp
```
- Envia resposta via `send_to_uazapi(phoneNumber, response)`
- Usa número real do WhatsApp (5511999999999)

## 📋 Arquivos Modificados

1. **crewai-projects/falachefe_crew/api_server.py**
   - Adicionar detecção de chat web
   - Condicionar envio para UAZAPI
   - Atualizar handler de erro

## 🚀 Deploy Necessário

Para aplicar a correção:
```bash
# Fazer push para GitHub
git add crewai-projects/falachefe_crew/api_server.py
git commit -m "fix: detectar origem chat web e não enviar para UAZAPI"
git push origin master

# SSH no servidor Hetzner
ssh root@37.27.248.13

# Ir para diretório
cd /opt/falachefe-crewai

# Atualizar código
git pull origin master

# Reiniciar Docker
docker compose restart
```

## ✅ Resultado Esperado

Após deploy:
- ✅ Chat web funciona normalmente
- ✅ WhatsApp continua funcionando
- ✅ CrewAI detecta origem e responde no canal correto
- ✅ Sem tentativas de envio para UAZAPI com número dummy

## 🧪 Como Testar

### Chat Web
1. Acessar https://falachefe.app.br/chat
2. Fazer login
3. Enviar mensagem: "oi"
4. Verificar resposta aparece no frontend
5. Logs do CrewAI devem mostrar: `💬 Web chat - skipping UAZAPI send`

### WhatsApp
1. Enviar mensagem via WhatsApp
2. Verificar resposta chega via WhatsApp
3. Logs do CrewAI devem mostrar: `📤 Sending response to WhatsApp user...`

