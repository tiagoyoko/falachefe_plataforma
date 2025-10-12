#!/bin/bash

# Script de deploy no servidor Hetzner
# Atualiza o código CrewAI e reinicia o container Docker

echo "=" 
echo "🚀 Deploy CrewAI - Servidor Hetzner"
echo "="

# Conectar via SSH e executar comandos
ssh -t root@37.27.248.13 << 'EOF'
  cd /opt/falachefe-crewai
  
  echo "📥 Baixando últimas mudanças do GitHub..."
  git pull origin master
  
  echo "🔄 Reiniciando container Docker..."
  docker compose restart
  
  echo "⏳ Aguardando 10 segundos..."
  sleep 10
  
  echo "🔍 Verificando status..."
  docker compose ps
  
  echo ""
  echo "✅ Deploy concluído!"
  echo "📊 Verificar logs: docker compose logs -f"
  echo "🌐 Testar: curl http://localhost:8000/health"
EOF

echo ""
echo "✅ Script finalizado!"

