#!/bin/bash

echo "🚀 Testando Financial Agent"
echo "=========================="
echo ""

# Verificar se o servidor está rodando
echo "📡 Verificando se o servidor está rodando..."
if ! curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "❌ Servidor não está rodando. Inicie com: npm run dev"
    echo ""
    echo "🔧 Alternativa: Teste via script TypeScript"
    echo "npx tsx src/agents/financial/test-simple.ts"
    exit 1
fi

echo "✅ Servidor está rodando!"
echo ""

# Teste 1: GET request
echo "🧪 Teste 1: GET Request - Análise de Fluxo de Caixa"
echo "GET /api/test/financial-agent?message=Como está meu fluxo de caixa?"
echo ""

response1=$(curl -s "http://localhost:3000/api/test/financial-agent?message=Como%20está%20meu%20fluxo%20de%20caixa?")
echo "📤 Resposta:"
echo "$response1" | jq '.' 2>/dev/null || echo "$response1"
echo ""

# Teste 2: POST request
echo "🧪 Teste 2: POST Request - Adicionar Despesa"
echo "POST /api/test/financial-agent"
echo ""

response2=$(curl -s -X POST "http://localhost:3000/api/test/financial-agent" \
  -H "Content-Type: application/json" \
  -d '{"message": "Adicione uma despesa de R$ 50,00 para alimentação hoje"}')
echo "📤 Resposta:"
echo "$response2" | jq '.' 2>/dev/null || echo "$response2"
echo ""

# Teste 3: Listar categorias
echo "🧪 Teste 3: Listar Categorias"
echo "GET /api/test/financial-agent?message=Quais categorias existem?"
echo ""

response3=$(curl -s "http://localhost:3000/api/test/financial-agent?message=Quais%20categorias%20existem?")
echo "📤 Resposta:"
echo "$response3" | jq '.' 2>/dev/null || echo "$response3"
echo ""

echo "🎉 Testes concluídos!"
echo ""
echo "💡 Dicas:"
echo "  - Para testar outras mensagens, use:"
echo "    curl 'http://localhost:3000/api/test/financial-agent?message=SUA_MENSAGEM'"
echo "  - Para testar via POST:"
echo "    curl -X POST 'http://localhost:3000/api/test/financial-agent' -H 'Content-Type: application/json' -d '{\"message\": \"SUA_MENSAGEM\"}'"
echo "  - Para testar via script TypeScript:"
echo "    npx tsx src/agents/financial/test-simple.ts"
