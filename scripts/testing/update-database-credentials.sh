#!/bin/bash

# Script interativo para atualizar credenciais do banco de dados

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║         🔧 ATUALIZAÇÃO DE CREDENCIAIS DO BANCO DE DADOS - SUPABASE         ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""
echo "Este script vai te guiar para atualizar as credenciais do Supabase."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PASSO 1: Acessar o Supabase Dashboard${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "1. Abra o navegador e acesse:"
echo ""
echo -e "   ${GREEN}https://supabase.com/dashboard/project/zpdartuyaergbxmbmtur/settings/database${NC}"
echo ""
echo "2. Faça login se necessário"
echo ""
echo "3. Role até a seção ${YELLOW}'Connection String'${NC}"
echo ""
read -p "Pressione ENTER quando estiver na página..." 

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PASSO 2: Obter ou Resetar a Senha${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Você se lembra da senha atual do banco de dados?"
echo ""
echo "  1) Sim, eu lembro da senha"
echo "  2) Não, preciso resetar a senha"
echo ""
read -p "Escolha (1 ou 2): " password_option

if [ "$password_option" = "2" ]; then
    echo ""
    echo -e "${RED}⚠️  ATENÇÃO: Resetar a senha vai desconectar TODAS as aplicações atuais!${NC}"
    echo ""
    echo "No Supabase Dashboard:"
    echo "  1. Clique em ${YELLOW}'Reset Database Password'${NC}"
    echo "  2. Confirme a ação"
    echo "  3. ${RED}COPIE A NOVA SENHA${NC} (ela só aparece uma vez!)"
    echo ""
    read -p "Pressione ENTER após resetar a senha..." 
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PASSO 3: Copiar as Connection Strings${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "No Supabase Dashboard, você verá 3 strings de conexão:"
echo ""
echo -e "${GREEN}1) URI (Direct connection)${NC}"
echo "   Use this for: DATABASE_URL e POSTGRES_URL_NON_POOLING"
echo ""
echo -e "${GREEN}2) Connection pooling (Transaction mode)${NC}"
echo "   Use this for: POSTGRES_URL"
echo ""
echo "Vamos coletar cada uma:"
echo ""

# Coletar DATABASE_URL (Direct connection)
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "📋 DATABASE_URL (URI / Direct connection)"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "No Supabase, copie a string que começa com:"
echo -e "${GREEN}postgres://postgres.zpdartuyaergbxmbmtur:[PASSWORD]@db.zpdartuyaergbxmbmtur...${NC}"
echo ""
echo "Cole aqui (ou pressione Ctrl+C para cancelar):"
read -r DATABASE_URL

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ Nenhuma string fornecida. Abortando.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "📋 POSTGRES_URL (Connection pooling / Transaction mode)"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "No Supabase, copie a string que começa com:"
echo -e "${GREEN}postgres://postgres.zpdartuyaergbxmbmtur:[PASSWORD]@aws-1-sa-east-1.pooler...${NC}"
echo ""
echo "Cole aqui:"
read -r POSTGRES_URL

if [ -z "$POSTGRES_URL" ]; then
    echo -e "${RED}❌ Nenhuma string fornecida. Abortando.${NC}"
    exit 1
fi

# POSTGRES_URL_NON_POOLING é igual a DATABASE_URL
POSTGRES_URL_NON_POOLING="$DATABASE_URL"

echo ""
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PASSO 4: Validar as Credenciais${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Validações básicas
valid=true

if [[ ! $DATABASE_URL =~ ^postgres://postgres\.zpdartuyaergbxmbmtur:.+@db\.zpdartuyaergbxmbmtur ]]; then
    echo -e "${RED}❌ DATABASE_URL parece inválida!${NC}"
    valid=false
fi

if [[ ! $POSTGRES_URL =~ ^postgres://postgres\.zpdartuyaergbxmbmtur:.+@aws-1-sa-east-1\.pooler ]]; then
    echo -e "${RED}❌ POSTGRES_URL parece inválida!${NC}"
    valid=false
fi

if [ "$valid" = false ]; then
    echo ""
    echo -e "${RED}Verifique as strings e tente novamente.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Formato das strings OK!${NC}"
echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PASSO 5: Atualizar .env.local${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Fazer backup do .env.local
cp .env.local .env.local.backup
echo -e "${GREEN}✅ Backup criado: .env.local.backup${NC}"

# Atualizar .env.local
sed -i.tmp "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env.local
sed -i.tmp "s|^POSTGRES_URL=.*|POSTGRES_URL=\"$POSTGRES_URL\"|" .env.local
sed -i.tmp "s|^POSTGRES_URL_NON_POOLING=.*|POSTGRES_URL_NON_POOLING=\"$POSTGRES_URL_NON_POOLING\"|" .env.local
rm -f .env.local.tmp

echo -e "${GREEN}✅ Arquivo .env.local atualizado!${NC}"
echo ""

echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}PASSO 6: Testar Conexão${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Testando conexão com o banco de dados..."
echo ""

# Testar conexão
if npx tsx scripts/testing/test-db-connection-simple.ts; then
    echo ""
    echo -e "${GREEN}✅ Conexão testada com sucesso!${NC}"
    echo ""
    
    echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
    echo -e "${YELLOW}PASSO 7: Atualizar Variáveis no Vercel${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "Agora vamos atualizar as mesmas variáveis no Vercel (produção)."
    echo ""
    read -p "Deseja continuar? (S/n): " continue_vercel
    
    if [[ ! $continue_vercel =~ ^[Nn]$ ]]; then
        echo ""
        echo "Removendo variáveis antigas..."
        echo "$DATABASE_URL" | vercel env rm DATABASE_URL production --yes 2>/dev/null || true
        echo "$POSTGRES_URL" | vercel env rm POSTGRES_URL production --yes 2>/dev/null || true
        echo "$POSTGRES_URL_NON_POOLING" | vercel env rm POSTGRES_URL_NON_POOLING production --yes 2>/dev/null || true
        
        echo ""
        echo "Adicionando novas variáveis..."
        
        echo "$DATABASE_URL" | vercel env add DATABASE_URL production
        echo "$POSTGRES_URL" | vercel env add POSTGRES_URL production
        echo "$POSTGRES_URL_NON_POOLING" | vercel env add POSTGRES_URL_NON_POOLING production
        
        echo ""
        echo -e "${GREEN}✅ Variáveis atualizadas no Vercel!${NC}"
        echo ""
        
        echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
        echo -e "${YELLOW}PASSO 8: Fazer Redeploy${NC}"
        echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════${NC}"
        echo ""
        echo "Deseja fazer o redeploy agora?"
        echo ""
        echo "  1) Sim, fazer redeploy agora (vercel --prod)"
        echo "  2) Não, vou fazer push no Git depois"
        echo ""
        read -p "Escolha (1 ou 2): " deploy_option
        
        if [ "$deploy_option" = "1" ]; then
            echo ""
            echo "Fazendo deploy para produção..."
            vercel --prod
        else
            echo ""
            echo -e "${YELLOW}⚠️  Lembre-se de fazer push no Git ou executar 'vercel --prod' depois!${NC}"
        fi
    fi
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                           ✅ PROCESSO CONCLUÍDO!                            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "📝 Resumo:"
    echo "   ✅ .env.local atualizado"
    echo "   ✅ Conexão local testada"
    echo "   ✅ Variáveis atualizadas no Vercel"
    echo ""
    echo "🎯 Próximos passos:"
    echo "   1. Aguarde o deploy completar (~2 min)"
    echo "   2. Acesse: https://falachefe-v4.vercel.app"
    echo "   3. Teste o login com Google e Email"
    echo ""
    
else
    echo ""
    echo -e "${RED}❌ Falha ao conectar ao banco de dados!${NC}"
    echo ""
    echo "Possíveis causas:"
    echo "  1. Senha incorreta (verifique se copiou corretamente)"
    echo "  2. String de conexão incompleta"
    echo "  3. Problema de rede/firewall"
    echo ""
    echo "Restaurando backup..."
    cp .env.local.backup .env.local
    echo -e "${YELLOW}⚠️  .env.local restaurado do backup${NC}"
    echo ""
    exit 1
fi


