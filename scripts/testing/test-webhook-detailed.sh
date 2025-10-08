#!/bin/bash

# Teste detalhado do webhook para identificar onde está falhando

echo "🔍 TESTE DETALHADO DO WEBHOOK"
echo "============================="
echo ""

USER_NUMBER="5511994066248"

# 1. Testar se endpoint webhook está acessível
echo "1️⃣ Testando endpoint webhook..."
HEALTH=$(curl -s "https://falachefe.app.br/api/webhook/uaz")
echo "   Resposta: $HEALTH"

if echo "$HEALTH" | grep -q "ok"; then
    echo "   ✅ Endpoint acessível"
else
    echo "   ❌ Endpoint com problema"
fi

echo ""

# 2. Testar endpoint CrewAI
echo "2️⃣ Testando endpoint CrewAI..."
CREWAI_HEALTH=$(curl -s "https://falachefe.app.br/api/crewai/process")
echo "   $CREWAI_HEALTH" | jq '.' 2>/dev/null || echo "   $CREWAI_HEALTH"

if echo "$CREWAI_HEALTH" | grep -q "pythonScriptExists.*true"; then
    echo "   ✅ Python script existe na Vercel"
else
    echo "   ❌ Python script NÃO encontrado"
fi

echo ""

# 3. Testar processamento de mensagem via CrewAI
echo "3️⃣ Testando processamento CrewAI direto..."
CREWAI_RESPONSE=$(curl -s -X POST "https://falachefe.app.br/api/crewai/process" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Qual meu saldo?",
    "userId": "test-user-123",
    "phoneNumber": "5511994066248",
    "context": {
      "conversationId": "test-conv",
      "isNewUser": false
    }
  }')

echo "   Resposta CrewAI:"
echo "$CREWAI_RESPONSE" | jq '.' 2>/dev/null || echo "$CREWAI_RESPONSE"

if echo "$CREWAI_RESPONSE" | grep -q '"success":true'; then
    echo "   ✅ CrewAI processou com sucesso!"
    CREWAI_TEXT=$(echo "$CREWAI_RESPONSE" | jq -r '.response' 2>/dev/null)
    echo "   📝 Resposta: ${CREWAI_TEXT:0:100}..."
elif echo "$CREWAI_RESPONSE" | grep -q '"success":false'; then
    echo "   ⚠️  CrewAI retornou success=false"
    ERROR_MSG=$(echo "$CREWAI_RESPONSE" | jq -r '.message // .error' 2>/dev/null)
    echo "   ❌ Erro: $ERROR_MSG"
else
    echo "   ❌ CrewAI não respondeu corretamente"
fi

echo ""

# 4. Testar envio via UAZAPI
echo "4️⃣ Testando envio direto via UAZAPI..."
SEND_RESPONSE=$(curl -s -X POST "https://falachefe.uazapi.com/send/text" \
  -H "token: 4fbeda58-0b8a-4905-9218-8ec89967a4a4" \
  -H "Content-Type: application/json" \
  -d "{
    \"number\": \"$USER_NUMBER\",
    \"text\": \"✅ Teste 4 - Envio direto funcionando às $(date +%H:%M:%S)\"
  }")

echo "   $SEND_RESPONSE" | jq '.messageid, .status' 2>/dev/null || echo "   $SEND_RESPONSE"

if echo "$SEND_RESPONSE" | grep -q "messageid"; then
    echo "   ✅ Envio via UAZAPI funcionando!"
else
    echo "   ❌ Erro ao enviar via UAZAPI"
fi

echo ""

# 5. Teste completo do fluxo
echo "5️⃣ Testando fluxo completo (webhook → CrewAI → envio)..."
TIMESTAMP=$(date +%s)
FULL_TEST=$(curl -s -X POST "https://falachefe.app.br/api/webhook/uaz" \
  -H "Content-Type: application/json" \
  -d "{
    \"EventType\": \"messages\",
    \"event\": \"messages\",
    \"message\": {
      \"id\": \"test-full-$TIMESTAMP\",
      \"messageid\": \"test-full-$TIMESTAMP\",
      \"sender\": \"$USER_NUMBER\",
      \"senderName\": \"Tiago\",
      \"text\": \"Teste completo: qual meu saldo?\",
      \"content\": \"Teste completo: qual meu saldo?\",
      \"type\": \"conversation\",
      \"messageType\": \"conversation\",
      \"fromMe\": false,
      \"isGroup\": false,
      \"messageTimestamp\": ${TIMESTAMP}000,
      \"chatid\": \"${USER_NUMBER}@s.whatsapp.net\"
    },
    \"chat\": {
      \"id\": \"${USER_NUMBER}@s.whatsapp.net\",
      \"name\": \"Tiago\",
      \"wa_chatid\": \"${USER_NUMBER}@s.whatsapp.net\"
    },
    \"owner\": \"554791945151\",
    \"token\": \"4fbeda58-0b8a-4905-9218-8ec89967a4a4\"
  }")

echo "   $FULL_TEST" | jq '.' 2>/dev/null || echo "   $FULL_TEST"

if echo "$FULL_TEST" | grep -q "success.*true"; then
    echo "   ✅ Webhook processou com sucesso!"
    echo ""
    echo "   ⏰ Aguardando 35 segundos para processar..."
    sleep 35
    echo ""
    echo "   📱 VERIFIQUE SEU WHATSAPP (+55 11 99406-6248)"
    echo "   Você recebeu alguma mensagem?"
else
    echo "   ❌ Webhook falhou"
fi

echo ""
echo "============================="
echo "📊 RESUMO:"
echo ""
echo "Se você recebeu:"
echo "   - Mensagem do teste 4 → ✅ Envio funcionando"
echo "   - Mensagem do teste 5 → ✅ Fluxo completo OK!"
echo ""
echo "Se NÃO recebeu mensagem do teste 5:"
echo "   → Python pode não estar disponível na Vercel"
echo "   → OU timeout no processamento do CrewAI"
echo ""

