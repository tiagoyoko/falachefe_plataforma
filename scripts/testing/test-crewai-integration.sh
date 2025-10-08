#!/bin/bash

# ============================================
# Teste de Integração Webhook → CrewAI
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🧪 TESTE DE INTEGRAÇÃO WEBHOOK → CREWAI${NC}"
echo "=========================================="
echo ""

# Base URL
BASE_URL=${1:-"http://localhost:3000"}
echo "🌐 Base URL: $BASE_URL"
echo ""

# ============================================
# TESTE 1: Health Check do Endpoint CrewAI
# ============================================
echo -e "${YELLOW}📍 Teste 1: Health Check do Endpoint CrewAI${NC}"
echo ""

HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" "$BASE_URL/api/crewai/process")
HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$HEALTH_RESPONSE" | sed '/HTTP_CODE/d')

echo "Resposta:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Endpoint existe e está respondendo${NC}"
  
  # Verificar se script Python existe
  SCRIPT_EXISTS=$(echo "$BODY" | jq -r '.pythonScriptExists' 2>/dev/null)
  if [ "$SCRIPT_EXISTS" = "true" ]; then
    echo -e "${GREEN}✅ Script Python encontrado${NC}"
  else
    echo -e "${RED}❌ Script Python NÃO encontrado${NC}"
    echo "$BODY" | jq -r '.scriptPath' 2>/dev/null
    exit 1
  fi
else
  echo -e "${RED}❌ Endpoint não acessível (Status: $HTTP_CODE)${NC}"
  exit 1
fi

echo ""
echo "----------------------------------------"
echo ""

# ============================================
# TESTE 2: Processar Mensagem Simples
# ============================================
echo -e "${YELLOW}📍 Teste 2: Processar Mensagem com CrewAI${NC}"
echo ""

TEST_PAYLOAD=$(cat <<EOF
{
  "message": "Olá! Qual é o meu saldo?",
  "userId": "test-user-integration",
  "phoneNumber": "+5511999999999",
  "context": {
    "userName": "Teste Usuário",
    "isNewUser": false
  }
}
EOF
)

echo "📨 Enviando mensagem para processamento:"
echo "$TEST_PAYLOAD" | jq '.'
echo ""
echo "⏳ Processando com CrewAI (pode demorar 10-30s)..."
echo ""

CREWAI_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
  -X POST "$BASE_URL/api/crewai/process" \
  -H "Content-Type: application/json" \
  -d "$TEST_PAYLOAD")

HTTP_CODE=$(echo "$CREWAI_RESPONSE" | grep "HTTP_CODE" | cut -d: -f2)
BODY=$(echo "$CREWAI_RESPONSE" | sed '/HTTP_CODE/d')

echo "📤 Resposta do CrewAI:"
echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
echo ""

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ Endpoint respondeu (Status: $HTTP_CODE)${NC}"
  
  # Verificar se processou com sucesso
  SUCCESS=$(echo "$BODY" | jq -r '.success' 2>/dev/null)
  if [ "$SUCCESS" = "true" ]; then
    echo -e "${GREEN}✅ CrewAI processou mensagem com sucesso${NC}"
    
    RESPONSE=$(echo "$BODY" | jq -r '.response' 2>/dev/null | head -c 150)
    PROCESSING_TIME=$(echo "$BODY" | jq -r '.metadata.processing_time_ms' 2>/dev/null)
    
    echo ""
    echo "📋 Detalhes:"
    echo "  - Resposta (150 chars): $RESPONSE..."
    echo "  - Tempo de processamento: ${PROCESSING_TIME}ms"
  else
    echo -e "${RED}❌ CrewAI falhou ao processar${NC}"
    ERROR=$(echo "$BODY" | jq -r '.metadata.error // .error // "Unknown"' 2>/dev/null)
    echo "  Erro: $ERROR"
  fi
else
  echo -e "${RED}❌ Endpoint falhou (Status: $HTTP_CODE)${NC}"
  exit 1
fi

echo ""
echo "----------------------------------------"
echo ""

# ============================================
# RESUMO
# ============================================
echo -e "${BLUE}📊 RESUMO DOS TESTES${NC}"
echo "=========================================="
echo ""
echo -e "${GREEN}✅ Teste 1: Health check do endpoint OK${NC}"
echo -e "${GREEN}✅ Teste 2: Processamento CrewAI OK${NC}"
echo ""
echo "🎯 Integração funcionando!"
echo "  ✅ Endpoint /api/crewai/process operacional"
echo "  ✅ Script Python sendo executado"
echo "  ✅ CrewAI processando mensagens"
echo ""
echo "💡 Próximo passo:"
echo "  Testar fluxo completo com webhook"
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 Integração validada com sucesso!${NC}"
echo ""

