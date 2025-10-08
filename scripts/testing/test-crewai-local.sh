#!/bin/bash

# ============================================
# Script de Teste do CrewAI Standalone
# ============================================
#
# Testa se o processador CrewAI funciona
# independentemente do webhook
#

set -e

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BLUE='\033[0;34m'

# Diretório do projeto CrewAI
CREWAI_DIR="/Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew"

echo -e "${BLUE}🧪 TESTE DO CREWAI STANDALONE${NC}"
echo "=========================================="
echo ""

# ============================================
# Verificar pré-requisitos
# ============================================
echo -e "${YELLOW}📍 Verificando pré-requisitos...${NC}"
echo ""

# Verificar diretório
if [ ! -d "$CREWAI_DIR" ]; then
  echo -e "${RED}❌ Diretório do CrewAI não encontrado:${NC}"
  echo "   $CREWAI_DIR"
  exit 1
fi

cd "$CREWAI_DIR"
echo -e "${GREEN}✅ Diretório encontrado${NC}"

# Verificar script
if [ ! -f "webhook_processor.py" ]; then
  echo -e "${RED}❌ Script webhook_processor.py não encontrado${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Script webhook_processor.py encontrado${NC}"

# Verificar ambiente virtual
if [ ! -d ".venv" ]; then
  echo -e "${RED}❌ Ambiente virtual não encontrado${NC}"
  echo "   Execute: python -m venv .venv"
  exit 1
fi
echo -e "${GREEN}✅ Ambiente virtual encontrado${NC}"

# Verificar .env
if [ ! -f ".env" ]; then
  echo -e "${YELLOW}⚠️  Arquivo .env não encontrado${NC}"
  echo "   Criando .env de exemplo..."
  cat > .env <<EOF
OPENAI_API_KEY=sk-proj-sua-chave-aqui
MODEL=gpt-4o-mini
FALACHEFE_API_URL=http://localhost:3000
EOF
  echo -e "${YELLOW}⚠️  Configure sua OPENAI_API_KEY no arquivo .env${NC}"
  exit 1
fi
echo -e "${GREEN}✅ Arquivo .env encontrado${NC}"

echo ""
echo "----------------------------------------"
echo ""

# ============================================
# Ativar ambiente e verificar dependências
# ============================================
echo -e "${YELLOW}📍 Ativando ambiente virtual...${NC}"
echo ""

source .venv/bin/activate

echo -e "${GREEN}✅ Ambiente ativado${NC}"
echo "   Python: $(which python)"
echo "   Versão: $(python --version)"
echo ""

echo -e "${YELLOW}📍 Verificando dependências...${NC}"
echo ""

# Verificar se CrewAI está instalado
if ! python -c "import crewai" 2>/dev/null; then
  echo -e "${RED}❌ CrewAI não instalado${NC}"
  echo "   Instalando dependências..."
  pip install -q -r requirements.txt
  echo -e "${GREEN}✅ Dependências instaladas${NC}"
else
  echo -e "${GREEN}✅ CrewAI instalado${NC}"
fi

echo ""
echo "----------------------------------------"
echo ""

# ============================================
# TESTE 1: Mensagem Simples
# ============================================
echo -e "${YELLOW}📍 Teste 1: Mensagem Simples${NC}"
echo ""

TEST_INPUT=$(cat <<EOF
{
  "user_message": "Olá! Teste do CrewAI standalone",
  "user_id": "test_user_local",
  "phone_number": "+5511999999999",
  "context": {}
}
EOF
)

echo "📨 Input:"
echo "$TEST_INPUT" | jq '.'
echo ""
echo "⏳ Processando com CrewAI..."
echo ""

# Executar script Python
RESULT=$(echo "$TEST_INPUT" | python webhook_processor.py 2>&1)
EXIT_CODE=$?

echo "📤 Output:"
echo "$RESULT" | jq '.' 2>/dev/null || echo "$RESULT"
echo ""

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Teste 1 passou (exit code: 0)${NC}"
  
  # Verificar se resposta contém campos esperados
  if echo "$RESULT" | jq -e '.success' > /dev/null 2>&1; then
    SUCCESS=$(echo "$RESULT" | jq -r '.success')
    if [ "$SUCCESS" = "true" ]; then
      echo -e "${GREEN}✅ CrewAI processou com sucesso${NC}"
      RESPONSE=$(echo "$RESULT" | jq -r '.response' | head -c 100)
      echo "   Resposta (primeiros 100 chars): $RESPONSE..."
    else
      echo -e "${RED}❌ CrewAI retornou success=false${NC}"
      ERROR=$(echo "$RESULT" | jq -r '.metadata.error // "Unknown error"')
      echo "   Erro: $ERROR"
    fi
  fi
