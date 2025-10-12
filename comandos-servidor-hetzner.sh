#!/bin/bash

##############################################################################
# Comandos para Executar no Servidor Hetzner via SSH
# 
# Você está conectado via SSH no servidor.
# Execute estes comandos na ordem para diagnosticar e reiniciar o CrewAI.
##############################################################################

cat << 'EOF'
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║     🔧 DIAGNÓSTICO SERVIDOR HETZNER                     ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝

Execute os comandos abaixo NO SERVIDOR (você já está conectado via SSH):

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1️⃣  VERIFICAR STATUS DO DOCKER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Verificar se Docker está rodando
systemctl status docker

# Se não estiver rodando, iniciar:
systemctl start docker
systemctl enable docker

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2️⃣  VERIFICAR DIRETÓRIO DO PROJETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Ir para diretório do projeto
cd /opt/falachefe-crewai

# Verificar se existe
pwd
ls -la

# Se não existir, você precisa fazer deploy primeiro
# Veja: DEPLOY-HETZNER.md

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3️⃣  VERIFICAR CONTAINERS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Listar todos os containers
docker ps -a

# Procurar container CrewAI
docker ps -a | grep crewai

# Verificar logs do container (se existir)
docker logs falachefe-crewai-api --tail=50

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4️⃣  VERIFICAR DOCKER COMPOSE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cd /opt/falachefe-crewai

# Ver status dos serviços
docker compose ps

# Ou (se usar docker-compose antigo)
docker-compose ps

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5️⃣  REINICIAR CONTAINER (Se Parado)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cd /opt/falachefe-crewai

# Parar containers
docker compose down

# Subir novamente
docker compose up -d

# Verificar logs em tempo real
docker compose logs -f crewai-api

# Pressione Ctrl+C para sair dos logs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6️⃣  TESTAR API LOCALMENTE (No Servidor)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Health check local
curl http://localhost:8000/health

# Deve retornar:
# {"status":"healthy", "version":"1.0.0", ...}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7️⃣  VERIFICAR FIREWALL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Ver regras do firewall
ufw status

# Se porta 8000 estiver bloqueada, permitir:
ufw allow 8000/tcp comment "CrewAI API"
ufw reload

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8️⃣  REBUILD COMPLETO (Se Problemas Persistirem)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cd /opt/falachefe-crewai

# Parar e remover tudo
docker compose down -v

# Rebuild sem cache
docker compose build --no-cache

# Subir novamente
docker compose up -d

# Monitorar inicialização
docker compose logs -f crewai-api

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9️⃣  VERIFICAR RECURSOS DO SERVIDOR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Uso de disco
df -h

# Uso de memória
free -h

# Processos pesados
top -bn1 | head -20

# Docker stats
docker stats --no-stream

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔟  VERIFICAR ARQUIVO .ENV
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

cd /opt/falachefe-crewai

# Verificar se .env existe
ls -la .env

# Ver variáveis (sem expor valores)
cat .env | grep -E "^[A-Z_]+=" | sed 's/=.*/=***/'

# Deve ter:
# OPENAI_API_KEY=***
# UAZAPI_BASE_URL=***
# UAZAPI_TOKEN=***

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 CHECKLIST:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Execute na ordem e me informe os resultados:

[ ] 1. systemctl status docker
[ ] 2. cd /opt/falachefe-crewai && ls -la
[ ] 3. docker compose ps
[ ] 4. docker compose logs --tail=50 crewai-api
[ ] 5. docker compose up -d
[ ] 6. curl http://localhost:8000/health
[ ] 7. ufw status

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 DICA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Cole os comandos um por um no SSH e me envie os resultados.
Assim posso te guiar no diagnóstico!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

EOF

