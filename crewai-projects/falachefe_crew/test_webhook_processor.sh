#!/bin/bash
# Teste do Webhook Processor
# ===========================

set -e

echo "========================================"
echo "🧪 TESTE DO WEBHOOK PROCESSOR"
echo "========================================"
echo ""

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Verificar se está no ambiente virtual
if [ -z "$VIRTUAL_ENV" ]; then
    echo "${YELLOW}⚠️  Ambiente virtual não ativado${NC}"
    echo "   Tentando ativar .venv..."
    
    if [ -d ".venv" ]; then
        source .venv/bin/activate
        echo "${GREEN}✅ Ambiente virtual ativado${NC}"
    else
        echo "${RED}❌ Ambiente virtual não encontrado${NC}"
        echo "   Execute: python -m venv .venv && source .venv/bin/activate"
        exit 1
    fi
fi

# Verificar se script existe
if [ ! -f "webhook_processor.py" ]; then
    echo "${RED}❌ webhook_processor.py não encontrado${NC}"
    exit 1
fi

echo "${GREEN}✅ Script encontrado${NC}"
echo ""

# Função para executar teste
run_test() {
    local test_name=$1
    local input_json=$2
    
    echo "----------------------------------------"
    echo "🧪 Teste: $test_name"
    echo "----------------------------------------"
    
    echo "📥 Input:"
    echo "$input_json" | jq .
    echo ""
    
    echo "🚀 Executando..."
    echo ""
    
    # Executar e capturar saída
    result=$(echo "$input_json" | python webhook_processor.py 2>&1)
    exit_code=$?
    
    echo "📤 Output:"
    echo "$result" | jq . 2>/dev/null || echo "$result"
    echo ""
    
    if [ $exit_code -eq 0 ]; then
        echo "${GREEN}✅ Teste passou (exit code: $exit_code)${NC}"
    else
        echo "${RED}❌ Teste falhou (exit code: $exit_code)${NC}"
    fi
    
    echo ""
}

# Teste 1: Mensagem simples
echo "=========================================="
echo "TESTE 1: Mensagem Simples"
echo "=========================================="
echo ""

test_1_input='{
  "user_message": "Olá, como você pode me ajudar?",
  "user_id": "test_user_1",
  "phone_number": "+5511999999999"
}'

run_test "Mensagem Simples" "$test_1_input"

# Teste 2: Consulta de saldo
echo "=========================================="
echo "TESTE 2: Consulta de Saldo"
echo "=========================================="
echo ""

test_2_input='{
  "user_message": "Qual é o meu saldo atual no fluxo de caixa?",
  "user_id": "test_empresa",
  "phone_number": "+5511888888888"
}'

run_test "Consulta de Saldo" "$test_2_input"

# Teste 3: Registro de despesa
echo "=========================================="
echo "TESTE 3: Registro de Despesa"
echo "=========================================="
echo ""

test_3_input='{
  "user_message": "Registre uma despesa de R$ 500 em alimentação",
  "user_id": "test_empresa",
  "phone_number": "+5511777777777"
}'

run_test "Registro de Despesa" "$test_3_input"

# Teste 4: Com contexto adicional
echo "=========================================="
echo "TESTE 4: Com Contexto Adicional"
echo "=========================================="
echo ""

test_4_input='{
  "user_message": "Me ajude a aumentar minhas vendas",
  "user_id": "test_empresa",
  "phone_number": "+5511666666666",
  "context": {
    "chatName": "Empresa XYZ",
    "senderName": "João Silva",
    "isGroup": false
  }
}'

run_test "Com Contexto" "$test_4_input"

# Teste 5: Mensagem vazia (erro esperado)
echo "=========================================="
echo "TESTE 5: Validação - Mensagem Vazia"
echo "=========================================="
echo ""

test_5_input='{
  "user_message": "",
  "user_id": "test_user",
  "phone_number": "+5511555555555"
}'

run_test "Mensagem Vazia (deve falhar)" "$test_5_input"

# Teste 6: Sem user_id (erro esperado)
echo "=========================================="
echo "TESTE 6: Validação - Sem user_id"
echo "=========================================="
echo ""

test_6_input='{
  "user_message": "Teste sem user_id",
  "phone_number": "+5511444444444"
}'

run_test "Sem user_id (deve falhar)" "$test_6_input"

# Resumo
echo ""
echo "=========================================="
echo "📊 RESUMO DOS TESTES"
echo "=========================================="
echo ""
echo "✅ Testes funcionais: 4"
echo "✅ Testes de validação: 2"
echo ""
echo "${GREEN}🎉 Todos os testes executados!${NC}"
echo ""
echo "📝 Próximos passos:"
echo "   1. Verificar se as respostas estão corretas"
echo "   2. Testar integração com webhook real"
echo "   3. Monitorar logs de execução"
echo ""

