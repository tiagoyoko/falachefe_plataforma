#!/bin/bash

# 🧪 Teste de Webhook em Tempo Real
# Este script monitora mensagens chegando no banco de dados

echo "🔍 Monitoramento de Webhook WhatsApp - Tempo Real"
echo "=================================================="
echo ""
echo "📱 INSTRUÇÕES:"
echo "1. Deixe este terminal aberto"
echo "2. Envie uma mensagem WhatsApp para: +55 47 9194-5151"
echo "3. Observe a mensagem aparecer aqui em tempo real"
echo ""
echo "⏱️  Iniciando monitoramento (Ctrl+C para sair)..."
echo ""

# Salvar último ID processado
LAST_ID=""

# Loop infinito
while true; do
  # Buscar última mensagem do banco
  LATEST=$(curl -s -X POST \
    "https://zpdartuyaergbxmbmtur.supabase.co/rest/v1/rpc/get_latest_message" \
    -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZGFydHV5YWVyZ2J4bWJtdHVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDYyMzksImV4cCI6MjA3MzUyMjIzOX0.4__wUA0qA1g1hoRO_3NJMF2bHMSST3zXnn6YmQS8ohc" \
    -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwZGFydHV5YWVyZ2J4bWJtdHVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5NDYyMzksImV4cCI6MjA3MzUyMjIzOX0.4__wUA0qA1g1hoRO_3NJMF2bHMSST3zXnn6YmQS8ohc" \
    -H "Content-Type: application/json" 2>/dev/null)
  
  # Se Supabase RPC não funcionar, usar query direta
  if [ -z "$LATEST" ] || [ "$LATEST" == "null" ]; then
    LATEST=$(psql "$POSTGRES_URL" -t -c "
      SELECT 
        json_build_object(
          'id', id,
          'content', content,
          'sender_type', sender_type,
          'sent_at', sent_at
        )
      FROM messages 
      ORDER BY sent_at DESC 
      LIMIT 1
    " 2>/dev/null | tr -d '\n' | tr -d ' ')
  fi
  
  # Extrair ID da última mensagem
  CURRENT_ID=$(echo "$LATEST" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
  
  # Se mudou, mostrar
  if [ ! -z "$CURRENT_ID" ] && [ "$CURRENT_ID" != "$LAST_ID" ]; then
    TIMESTAMP=$(date "+%H:%M:%S")
    CONTENT=$(echo "$LATEST" | grep -o '"content":"[^"]*"' | cut -d'"' -f4)
    SENDER=$(echo "$LATEST" | grep -o '"sender_type":"[^"]*"' | cut -d'"' -f4)
    
    echo "[$TIMESTAMP] 📨 NOVA MENSAGEM!"
    echo "   ID: $CURRENT_ID"
    echo "   De: $SENDER"
    echo "   Conteúdo: $CONTENT"
    echo ""
    
    LAST_ID="$CURRENT_ID"
  fi
  
  # Aguardar 2 segundos antes de checar novamente
  sleep 2
done

