#!/bin/bash

set -e

echo "🚀 Deploy CrewAI usando Docker Stack no Hetzner"
echo "================================================="

# Configurações
SERVER="37.27.248.13"
USER="root"
STACK_NAME="falachefe-crewai"
REMOTE_DIR="/opt/falachefe-crewai"

# Cores
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo ""
echo -e "${BLUE}📋 Passo 1: Conectando ao servidor Hetzner${NC}"
echo "Servidor: $SERVER"
echo ""

# Verificar se servidor está acessível
if ! ping -c 1 $SERVER &> /dev/null; then
    echo -e "${RED}❌ Erro: Servidor $SERVER não está acessível${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Servidor acessível${NC}"
echo ""

echo -e "${BLUE}📋 Passo 2: Inicializando Docker Swarm (se necessário)${NC}"

ssh ${USER}@${SERVER} << 'EOF'
if ! docker info | grep -q "Swarm: active"; then
    echo "Inicializando Docker Swarm..."
    docker swarm init --advertise-addr 37.27.248.13
    echo "✅ Docker Swarm inicializado"
else
    echo "✅ Docker Swarm já está ativo"
fi
EOF

echo ""
echo -e "${BLUE}📋 Passo 3: Verificando diretório do projeto${NC}"

ssh ${USER}@${SERVER} << EOF
if [ ! -d "${REMOTE_DIR}" ]; then
    echo "⚠️  Diretório ${REMOTE_DIR} não existe"
    echo "Criando diretório..."
    mkdir -p ${REMOTE_DIR}
    cd ${REMOTE_DIR}
    
    # Clonar repositório ou criar estrutura
    echo "⚠️  ATENÇÃO: Você precisa fazer upload dos arquivos do projeto"
    echo "Execute: scp -r crewai-projects/falachefe_crew/* ${USER}@${SERVER}:${REMOTE_DIR}/"
    exit 1
else
    echo "✅ Diretório existe: ${REMOTE_DIR}"
fi

cd ${REMOTE_DIR}
ls -la
EOF

echo ""
echo -e "${BLUE}📋 Passo 4: Construindo imagem Docker${NC}"

ssh ${USER}@${SERVER} << EOF
cd ${REMOTE_DIR}

echo "🔨 Construindo imagem falachefe-crewai:latest..."
docker build -t falachefe-crewai:latest .

if [ \$? -eq 0 ]; then
    echo "✅ Imagem construída com sucesso"
else
    echo "❌ Erro ao construir imagem"
    exit 1
fi
EOF

echo ""
echo -e "${BLUE}📋 Passo 5: Parando stack anterior (se existir)${NC}"

ssh ${USER}@${SERVER} << EOF
if docker stack ls | grep -q "${STACK_NAME}"; then
    echo "🛑 Parando stack ${STACK_NAME}..."
    docker stack rm ${STACK_NAME}
    
    # Aguardar stack ser removido completamente
    echo "⏳ Aguardando remoção completa (30s)..."
    sleep 30
    
    echo "✅ Stack removido"
else
    echo "ℹ️  Stack ${STACK_NAME} não estava rodando"
fi
EOF

echo ""
echo -e "${BLUE}📋 Passo 6: Fazendo deploy do stack${NC}"

ssh ${USER}@${SERVER} << EOF
cd ${REMOTE_DIR}

echo "🚀 Fazendo deploy do stack ${STACK_NAME}..."
docker stack deploy -c docker-stack.yml ${STACK_NAME}

if [ \$? -eq 0 ]; then
    echo "✅ Stack deployed com sucesso"
else
    echo "❌ Erro ao fazer deploy do stack"
    exit 1
fi
EOF

echo ""
echo -e "${BLUE}📋 Passo 7: Verificando status do stack${NC}"

sleep 5

ssh ${USER}@${SERVER} << EOF
echo ""
echo "📊 Status do stack:"
docker stack ps ${STACK_NAME}

echo ""
echo "📋 Serviços rodando:"
docker stack services ${STACK_NAME}
EOF

echo ""
echo -e "${BLUE}📋 Passo 8: Aguardando serviço ficar saudável${NC}"

ssh ${USER}@${SERVER} << 'EOF'
echo "⏳ Aguardando health check (60s)..."
sleep 60

echo ""
echo "🔍 Testando health check..."
if curl -f http://localhost:8000/health; then
    echo ""
    echo "✅ Serviço está saudável!"
else
    echo ""
    echo "⚠️  Health check falhou. Verificando logs..."
    docker service logs ${STACK_NAME}_api --tail 50
fi
EOF

echo ""
echo -e "${GREEN}=================================================${NC}"
echo -e "${GREEN}✅ Deploy concluído!${NC}"
echo -e "${GREEN}=================================================${NC}"
echo ""
echo -e "${BLUE}📊 Comandos úteis:${NC}"
echo ""
echo "Ver logs do serviço:"
echo "  ssh ${USER}@${SERVER} 'docker service logs -f ${STACK_NAME}_api'"
echo ""
echo "Ver status do stack:"
echo "  ssh ${USER}@${SERVER} 'docker stack ps ${STACK_NAME}'"
echo ""
echo "Escalar serviço:"
echo "  ssh ${USER}@${SERVER} 'docker service scale ${STACK_NAME}_api=2'"
echo ""
echo "Remover stack:"
echo "  ssh ${USER}@${SERVER} 'docker stack rm ${STACK_NAME}'"
echo ""
echo -e "${BLUE}🌐 Testar API:${NC}"
echo "  curl http://${SERVER}:8000/health"
echo ""

