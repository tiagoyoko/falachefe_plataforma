#!/bin/bash

# Script para atualizar as variáveis de banco de dados no Vercel
# Execute este script DEPOIS de atualizar o .env.local com as novas credenciais

echo "🔧 Atualizando variáveis de banco de dados no Vercel..."
echo ""
echo "⚠️  IMPORTANTE: Certifique-se de ter atualizado o .env.local primeiro!"
echo ""
read -p "Você já atualizou o .env.local com as novas credenciais? (s/N) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[SsYy]$ ]]
then
    echo "❌ Por favor, atualize o .env.local primeiro e execute novamente."
    exit 1
fi

echo ""
echo "📝 Carregando credenciais do .env.local..."

# Carregar variáveis do .env.local
source .env.local

if [ -z "$DATABASE_URL" ] || [ -z "$POSTGRES_URL" ] || [ -z "$POSTGRES_URL_NON_POOLING" ]; then
    echo "❌ Erro: Variáveis de banco de dados não encontradas no .env.local"
    exit 1
fi

echo "✅ Credenciais carregadas"
echo ""
echo "🔄 Atualizando no Vercel..."
echo ""

# Atualizar DATABASE_URL
echo "1/3 Atualizando DATABASE_URL..."
echo "$DATABASE_URL" | vercel env add DATABASE_URL production

# Atualizar POSTGRES_URL
echo "2/3 Atualizando POSTGRES_URL..."
echo "$POSTGRES_URL" | vercel env add POSTGRES_URL production

# Atualizar POSTGRES_URL_NON_POOLING
echo "3/3 Atualizando POSTGRES_URL_NON_POOLING..."
echo "$POSTGRES_URL_NON_POOLING" | vercel env add POSTGRES_URL_NON_POOLING production

echo ""
echo "✅ Variáveis atualizadas no Vercel!"
echo ""
echo "📝 Próximos passos:"
echo "   1. Execute: vercel --prod"
echo "   2. Ou faça push no git para trigger automático"
echo ""

