#!/bin/bash
#
# Script de Deploy Automatizado para Hetzner
# Uso: ./scripts/deploy-hetzner.sh [SERVIDOR_IP]
#

set -e  # Exit on error

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
SERVIDOR_IP="${1:-}"
DEPLOY_DIR="/opt/falachefe-crewai"
DOCKER_COMPOSE_FILE="docker-compose.minimal.yml"

# Banner
echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════╗"
echo "║   DEPLOY FALACHEFE CREWAI - HETZNER          ║"
echo "╚═══════════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar se IP foi fornecido
if [ -z "$SERVIDOR_IP" ]; then
    echo -e "${RED}❌ Erro: IP do servidor não fornecido${NC}"
    echo "Uso: ./scripts/deploy-hetzner.sh SERVIDOR_IP"
    exit 1
fi

echo -e "${YELLOW}📡 Servidor: $SERVIDOR_IP${NC}"
echo -e "${YELLOW}📂 Diretório: $DEPLOY_DIR${NC}"
echo ""

# Confirmar
read -p "$(echo -e ${YELLOW}Continuar com deploy? [y/N]: ${NC})" -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deploy cancelado"
    exit 1
fi

# Função de log
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Criar diretório no servidor
log_info "Criando diretório no servidor..."
ssh root@$SERVIDOR_IP "mkdir -p $DEPLOY_DIR"
log_success "Diretório criado"

# 2. Copiar arquivos
log_info "Copiando arquivos para o servidor..."

# Arquivos essenciais
scp Dockerfile root@$SERVIDOR_IP:$DEPLOY_DIR/
scp $DOCKER_COMPOSE_FILE root@$SERVIDOR_IP:$DEPLOY_DIR/docker-compose.yml
scp .dockerignore root@$SERVIDOR_IP:$DEPLOY_DIR/
scp requirements-api.txt root@$SERVIDOR_IP:$DEPLOY_DIR/
scp api_server.py root@$SERVIDOR_IP:$DEPLOY_DIR/
scp webhook_processor.py root@$SERVIDOR_IP:$DEPLOY_DIR/
scp pyproject.toml root@$SERVIDOR_IP:$DEPLOY_DIR/
scp .env.production root@$SERVIDOR_IP:$DEPLOY_DIR/.env.example

# Código fonte
log_info "Copiando código fonte..."
scp -r src root@$SERVIDOR_IP:$DEPLOY_DIR/
scp -r knowledge root@$SERVIDOR_IP:$DEPLOY_DIR/ || log_warning "Pasta knowledge não encontrada"

log_success "Arquivos copiados"

# 3. Configurar .env
log_warning "Configurar .env no servidor..."
ssh root@$SERVIDOR_IP << 'EOF'
cd $DEPLOY_DIR
if [ ! -f .env ]; then
    echo "⚠️  Arquivo .env não encontrado. Copie .env.example e configure:"
    echo "   cd $DEPLOY_DIR"
    echo "   cp .env.example .env"
    echo "   nano .env"
else
    echo "✅ Arquivo .env já existe"
fi
EOF

# 4. Build e Deploy
log_info "Fazendo build da imagem Docker..."
ssh root@$SERVIDOR_IP "cd $DEPLOY_DIR && docker compose build --no-cache"
log_success "Build completo"

log_info "Parando containers antigos..."
ssh root@$SERVIDOR_IP "cd $DEPLOY_DIR && docker compose down" || true

log_info "Iniciando containers..."
ssh root@$SERVIDOR_IP "cd $DEPLOY_DIR && docker compose up -d"
log_success "Containers iniciados"

# 5. Verificar status
log_info "Verificando status dos containers..."
sleep 5
ssh root@$SERVIDOR_IP "cd $DEPLOY_DIR && docker compose ps"

# 6. Testar health check
log_info "Testando health check..."
sleep 10

if ssh root@$SERVIDOR_IP "curl -f http://localhost:8000/health > /dev/null 2>&1"; then
    log_success "API respondendo corretamente!"
else
    log_error "API não está respondendo. Verificando logs..."
    ssh root@$SERVIDOR_IP "cd $DEPLOY_DIR && docker compose logs --tail=50 crewai-api"
    exit 1
fi

# 7. Mostrar logs
log_info "Últimas linhas do log:"
ssh root@$SERVIDOR_IP "cd $DEPLOY_DIR && docker compose logs --tail=20 crewai-api"

# 8. Sumário
echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   DEPLOY CONCLUÍDO COM SUCESSO!              ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📡 API URL:${NC} http://$SERVIDOR_IP:8000"
echo -e "${BLUE}🏥 Health:${NC} http://$SERVIDOR_IP:8000/health"
echo -e "${BLUE}📊 Metrics:${NC} http://$SERVIDOR_IP:8000/metrics"
echo ""
echo -e "${YELLOW}📝 Próximos passos:${NC}"
echo "  1. Configurar SSL/HTTPS com Certbot"
echo "  2. Configurar Nginx como reverse proxy"
echo "  3. Atualizar webhook do Vercel para apontar para esta API"
echo "  4. Configurar monitoramento (Prometheus/Grafana)"
echo ""
echo -e "${BLUE}🔧 Comandos úteis:${NC}"
echo "  Ver logs:     ssh root@$SERVIDOR_IP 'cd $DEPLOY_DIR && docker compose logs -f'"
echo "  Restart:      ssh root@$SERVIDOR_IP 'cd $DEPLOY_DIR && docker compose restart'"
echo "  Status:       ssh root@$SERVIDOR_IP 'cd $DEPLOY_DIR && docker compose ps'"
echo ""

