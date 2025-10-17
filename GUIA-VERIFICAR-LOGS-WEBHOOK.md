# 🔍 Como Verificar Logs do Webhook WhatsApp

## Problema Reportado
"Estou enviando mensagem pelo WhatsApp e não consta nenhum evento nos logs da Vercel"

## ✅ STATUS ATUAL (15/10/2025)

**WEBHOOK ESTÁ FUNCIONANDO! ✅**

Mensagens estão sendo recebidas e salvas no banco:
- 10:44:20 - "testando" ✅
- 10:43:38 - "teste" ✅

## 📊 Como Verificar se o Webhook Está Funcionando

### 1. **Verificar Banco de Dados (Mais Confiável)**

Use o Supabase MCP para consultar mensagens recentes:

```sql
SELECT 
  id, 
  content, 
  sender_type, 
  sent_at, 
  uaz_message_id
FROM messages 
ORDER BY sent_at DESC 
LIMIT 10;
```

**Se aparecer sua mensagem aqui = Webhook funcionando ✅**

### 2. **Verificar Logs da Vercel (Web)**

1. Acesse: https://vercel.com/tiago-6739s-projects/falachefe

2. Clique em **"Logs"** no menu lateral

3. Filtre por:
   - **Function**: `/api/webhook/uaz`
   - **Time Range**: Last 1 hour

4. Procure por estas linhas:
   ```
   UAZ Webhook received
   MessageService: Processing incoming message
   User: { phoneNumber: "..." }
   Message saved successfully
   ```

### 3. **Verificar Logs via Vercel MCP (Terminal)**

```bash
# Listar últimos deployments
vercel list

# Ver logs do deployment atual
vercel logs [deployment-url] --follow
```

### 4. **Testar Webhook Manualmente**

```bash
curl -X POST https://falachefe.app.br/api/webhook/uaz \
  -H "Content-Type: application/json" \
  -d '{
    "EventType": "messages",
    "message": {
      "id": "test123",
      "sender": "5547999999999",
      "content": "teste manual",
      "type": "text",
      "fromMe": false
    },
    "chat": {
      "id": "5547999999999",
      "name": "Teste",
      "wa_chatid": "5547999999999@c.us"
    },
    "owner": "554791945151",
    "token": "4fbeda58-0b8a-4905-9218-8ec89967a4a4"
  }'
```

**Resposta esperada**:
```json
{
  "success": true,
  "message": "Webhook processed successfully",
  "timestamp": "..."
}
```

## 🔧 Possíveis Causas de "Não Ver Logs"

### Causa 1: **Logs Rotacionados**
- Vercel guarda logs por tempo limitado
- Logs antigos são automaticamente removidos
- **Solução**: Usar banco de dados como fonte da verdade

### Causa 2: **Filtro Incorreto**
- Procurando na function errada
- Time range muito antigo
- **Solução**: Filtrar por `/api/webhook/uaz` e "Last 1 hour"

### Causa 3: **Webhook Configurado Incorretamente na UAZAPI**
- URL errada no UAZAPI
- Events não selecionados
- **Solução**: Verificar configuração

### Causa 4: **Mensagens de Teste Não Chegam**
- Número errado
- Instância desconectada
- **Solução**: Usar número correto: +55 47 9194-5151

## 🎯 Verificação Rápida

Execute este checklist:

- [ ] **Banco de dados tem mensagens recentes?** 
  - ✅ SIM (confirmado hoje 10:44)
  
- [ ] **Webhook responde a POST manual?**
  - ✅ SIM (testado agora - retorna 400 com payload inválido, 200 com válido)
  
- [ ] **Mensagens do WhatsApp aparecem no banco?**
  - ✅ SIM (2 mensagens de hoje)
  
- [ ] **CrewAI está processando?**
  - ⚠️ Verificar se há respostas do agente no banco

## 📱 Como Testar Agora

1. **Envie mensagem para**: +55 47 9194-5151

2. **Aguarde 10 segundos**

3. **Consulte banco**:
   ```sql
   SELECT * FROM messages 
   WHERE sent_at > NOW() - INTERVAL '5 minutes'
   ORDER BY sent_at DESC;
   ```

4. **Se aparecer = Webhook OK ✅**

5. **Se não aparecer**:
   - Verificar configuração UAZAPI
   - Verificar se instância está conectada
   - Verificar número correto

## 🚨 Troubleshooting

### "Mensagem no banco MAS sem resposta do bot"

**Significa**: Webhook OK, CrewAI com problema

**Verificar**:
1. Servidor Hetzner está online?
   ```bash
   curl https://api.falachefe.app.br/health
   ```

2. Logs do servidor:
   ```bash
   ssh root@37.27.248.13
   cd /opt/falachefe-crewai
   docker compose logs -f --tail=50
   ```

### "Mensagem NÃO chega no banco"

**Significa**: Problema no webhook ou UAZAPI

**Verificar**:
1. Configuração webhook UAZAPI:
   - URL: `https://falachefe.app.br/api/webhook/uaz`
   - Events: `messages`, `messages_update`
   - Ativo: ✅

2. Instância conectada:
   ```bash
   curl https://falachefe.uazapi.com/instances/status \
     -H "Authorization: Bearer 4fbeda58-0b8a-4905-9218-8ec89967a4a4"
   ```

## ✅ Status Atual Confirmado

**Data**: 15/10/2025 10:45
**Webhook**: ✅ Funcionando
**Banco**: ✅ Salvando mensagens
**Último teste**: 10:44:20 - "testando"

**CONCLUSÃO**: Sistema está funcionando normalmente. Se não vê logs na Vercel, use banco de dados como fonte da verdade.

---

## 📚 Documentos Relacionados

- [COMO-TESTAR-WEBHOOK-WHATSAPP.md](mdc:COMO-TESTAR-WEBHOOK-WHATSAPP.md)
- [src/app/api/webhook/uaz/route.ts](mdc:src/app/api/webhook/uaz/route.ts)
- [TROUBLESHOOTING-SERVIDOR-HETZNER.md](mdc:TROUBLESHOOTING-SERVIDOR-HETZNER.md)

