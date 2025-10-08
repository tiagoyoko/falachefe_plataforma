#!/bin/bash

# Teste completo do webhook em produção
# Simula mensagem do usuário e verifica se resposta é enviada

set -e

echo "🧪 TESTE DO WEBHOOK EM PRODUÇÃO"
echo "================================"
echo ""

USER_NUMBER="5511994066248"
USER_MESSAGE="Teste do fluxo completo - qual meu saldo?"

echo "📱 Simulando mensagem do usuário:"
echo "   De: $USER_NUMBER"
echo "   Mensagem: $USER_MESSAGE"
echo ""

# Criar payload
PAYLOAD=$(cat <<EOF
{
  "EventType": "messages",
  "event": "messages",
  "message": {
    "id": "test-$(date +%s)",
    "messageid": "test-$(date +%s)",
    "sender": "$USER_NUMBER",
    "senderName": "Tiago",
    "text": "$USER_MESSAGE",
    "content": "$USER_MESSAGE",
    "type": "conversation",
    "messageType": "conversation",
    "fromMe": false,
    "isGroup": false,
    "messageTimestamp": $(date +%s)000,
    "chatid": "${USER_NUMBER}@s.whatsapp.net"
  },
  "chat": {
    "id": "${USER_NUMBER}@s.whatsapp.net",
    "name": "Tiago",
    "wa_chatid": "${USER_NUMBER}@s.whatsapp.net"
  },
  "owner": "554791945151",
  "token": "4fbeda58-0b8a-4905-9218-8ec89967a4a4"
}
EOF
)

echo "📤 Enviando para webhook..."
RESPONSE=$(curl -s -X POST "https://falachefe.app.br/api/webhook/uaz" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q "success.*true"; then
    echo ""
    echo "✅ Webhook processou com sucesso!"
    echo ""
    echo "🔍 VERIFIQUE SEU WHATSAPP:"
    echo "   Você deve receber resposta em ~10-30 segundos"
    echo "   OU mensagem de erro se Python não estiver disponível"
    echo ""
    echo "⏰ Aguardando 30 segundos..."
    sleep 30
    echo ""
    echo "📱 Recebeu alguma mensagem no WhatsApp?"
    echo "   SIM → Python funcionando! ✅"
    echo "   NÃO → Python não disponível na Vercel ❌"
else
    echo ""
    echo "❌ Webhook falhou!"
    echo "   Resposta: $RESPONSE"
fi

echo ""
echo "================================"

