#!/bin/bash

##############################################################################
# Script para Iniciar Chat Web + CrewAI via Docker
#
# Este script automatiza o processo de:
# 1. Subir stack Docker (CrewAI API + Redis + Postgres + Nginx)
# 2. Configurar Next.js
# 3. Verificar health checks
# 4. Iniciar servidor de desenvolvimento
#
# Uso:
#   ./scripts/start-chat-web-docker.sh
##############################################################################

set -e  # Parar em erros

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_header() {
    echo ""
    echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
    echo ""
}

# Diretórios
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CREWAI_DIR="$PROJECT_ROOT/crewai-projects/falachefe_crew"

log_header "Iniciando Chat Web + CrewAI via Docker"

# Verificar pré-requisitos
log_info "Verificando pré-requisitos..."

if ! command -v docker &> /dev/null; then
    log_error "Docker não encontrado! Instale: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose não encontrado! Instale: https://docs.docker.com/compose/install/"
    exit 1
fi

if ! command -v node &> /dev/null; then
    log_error "Node.js não encontrado! Instale: https://nodejs.org/"
    exit 1
fi

log_success "Pré-requisitos OK"

# Verificar se arquivo .env existe no CrewAI
log_info "Verificando configuração CrewAI..."

if [ ! -f "$CREWAI_DIR/.env" ]; then
    log_warning "Arquivo .env não encontrado em $CREWAI_DIR"
    log_info "Criando arquivo .env de exemplo..."
    
    cat > "$CREWAI_DIR/.env" << 'EOF'
# OpenAI
OPENAI_API_KEY=sk-proj-your-key-here

# UAZAPI
UAZAPI_BASE_URL=https://falachefe.uazapi.com
UAZAPI_TOKEN=your-token-here
UAZAPI_ADMIN_TOKEN=your-admin-token-here

# Database
POSTGRES_DB=falachefe
POSTGRES_USER=crewai
POSTGRES_PASSWORD=change-me-in-production

# Redis
REDIS_PASSWORD=change-me-in-production

# Logging
LOG_LEVEL=info

# Workers
GUNICORN_WORKERS=2
GUNICORN_THREADS=4
GUNICORN_TIMEOUT=120

# Grafana
GRAFANA_PASSWORD=admin
EOF
    
    log_warning "⚠️  ATENÇÃO: Edite $CREWAI_DIR/.env com suas credenciais!"
    log_info "Pressione ENTER para continuar após editar ou Ctrl+C para cancelar..."
    read
fi

# Subir stack Docker
log_header "Iniciando Stack Docker"

cd "$CREWAI_DIR"

log_info "Parando containers antigos..."
docker-compose down 2>/dev/null || true

log_info "Iniciando containers..."
docker-compose up -d --build

# Aguardar containers ficarem prontos
log_info "Aguardando containers ficarem prontos..."
sleep 5

# Verificar status
log_info "Verificando status dos containers..."
docker-compose ps

# Health checks
log_header "Verificando Health Checks"

# Verificar CrewAI API
log_info "Testando CrewAI API (porta 8000)..."
RETRIES=0
MAX_RETRIES=30

while [ $RETRIES -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8000/health > /dev/null 2>&1; then
        log_success "CrewAI API está respondendo!"
        break
    fi
    
    RETRIES=$((RETRIES+1))
    echo -n "."
    sleep 2
    
    if [ $RETRIES -eq $MAX_RETRIES ]; then
        log_error "CrewAI API não respondeu após 60s"
        log_info "Verificando logs:"
        docker-compose logs --tail=50 crewai-api
        exit 1
    fi
done

# Verificar Redis
log_info "Testando Redis (porta 6379)..."
if docker exec falachefe-redis redis-cli ping > /dev/null 2>&1; then
    log_success "Redis está respondendo!"
else
    log_warning "Redis não respondeu (pode ser normal se usa password)"
fi

# Verificar Postgres
log_info "Testando Postgres (porta 5432)..."
if docker exec falachefe-postgres pg_isready -U crewai > /dev/null 2>&1; then
    log_success "Postgres está respondendo!"
else
    log_warning "Postgres não respondeu"
fi

# Configurar Next.js
log_header "Configurando Next.js"

cd "$PROJECT_ROOT"

# Adicionar ou atualizar CREWAI_API_URL no .env.local
if [ -f ".env.local" ]; then
    if grep -q "CREWAI_API_URL" .env.local; then
        log_info "CREWAI_API_URL já configurado em .env.local"
    else
        echo "" >> .env.local
        echo "# CrewAI Docker API" >> .env.local
        echo "CREWAI_API_URL=http://localhost:8000/process" >> .env.local
        log_success "CREWAI_API_URL adicionado ao .env.local"
    fi
else
    echo "CREWAI_API_URL=http://localhost:8000/process" > .env.local
    log_success "Arquivo .env.local criado com CREWAI_API_URL"
fi

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
    log_info "Instalando dependências do Next.js..."
    npm install
    log_success "Dependências instaladas"
fi

# Teste final
log_header "Teste de Integração"

log_info "Testando endpoint /health da API..."
HEALTH_RESPONSE=$(curl -s http://localhost:8000/health)
echo "$HEALTH_RESPONSE" | jq '.' 2>/dev/null || echo "$HEALTH_RESPONSE"

# Resumo
log_header "Resumo"

log_success "Stack Docker iniciado com sucesso!"
echo ""
echo "📊 Serviços Disponíveis:"
echo ""
echo "  🤖 CrewAI API:     http://localhost:8000"
echo "  🌐 Nginx Proxy:    http://localhost:80"
echo "  🔴 Redis:          localhost:6379"
echo "  🐘 PostgreSQL:     localhost:5432"
echo "  📈 Prometheus:     http://localhost:9090"
echo "  📊 Grafana:        http://localhost:3001"
echo ""
echo "🚀 Próximo Passo:"
echo ""
echo "  1. Inicie o Next.js:"
echo "     cd $PROJECT_ROOT"
echo "     npm run dev"
echo ""
echo "  2. Acesse o chat:"
echo "     http://localhost:3000/chat"
echo ""
echo "  3. Logs em tempo real:"
echo "     docker-compose -f $CREWAI_DIR/docker-compose.yml logs -f"
echo ""

# Perguntar se quer iniciar Next.js
log_info "Deseja iniciar o servidor Next.js agora? (y/n)"
read -r START_NEXTJS

if [ "$START_NEXTJS" = "y" ] || [ "$START_NEXTJS" = "Y" ]; then
    log_info "Iniciando Next.js..."
    cd "$PROJECT_ROOT"
    npm run dev
else
    log_info "Para iniciar o Next.js manualmente:"
    echo "  cd $PROJECT_ROOT"
    echo "  npm run dev"
fi

exit 0

