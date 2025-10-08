#!/bin/bash
# Teste Rápido do Webhook Processor
# ==================================

echo "🚀 TESTE RÁPIDO DO WEBHOOK PROCESSOR"
echo ""

# Input de teste
input_json='{
  "user_message": "Olá, qual é o meu saldo?",
  "user_id": "test_user",
  "phone_number": "+5511999999999"
}'

echo "📥 Enviando mensagem para o CrewAI..."
echo "$input_json" | jq .
echo ""

echo "⏳ Processando..."
echo ""

# Executar
result=$(echo "$input_json" | python webhook_processor.py 2>&1)
exit_code=$?

echo "📤 Resposta:"
echo ""
echo "$result" | jq . 2>/dev/null || echo "$result"
echo ""

if [ $exit_code -eq 0 ]; then
    echo "✅ Sucesso!"
else
    echo "❌ Erro (exit code: $exit_code)"
fi