else
  echo -e "${RED}❌ Teste 1 falhou (exit code: $EXIT_CODE)${NC}"
  exit 1
fi

echo ""
echo "----------------------------------------"
echo ""

# ============================================
# TESTE 2: Consulta de Saldo
# ============================================
echo -e "${YELLOW}📍 Teste 2: Consulta de Saldo${NC}"
echo ""

TEST_INPUT_2=$(cat <<EOF
{
  "user_message": "Qual é o meu saldo atual?",
  "user_id": "test_user_saldo",
  "phone_number": "+5511888888888",
  "context": {
    "user_context": "Cliente premium"
  }
}
EOF
)

echo "📨 Input:"
echo "$TEST_INPUT_2" | jq '.'
echo ""
echo "⏳ Processando com CrewAI..."
echo ""

RESULT_2=$(echo "$TEST_INPUT_2" | python webhook_processor.py 2>&1)
EXIT_CODE_2=$?

echo "📤 Output:"
echo "$RESULT_2" | jq '.' 2>/dev/null || echo "$RESULT_2"
echo ""

if [ $EXIT_CODE_2 -eq 0 ]; then
  echo -e "${GREEN}✅ Teste 2 passou${NC}"
else
  echo -e "${RED}❌ Teste 2 falhou${NC}"
fi

echo ""
echo "----------------------------------------"
echo ""

# ============================================
# TESTE 3: Validação (deve falhar)
# ============================================
echo -e "${YELLOW}📍 Teste 3: Validação - Mensagem Vazia (deve falhar)${NC}"
echo ""

TEST_INPUT_3=$(cat <<EOF
{
  "user_message": "",
  "user_id": "test_user_empty",
  "phone_number": "+5511777777777"
}
EOF
)

echo "📨 Input (mensagem vazia):"
echo "$TEST_INPUT_3" | jq '.'
echo ""
echo "⏳ Processando..."
echo ""

RESULT_3=$(echo "$TEST_INPUT_3" | python webhook_processor.py 2>&1)
EXIT_CODE_3=$?

echo "📤 Output:"
echo "$RESULT_3" | jq '.' 2>/dev/null || echo "$RESULT_3"
echo ""

# Para esse teste, esperamos exit code 1 (falha)
if [ $EXIT_CODE_3 -ne 0 ]; then
  echo -e "${GREEN}✅ Teste 3 passou (validação funcionou corretamente)${NC}"
  if echo "$RESULT_3" | jq -e '.success == false' > /dev/null 2>&1; then
    ERROR_MSG=$(echo "$RESULT_3" | jq -r '.response')
    echo "   Mensagem de erro: $ERROR_MSG"
  fi
else
  echo -e "${RED}❌ Teste 3 falhou (deveria ter rejeitado mensagem vazia)${NC}"
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

TESTS_PASSED=0
TESTS_FAILED=0

if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✅ Teste 1: Mensagem simples OK${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ Teste 1: Mensagem simples FALHOU${NC}"
  ((TESTS_FAILED++))
fi

if [ $EXIT_CODE_2 -eq 0 ]; then
  echo -e "${GREEN}✅ Teste 2: Consulta de saldo OK${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ Teste 2: Consulta de saldo FALHOU${NC}"
  ((TESTS_FAILED++))
fi

if [ $EXIT_CODE_3 -ne 0 ]; then
  echo -e "${GREEN}✅ Teste 3: Validação OK${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ Teste 3: Validação FALHOU${NC}"
  ((TESTS_FAILED++))
fi

echo ""
echo "Total: $TESTS_PASSED testes passaram, $TESTS_FAILED falharam"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 Todos os testes passaram!${NC}"
  echo ""
  echo "✅ CrewAI standalone está funcionando corretamente"
  echo ""
  echo "💡 Próximo passo:"
  echo "   Implementar endpoint /api/crewai/process no Next.js"
  echo "   para integrar com o webhook"
  exit 0
else
  echo -e "${RED}❌ Alguns testes falharam${NC}"
  echo ""
  echo "🔍 Verifique:"
  echo "   - OPENAI_API_KEY configurada no .env"
  echo "   - Dependências instaladas (pip install -r requirements.txt)"
  echo "   - Logs de erro acima para mais detalhes"
  exit 1
fi

