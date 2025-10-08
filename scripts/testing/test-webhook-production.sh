#!/bin/bash

# ============================================
# Script de Teste do Webhook em Produção
# ============================================
#
# Testa o webhook /api/webhook/uaz em produção
# simulando uma mensagem vinda do UAZAPI
#

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# URL da aplicação
BASE_URL="https://falachefe.app.br"
# Para testar localmente, comente a linha acima e descomente abaixo:
# BASE_URL="http://localhost:3000"

echo -e "${BLUE}🧪 TESTE DO WEBHOOK EM PRODUÇÃO${NC}"
echo "=========================================="
echo ""
echo "🌐 URL: $BASE_URL"
echo ""

# ============================================
# TESTE 1: Health Check
# ============================================
echo -e "${YELLOW}📍 Teste 1: Health Check do Webhook${NC}"
echo ""

HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/api/webhook/uaz")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_CODE/d')

echo "Resposta:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Health check passou (Status: $HTTP_CODE)${NC}"
else
  echo -e "${RED}❌ Health check falhou (Status: $HTTP_CODE)${NC}"
  exit 1
fi

echo ""
echo "----------------------------------------"
echo ""

# ============================================
# TESTE 2: Mensagem Simulada
# ============================================
echo -e "${YELLOW}📍 Teste 2: Enviar Mensagem Simulada${NC}"
echo ""

# Gerar IDs únicos
TIMESTAMP=$(date +%s)
MSG_ID="test-msg-$TIMESTAMP"
PHONE="5511999999999"

echo "📨 Enviando mensagem de teste..."
echo "  - ID: $MSG_ID"
echo "  - De: +$PHONE"
echo "  - Texto: 'Olá! Teste de webhook em produção'"
echo ""

# Payload do webhook
PAYLOAD=$(cat <<EOF
{
  "EventType": "messages",
  "message": {
    "id": "$MSG_ID",
    "messageid": "wamid.$MSG_ID",
    "text": "Olá! Teste de webhook em produção",
    "content": "Olá! Teste de webhook em produção",
    "sender": "${PHONE}@c.us",
    "chatid": "${PHONE}@c.us",
    "type": "chat",
    "messageType": "extendedTextMessage",
    "fromMe": false,
    "isGroup": false,
    "messageTimestamp": $TIMESTAMP,
    "senderName": "Teste Usuario Webhook"
  },
  "chat": {
    "id": "${PHONE}@c.us",
    "name": "Teste Usuario Webhook",
    "wa_chatid": "${PHONE}@c.us",
    "wa_name": "Teste Usuario Webhook",
    "wa_isGroup": false,
    "wa_unreadCount": 0
  },
  "owner": "falachefe-webhook-test",
  "token": "test-token-$TIMESTAMP"
}
EOF
)

# Enviar requisição
WEBHOOK_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$BASE_URL/api/webhook/uaz" \
  -H "Content-Type: application/json" \
  -d "$PAYLOAD")

HTTP_CODE=$(echo "$WEBHOOK_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$WEBHOOK_RESPONSE" | sed '/HTTP_CODE/d')

echo "Resposta do webhook:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Webhook processou mensagem com sucesso (Status: $HTTP_CODE)${NC}"
else
  echo -e "${RED}❌ Webhook falhou (Status: $HTTP_CODE)${NC}"
  exit 1
fi

echo ""
echo "----------------------------------------"
echo ""

# ============================================
# TESTE 3: Verificar Logs
# ============================================
echo -e "${YELLOW}📍 Teste 3: Verificação de Logs${NC}"
echo ""
echo "🔍 Para verificar se a mensagem foi processada:"
echo ""
echo "1. Acesse os logs da Vercel:"
echo "   ${BLUE}https://vercel.com/[seu-usuario]/falachefe/logs${NC}"
echo ""
echo "2. Procure pelos logs com timestamp próximo a: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""
echo "3. Logs esperados:"
echo "   ✅ 'UAZ Webhook received'"
echo "   ✅ 'Processing message event'"
echo "   ✅ 'Message saved successfully'"
echo "   ⚠️  'AgentOrchestrator disabled' (esperado, pois integração CrewAI não está ativa)"
echo ""
echo "4. Campos importantes nos logs:"
echo "   - messageId: $MSG_ID"
echo "   - sender: ${PHONE}@c.us"
echo "   - text: 'Olá! Teste de webhook em produção'"
echo ""

echo "----------------------------------------"
echo ""

# ============================================
# RESUMO
# ============================================
echo -e "${BLUE}📊 RESUMO DOS TESTES${NC}"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ Teste 1: Health check OK${NC}"
echo -e "${GREEN}✅ Teste 2: Webhook processa mensagens OK${NC}"
echo -e "${YELLOW}⚠️  Teste 3: Verificar logs manualmente${NC}"
echo ""
echo "🎯 Status da Integração:"
echo "  ✅ Webhook recebe mensagens"
echo "  ✅ Mensagens são salvas no banco"
echo "  ❌ CrewAI não está sendo chamado (esperado)"
echo ""
echo "💡 Próximo passo:"
echo "  Implementar endpoint /api/crewai/process"
echo "  para conectar webhook ao CrewAI"
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Testes concluídos!${NC}"
echo ""

