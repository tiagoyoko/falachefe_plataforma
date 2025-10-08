#!/bin/bash

# Script para atualizar token UAZAPI na Vercel
# Uso: ./update-vercel-uazapi-token.sh

set -e

echo "🔄 Atualizando variáveis UAZAPI na Vercel..."
echo ""

# Novo token do .env.local
NEW_TOKEN="4fbeda58-0b8a-4905-9218-8ec89967a4a4"
NEW_APP_URL="https://falachefe.app.br"

echo "📝 Valores a serem configurados:"
echo "   UAZAPI_TOKEN: $NEW_TOKEN"
echo "   UAZAPI_INSTANCE_TOKEN: $NEW_TOKEN"
echo "   NEXT_PUBLIC_APP_URL: $NEW_APP_URL"
echo ""

# Remover variáveis antigas (production, preview, development)
echo "🗑️  Removendo variáveis antigas..."
echo "y" | vercel env rm UAZAPI_TOKEN production 2>/dev/null || true
echo "y" | vercel env rm UAZAPI_INSTANCE_TOKEN production 2>/dev/null || true
echo "y" | vercel env rm NEXT_PUBLIC_APP_URL production 2>/dev/null || true

echo ""
echo "✅ Variáveis antigas removidas"
echo ""

# Adicionar novas variáveis
echo "➕ Adicionando novas variáveis..."
echo "$NEW_TOKEN" | vercel env add UAZAPI_TOKEN production
echo "$NEW_TOKEN" | vercel env add UAZAPI_INSTANCE_TOKEN production
echo "$NEW_APP_URL" | vercel env add NEXT_PUBLIC_APP_URL production

echo ""
echo "✅ Variáveis atualizadas com sucesso!"
echo ""
echo "🚀 Próximo passo: Fazer redeploy"
echo "   Execute: vercel --prod"
echo ""

