#!/bin/bash
# Script para atualizar servidor Hetzner com correção de timeout CrewAI

echo "🚀 Atualizando Servidor Hetzner - Correção CrewAI Timeout"
echo "=========================================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se está no servidor
if [ ! -d "/opt/falachefe-crewai" ]; then
    echo -e "${RED}❌ Erro: Este script deve ser executado no servidor Hetzner${NC}"
    echo ""
    echo "Execute no seu computador:"
    echo "  scp crewai-projects/falachefe_crew/update-servidor.sh root@37.27.248.13:/tmp/"
    echo "  ssh root@37.27.248.13"
    echo "  bash /tmp/update-servidor.sh"
    exit 1
fi

echo "1️⃣  Verificando configuração atual..."
cd /opt/falachefe-crewai

# Backup do .env
if [ -f .env ]; then
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
    echo -e "${GREEN}✅ Backup do .env criado${NC}"
fi

# Verificar timeout atual
CURRENT_TIMEOUT=$(grep "GUNICORN_TIMEOUT" .env | cut -d'=' -f2)
echo "Timeout atual: ${CURRENT_TIMEOUT:-120} segundos"

echo ""
echo "2️⃣  Atualizando timeout do Gunicorn..."

# Atualizar ou adicionar GUNICORN_TIMEOUT
if grep -q "GUNICORN_TIMEOUT" .env; then
    sed -i 's/GUNICORN_TIMEOUT=.*/GUNICORN_TIMEOUT=300/' .env
    echo -e "${GREEN}✅ GUNICORN_TIMEOUT atualizado para 300 segundos${NC}"
else
    echo "GUNICORN_TIMEOUT=300" >> .env
    echo -e "${GREEN}✅ GUNICORN_TIMEOUT adicionado: 300 segundos${NC}"
fi

echo ""
echo "3️⃣  Parando container atual..."
docker compose down

echo ""
echo "4️⃣  Atualizando código do GitHub..."
git fetch origin master
git reset --hard origin/master
echo -e "${GREEN}✅ Código atualizado${NC}"

echo ""
echo "5️⃣  Reconstruindo imagem Docker..."
docker compose build --no-cache crewai-api

echo ""
echo "6️⃣  Iniciando serviços..."
docker compose up -d

echo ""
echo "7️⃣  Aguardando inicialização (pode demorar 1-2 minutos)..."
sleep 10

# Mostrar logs em tempo real por 60 segundos
echo ""
echo "📋 Logs de inicialização:"
echo "========================"
timeout 60 docker compose logs -f crewai-api &
LOGS_PID=$!

# Aguardar inicialização
sleep 50
kill $LOGS_PID 2>/dev/null || true

echo ""
echo "8️⃣  Verificando status..."
echo ""

# Health check
HEALTH_STATUS=$(curl -s http://localhost:8000/health | python3 -m json.tool 2>/dev/null || echo "Erro ao verificar health")

if echo "$HEALTH_STATUS" | grep -q '"crew_initialized": true'; then
    echo -e "${GREEN}✅ CrewAI inicializado com sucesso!${NC}"
    echo ""
    echo "$HEALTH_STATUS"
else
    echo -e "${YELLOW}⚠️  CrewAI ainda não está inicializado${NC}"
    echo ""
    echo "$HEALTH_STATUS"
    echo ""
    echo "Aguarde mais alguns segundos e verifique:"
    echo "  docker compose logs -f crewai-api"
fi

echo ""
echo "=========================================================="
echo -e "${GREEN}🎉 Atualização concluída!${NC}"
echo ""
echo "Próximos passos:"
echo "  1. Verificar logs: docker compose logs -f crewai-api"
echo "  2. Testar endpoint: curl http://localhost:8000/health"
echo "  3. Testar via Vercel enviando mensagem no WhatsApp"
echo ""
echo "Para reverter (se necessário):"
echo "  cp .env.backup.YYYYMMDD_HHMMSS .env"
echo "  docker compose restart crewai-api"
echo ""

