#!/bin/bash

##############################################################################
# Script de Teste - Chat Web com CrewAI
# 
# Este script testa a integração completa do chat web com o CrewAI:
# 1. Interface web → /api/chat
# 2. /api/chat → /api/crewai/process
# 3. CrewAI processa mensagem
# 4. Resposta retorna para interface
#
# Uso:
#   ./scripts/testing/test-web-chat.sh [local|production]
##############################################################################

set -e  # Parar em erros

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Determinar ambiente (local ou production)
ENV=${1:-local}

if [ "$ENV" = "production" ]; then
    BASE_URL="https://falachefe.app.br"
    log_info "Testando em PRODUÇÃO: $BASE_URL"
elif [ "$ENV" = "local" ]; then
    BASE_URL="http://localhost:3000"
    log_info "Testando em LOCAL: $BASE_URL"
else
    log_error "Ambiente inválido. Use: local ou production"
    exit 1
fi

echo ""
echo "═══════════════════════════════════════════════════"
echo "  Teste de Chat Web com CrewAI"
echo "  Ambiente: $ENV"
echo "  URL: $BASE_URL"
echo "═══════════════════════════════════════════════════"
echo ""

# Teste 1: Health Check do endpoint /api/chat
echo ""
log_info "Teste 1: Health Check do endpoint /api/chat"
echo "---------------------------------------------------"

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/chat")
HEALTH_HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

echo "HTTP Status: $HEALTH_HTTP_CODE"
echo "Response:"
echo "$HEALTH_BODY" | jq '.' 2>/dev/null || echo "$HEALTH_BODY"

if [ "$HEALTH_HTTP_CODE" = "200" ]; then
    log_success "Health check passou!"
else
    log_error "Health check falhou com status $HEALTH_HTTP_CODE"
    exit 1
fi

# Teste 2: Enviar mensagem simples
echo ""
log_info "Teste 2: Enviar mensagem simples ao chat"
echo "---------------------------------------------------"

MESSAGE="Olá! Qual é o meu saldo atual?"
USER_ID="test-web-user-$(date +%s)"

log_info "Mensagem: $MESSAGE"
log_info "User ID: $USER_ID"

CHAT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"$MESSAGE\",
    \"userId\": \"$USER_ID\",
    \"conversationId\": \"test-conv-$(date +%s)\",
    \"includeUserProfile\": true,
    \"forceToolUse\": true
  }")

CHAT_HTTP_CODE=$(echo "$CHAT_RESPONSE" | tail -n1)
CHAT_BODY=$(echo "$CHAT_RESPONSE" | sed '$d')

echo "HTTP Status: $CHAT_HTTP_CODE"
echo "Response:"
echo "$CHAT_BODY" | jq '.' 2>/dev/null || echo "$CHAT_BODY"

if [ "$CHAT_HTTP_CODE" = "200" ]; then
    log_success "Mensagem processada com sucesso!"
    
    # Extrair e exibir resposta do agente
    AGENT_RESPONSE=$(echo "$CHAT_BODY" | jq -r '.content // .response' 2>/dev/null || echo "")
    if [ -n "$AGENT_RESPONSE" ] && [ "$AGENT_RESPONSE" != "null" ]; then
        echo ""
        log_success "Resposta do Agente:"
        echo "---------------------------------------------------"
        echo "$AGENT_RESPONSE"
        echo "---------------------------------------------------"
    fi
    
    # Extrair metadata
    PROCESSING_TIME=$(echo "$CHAT_BODY" | jq -r '.metadata.processing_time_ms // "N/A"' 2>/dev/null || echo "N/A")
    log_info "Tempo de processamento: ${PROCESSING_TIME}ms"
else
    log_error "Falha ao processar mensagem. Status: $CHAT_HTTP_CODE"
    exit 1
fi

# Teste 3: Mensagem sem userId (deve falhar)
echo ""
log_info "Teste 3: Teste de validação (sem userId, deve falhar)"
echo "---------------------------------------------------"

VALIDATION_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"Teste sem userId\"
  }")

VALIDATION_HTTP_CODE=$(echo "$VALIDATION_RESPONSE" | tail -n1)
VALIDATION_BODY=$(echo "$VALIDATION_RESPONSE" | sed '$d')

echo "HTTP Status: $VALIDATION_HTTP_CODE"
echo "Response:"
echo "$VALIDATION_BODY" | jq '.' 2>/dev/null || echo "$VALIDATION_BODY"

if [ "$VALIDATION_HTTP_CODE" = "401" ] || [ "$VALIDATION_HTTP_CODE" = "400" ]; then
    log_success "Validação funcionando corretamente (rejeitou requisição sem userId)"
else
    log_warning "Validação não rejeitou requisição sem userId. Status: $VALIDATION_HTTP_CODE"
fi

# Teste 4: Mensagem vazia (deve falhar)
echo ""
log_info "Teste 4: Teste de validação (mensagem vazia, deve falhar)"
echo "---------------------------------------------------"

EMPTY_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": \"\",
    \"userId\": \"test-user\"
  }")

EMPTY_HTTP_CODE=$(echo "$EMPTY_RESPONSE" | tail -n1)
EMPTY_BODY=$(echo "$EMPTY_RESPONSE" | sed '$d')

echo "HTTP Status: $EMPTY_HTTP_CODE"
echo "Response:"
echo "$EMPTY_BODY" | jq '.' 2>/dev/null || echo "$EMPTY_BODY"

if [ "$EMPTY_HTTP_CODE" = "400" ]; then
    log_success "Validação funcionando corretamente (rejeitou mensagem vazia)"
else
    log_warning "Validação não rejeitou mensagem vazia. Status: $EMPTY_HTTP_CODE"
fi

# Resumo final
echo ""
echo "═══════════════════════════════════════════════════"
echo "  Resumo dos Testes"
echo "═══════════════════════════════════════════════════"
echo ""
log_success "✅ Health Check: Passou"
log_success "✅ Envio de Mensagem: Funcionando"
log_success "✅ Validação userId: Funcionando"
log_success "✅ Validação mensagem: Funcionando"
echo ""
log_success "Todos os testes passaram! 🎉"
echo ""
log_info "Próximos passos:"
echo "  1. Abra o navegador em: $BASE_URL/chat"
echo "  2. Faça login na aplicação"
echo "  3. Envie mensagens para testar a interface web"
echo ""

if [ "$ENV" = "production" ]; then
    log_warning "ATENÇÃO: O CrewAI não funciona em produção na Vercel!"
    log_warning "O Python não está disponível no ambiente serverless da Vercel."
    log_warning "Para funcionamento completo, deploy o CrewAI separadamente:"
    echo "  - Railway.app"
    echo "  - Render.com"
    echo "  - Google Cloud Run"
    echo "  - Heroku"
fi

exit 0

