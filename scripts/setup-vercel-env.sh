#!/bin/bash
# Setup Variáveis de Ambiente no Vercel
# =====================================

set -e

echo "🚀 CONFIGURAÇÃO DE VARIÁVEIS DE AMBIENTE - VERCEL"
echo "=================================================="
echo ""

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Carregar .env.local
if [ ! -f ".env.local" ]; then
    echo "${RED}❌ Arquivo .env.local não encontrado${NC}"
    exit 1
fi

source .env.local

echo "${GREEN}✅ Variáveis carregadas do .env.local${NC}"
echo ""

# Verificar se está linkado ao Vercel
if [ ! -d ".vercel" ]; then
    echo "${RED}❌ Projeto não está linkado ao Vercel${NC}"
    echo "   Execute: vercel link --yes"
    exit 1
fi

echo "${GREEN}✅ Projeto linkado ao Vercel${NC}"
echo ""

# Função para adicionar variável
add_env_var() {
    local var_name=$1
    local var_value=$2
    local env_type=${3:-"production,preview"}
    
    if [ -z "$var_value" ]; then
        echo "${YELLOW}⚠️  Pulando $var_name (vazio)${NC}"
        return
    fi
    
    echo "📝 Adicionando: $var_name"
    
    # Remover se já existir
    vercel env rm "$var_name" production --yes 2>/dev/null || true
    vercel env rm "$var_name" preview --yes 2>/dev/null || true
    
    # Adicionar novo valor
    echo "$var_value" | vercel env add "$var_name" production --yes > /dev/null 2>&1
    echo "$var_value" | vercel env add "$var_name" preview --yes > /dev/null 2>&1
    
    echo "${GREEN}✅ $var_name configurado${NC}"
}

echo "🔧 Configurando variáveis de ambiente..."
echo ""

# Database
echo "📦 DATABASE..."
add_env_var "DATABASE_URL" "$DATABASE_URL"
add_env_var "POSTGRES_URL" "$POSTGRES_URL"
add_env_var "POSTGRES_URL_NON_POOLING" "$POSTGRES_URL_NON_POOLING"

# OpenAI
echo ""
echo "🤖 OPENAI..."
add_env_var "OPENAI_API_KEY" "$OPENAI_API_KEY"
add_env_var "OPENAI_MODEL" "$OPENAI_MODEL"
add_env_var "OPENAI_EMBEDDING_MODEL" "$OPENAI_EMBEDDING_MODEL"

# Supabase
echo ""
echo "🗄️  SUPABASE..."
add_env_var "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL"
add_env_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY"
add_env_var "SUPABASE_URL" "$SUPABASE_URL"
add_env_var "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY"
add_env_var "SUPABASE_JWT_SECRET" "$SUPABASE_JWT_SECRET"

# WhatsApp
echo ""
echo "📱 WHATSAPP (UAZAPI)..."
add_env_var "UAZAPI_BASE_URL" "$UAZAPI_BASE_URL"
add_env_var "UAZAPI_ADMIN_TOKEN" "$UAZAPI_ADMIN_TOKEN"
add_env_var "UAZAPI_TOKEN" "$UAZAPI_TOKEN"
add_env_var "UAZAPI_INSTANCE_TOKEN" "$UAZAPI_INSTANCE_TOKEN"

# Google OAuth
echo ""
echo "🔐 GOOGLE OAUTH..."
add_env_var "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID"
add_env_var "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET"

# Better Auth
echo ""
echo "🔑 BETTER AUTH..."
# Gerar secret se não existir
if [ -z "$BETTER_AUTH_SECRET" ]; then
    BETTER_AUTH_SECRET=$(openssl rand -base64 32)
    echo "   Gerado novo secret: ${BETTER_AUTH_SECRET:0:20}..."
fi
add_env_var "BETTER_AUTH_SECRET" "$BETTER_AUTH_SECRET"
add_env_var "BETTER_AUTH_URL" "https://falachefe-tiago-6739s-projects.vercel.app"

# App URL
echo ""
echo "🌐 APP CONFIG..."
add_env_var "NEXT_PUBLIC_APP_URL" "https://falachefe-tiago-6739s-projects.vercel.app"
add_env_var "NODE_ENV" "production"

# Dart AI
echo ""
echo "🎯 DART AI..."
add_env_var "DART_TOKEN" "$DART_TOKEN"
add_env_var "AUTH_HEADER" "$AUTH_HEADER"

echo ""
echo "=========================================="
echo "${GREEN}✅ TODAS AS VARIÁVEIS CONFIGURADAS!${NC}"
echo "=========================================="
echo ""

echo "📊 Listando variáveis configuradas:"
vercel env ls

echo ""
echo "🚀 Próximos passos:"
echo "   1. Verificar variáveis: vercel env ls"
echo "   2. Fazer redeploy: vercel --prod"
echo "   3. Ou: Push para master (auto-deploy)"
echo ""

