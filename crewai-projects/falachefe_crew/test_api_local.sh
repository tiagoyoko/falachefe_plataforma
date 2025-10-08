#!/bin/bash

# Teste local da API Flask antes de deploy no Railway

echo "🧪 TESTE LOCAL DA API FLASK"
echo "============================"
echo ""

# Verificar se está no diretório correto
if [ ! -f "api_server.py" ]; then
    echo "❌ Execute este script no diretório crewai-projects/falachefe_crew"
    exit 1
fi

# Verificar se variáveis estão configuradas
if [ ! -f ".env" ]; then
    echo "❌ Arquivo .env não encontrado"
    echo "   Copie .env.example para .env e configure as variáveis"
    exit 1
fi

# Carregar variáveis
export $(cat .env | grep -v "^#" | xargs)

echo "✅ Variáveis carregadas"
echo "   UAZAPI_BASE_URL: $UAZAPI_BASE_URL"
echo "   UAZAPI_TOKEN: ${UAZAPI_TOKEN:0:10}..."
echo ""

# Iniciar servidor em background
echo "🚀 Iniciando servidor Flask..."
python3 api_server.py &
SERVER_PID=$!

# Aguardar servidor iniciar
sleep 3

echo "🔍 Testando health check..."
HEALTH=$(curl -s http://localhost:8000/health)
echo "$HEALTH" | jq '.' 2>/dev/null || echo "$HEALTH"

if echo "$HEALTH" | grep -q "ok"; then
    echo "✅ Servidor está rodando!"
else
    echo "❌ Servidor não respondeu"
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🧪 Testando processamento de mensagem..."
RESPONSE=$(curl -s -X POST "http://localhost:8000/process" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Qual meu saldo?",
    "userId": "test-local-123",
    "phoneNumber": "5511994066248",
    "context": {
      "conversationId": "test-conv",
      "chatName": "Teste",
      "isNewUser": false
    }
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q '"success":true'; then
    echo ""
    echo "✅ API funcionando corretamente!"
    echo ""
    echo "📱 Verifique seu WhatsApp (+55 11 99406-6248)"
    echo "   Você deve ter recebido a resposta do CrewAI!"
else
    echo ""
    echo "❌ API retornou erro"
fi

echo ""
echo "🛑 Parando servidor..."
kill $SERVER_PID 2>/dev/null

echo ""
echo "============================"
echo "✅ Teste completo!"
echo ""
echo "Se funcionou, faça deploy no Railway:"
echo "  railway up"

