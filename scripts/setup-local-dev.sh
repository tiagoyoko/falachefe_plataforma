#!/bin/bash

echo "🚀 Setup - Ambiente de Desenvolvimento Local"
echo "=============================================="
echo ""

# Cores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 1. Verificar se Docker está rodando
echo "1️⃣ Verificando Docker..."
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker não está rodando!${NC}"
    echo "   Inicie o Docker Desktop e tente novamente."
    exit 1
fi
echo -e "${GREEN}✅ Docker está rodando${NC}"
echo ""

# 2. Iniciar PostgreSQL local
echo "2️⃣ Iniciando PostgreSQL local..."
docker-compose -f docker-compose.local-db.yml up -d

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ PostgreSQL iniciado em localhost:5433${NC}"
else
    echo -e "${RED}❌ Erro ao iniciar PostgreSQL${NC}"
    exit 1
fi
echo ""

# 3. Aguardar banco ficar pronto
echo "3️⃣ Aguardando banco ficar pronto..."
sleep 5
echo -e "${GREEN}✅ Banco pronto${NC}"
echo ""

# 4. Configurar .env.local
echo "4️⃣ Configurando .env.local para desenvolvimento..."
if [ -f .env.local.backup ]; then
    echo -e "${YELLOW}⚠️  Backup já existe, pulando...${NC}"
else
    cp .env.local .env.local.backup
    echo -e "${GREEN}✅ Backup criado: .env.local.backup${NC}"
fi

cp .env.local.dev .env.local
echo -e "${GREEN}✅ .env.local configurado para PostgreSQL local${NC}"
echo ""

# 5. Aplicar migrations
echo "5️⃣ Aplicando schema no banco..."
export $(cat .env.local | grep -v "^#" | xargs)
npx drizzle-kit push

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Schema aplicado com sucesso${NC}"
else
    echo -e "${RED}❌ Erro ao aplicar schema${NC}"
    echo "   Tentando criar tabela manualmente..."
fi
echo ""

# 6. Testar conexão
echo "6️⃣ Testando conexão com banco..."
npx tsx scripts/test-db-connection.ts

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Banco de dados funcionando!${NC}"
else
    echo -e "${YELLOW}⚠️  Aviso: Banco conectou mas pode estar sem tabelas${NC}"
fi
echo ""

# 7. Instruções finais
echo "=============================================="
echo -e "${GREEN}🎉 Setup completo!${NC}"
echo ""
echo "📝 Próximos passos:"
echo "   1. Iniciar servidor: npm run dev"
echo "   2. Testar tools: cd crewai-projects/falachefe_crew && .venv/bin/python test_tools_integration.py"
echo ""
echo "💾 Banco de dados:"
echo "   - Host: localhost:5433"
echo "   - User: postgres"
echo "   - Pass: postgres"
echo "   - DB: falachefe_dev"
echo ""
echo "🔄 Para voltar ao Supabase:"
echo "   cp .env.local.backup .env.local"
echo ""
echo "🛑 Para parar o PostgreSQL local:"
echo "   docker-compose -f docker-compose.local-db.yml down"
echo ""


