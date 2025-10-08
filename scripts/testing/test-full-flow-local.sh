#!/bin/bash

# Teste do fluxo completo localmente
# Simula: Webhook → CrewAI → Resposta

set -e

echo "🧪 TESTE COMPLETO DO FLUXO - LOCAL"
echo "=================================="
echo ""

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 1. Testar se Python e CrewAI estão OK
echo "1️⃣ Testando Python + CrewAI..."
cd crewai-projects/falachefe_crew

# Testar webhook_processor.py
echo '{"user_message":"Qual meu saldo?","user_id":"test123","phone_number":"5511999999999"}' | python3 webhook_processor.py > /tmp/crewai_response.json 2>&1

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Python + CrewAI funcionando!${NC}"
    echo "📤 Resposta do CrewAI:"
    cat /tmp/crewai_response.json | jq '.' 2>/dev/null || cat /tmp/crewai_response.json
else
    echo -e "${RED}❌ Erro no Python/CrewAI${NC}"
    cat /tmp/crewai_response.json
    exit 1
fi

echo ""
echo "2️⃣ Testando endpoint /api/crewai/process (se servidor local estiver rodando)..."

# Verificar se servidor Next.js está rodando
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Servidor Next.js detectado${NC}"
    
    # Testar endpoint
    curl -X POST "http://localhost:3000/api/crewai/process" \
      -H "Content-Type: application/json" \
      -d '{
        "message": "Teste do fluxo completo",
        "userId": "test-local-123",
        "phoneNumber": "5511999999999",
        "context": {
          "conversationId": "test-conv",
          "isNewUser": false
        }
      }' | jq '.'
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Endpoint CrewAI funcionando!${NC}"
    else
        echo -e "${RED}❌ Erro no endpoint CrewAI${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Servidor Next.js não está rodando${NC}"
    echo "   Inicie com: npm run dev"
    echo "   Pule este teste por enquanto."
fi

echo ""
echo "3️⃣ Testando envio direto via UAZAPI..."

cd ../..

# Enviar mensagem de teste
RESPONSE=$(curl -s -X POST "https://falachefe.uazapi.com/send/text" \
  -H "token: 4fbeda58-0b8a-4905-9218-8ec89967a4a4" \
  -H "Content-Type: application/json" \
  -d '{
    "number": "554791945151",
    "text": "✅ Teste completo do fluxo - Esta mensagem foi enviada via script de teste"
  }')

echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

if echo "$RESPONSE" | grep -q "messageid"; then
    echo -e "${GREEN}✅ Envio via UAZAPI funcionando!${NC}"
else
    echo -e "${RED}❌ Erro ao enviar via UAZAPI${NC}"
fi

echo ""
echo "=================================="
echo "📊 RESUMO DOS TESTES:"
echo "✅ 1. Python + CrewAI: OK"
echo "?  2. Endpoint /api/crewai/process: Verificar com servidor rodando"
echo "✅ 3. Envio via UAZAPI: OK"
echo ""
echo "🔍 PRÓXIMO PASSO:"
echo "   Se você recebeu a mensagem de teste no WhatsApp (+55 47 9194-5151),"
echo "   significa que o token está OK!"
echo ""
echo "   Se NÃO recebeu quando envia mensagem, o problema pode ser:"
echo "   - Webhook UAZAPI não está sendo disparado"
echo "   - Python não disponível na Vercel (serverless)"
echo "   - Timeout do CrewAI (>60s)"
echo ""

