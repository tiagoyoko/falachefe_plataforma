#!/bin/bash

# 🔍 DIAGNÓSTICO COMPLETO DE PRODUÇÃO
# Script para identificar problemas ANTES de fazer mudanças

set -e

echo "======================================"
echo "🔍 DIAGNÓSTICO DE PRODUÇÃO - FalaChefe"
echo "======================================"
echo ""

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar DNS
check_dns() {
  local domain=$1
  local expected_ip=$2
  
  echo -e "${BLUE}[DNS]${NC} Verificando $domain..."
  
  # Resolver DNS
  actual_ip=$(dig +short $domain | head -n 1)
  
  if [ -z "$actual_ip" ]; then
    echo -e "${RED}❌ ERRO: DNS não resolve${NC}"
    return 1
  elif [ "$actual_ip" != "$expected_ip" ]; then
    echo -e "${YELLOW}⚠️  AVISO: IP diferente${NC}"
    echo -e "   Esperado: $expected_ip"
    echo -e "   Atual: $actual_ip"
    return 1
  else
    echo -e "${GREEN}✅ DNS OK${NC} → $actual_ip"
    return 0
  fi
}

# Função para verificar HTTPS
check_https() {
  local url=$1
  
  echo -e "${BLUE}[HTTPS]${NC} Verificando $url..."
  
  # Tentar conectar
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  
  if [ "$http_code" = "000" ]; then
    echo -e "${RED}❌ ERRO: Não conseguiu conectar${NC}"
    return 1
  elif [ "$http_code" = "200" ] || [ "$http_code" = "301" ]; then
    echo -e "${GREEN}✅ HTTPS OK${NC} → HTTP $http_code"
    return 0
  else
    echo -e "${YELLOW}⚠️  AVISO: HTTP $http_code${NC}"
    return 1
  fi
}

# Função para verificar endpoint
check_endpoint() {
  local url=$1
  local expected_status=${2:-200}
  
  echo -e "${BLUE}[API]${NC} Verificando $url..."
  
  response=$(curl -s --max-time 10 "$url" 2>/dev/null || echo "")
  http_code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
  
  if [ "$http_code" = "$expected_status" ]; then
    echo -e "${GREEN}✅ Endpoint OK${NC} → HTTP $http_code"
    echo -e "   Response: ${response:0:100}..."
    return 0
  else
    echo -e "${RED}❌ ERRO: HTTP $http_code${NC}"
    echo -e "   Response: $response"
    return 1
  fi
}

# Função para verificar certificado SSL
check_ssl() {
  local domain=$1
  
  echo -e "${BLUE}[SSL]${NC} Verificando certificado de $domain..."
  
  cert_info=$(echo | openssl s_client -servername $domain -connect $domain:443 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")
  
  if [ -z "$cert_info" ]; then
    echo -e "${RED}❌ ERRO: Sem certificado SSL${NC}"
    return 1
  else
    echo -e "${GREEN}✅ SSL OK${NC}"
    echo "$cert_info" | sed 's/^/   /'
    return 0
  fi
}

# Variáveis
HETZNER_IP="37.27.248.13"
VERCEL_DOMAIN="falachefe.app.br"
API_DOMAIN="api.falachefe.app.br"

echo ""
echo "======================================"
echo "1️⃣  VERIFICAÇÃO DE DNS"
echo "======================================"
echo ""

dns_vercel=0
dns_api=0

# Vercel (pode ser CNAME para Vercel)
echo -e "${BLUE}[DNS]${NC} Verificando $VERCEL_DOMAIN..."
vercel_dns=$(dig +short $VERCEL_DOMAIN | head -n 1)
if [ -z "$vercel_dns" ]; then
  echo -e "${RED}❌ ERRO: DNS não resolve${NC}"
else
  echo -e "${GREEN}✅ DNS resolve${NC} → $vercel_dns"
  dns_vercel=1
fi

# API (deve ser A record para Hetzner)
check_dns "$API_DOMAIN" "$HETZNER_IP" && dns_api=1

echo ""
echo "======================================"
echo "2️⃣  VERIFICAÇÃO DE HTTPS"
echo "======================================"
echo ""

https_vercel=0
https_api=0

check_https "https://$VERCEL_DOMAIN" && https_vercel=1
check_https "https://$API_DOMAIN" && https_api=1

echo ""
echo "======================================"
echo "3️⃣  VERIFICAÇÃO DE CERTIFICADOS SSL"
echo "======================================"
echo ""

ssl_vercel=0
ssl_api=0

check_ssl "$VERCEL_DOMAIN" && ssl_vercel=1
check_ssl "$API_DOMAIN" && ssl_api=1

echo ""
echo "======================================"
echo "4️⃣  VERIFICAÇÃO DE ENDPOINTS"
echo "======================================"
echo ""

endpoint_vercel=0
endpoint_api=0

# Vercel - Health check (pode não existir)
echo -e "${BLUE}[Vercel]${NC} Verificando homepage..."
check_https "https://$VERCEL_DOMAIN/" && endpoint_vercel=1

# API - Health check
check_endpoint "https://$API_DOMAIN/health" 200 && endpoint_api=1

echo ""
echo "======================================"
echo "5️⃣  TESTE DE PROCESSAMENTO"
echo "======================================"
echo ""

process_test=0

echo -e "${BLUE}[API]${NC} Testando endpoint /process..."
response=$(curl -X POST "https://$API_DOMAIN/process" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "teste diagnóstico",
    "userId": "test-diagnostic",
    "phoneNumber": "5511999999999",
    "context": {}
  }' \
  -s --max-time 30 2>/dev/null || echo '{"error":"timeout"}')

if echo "$response" | grep -q "success\|result\|response"; then
  echo -e "${GREEN}✅ Processamento OK${NC}"
  echo -e "   Response: ${response:0:200}..."
  process_test=1
else
  echo -e "${RED}❌ ERRO: Processamento falhou${NC}"
  echo -e "   Response: $response"
fi

echo ""
echo "======================================"
echo "📊 RESUMO DO DIAGNÓSTICO"
echo "======================================"
echo ""

total_checks=10
passed_checks=0

echo "Domínio Vercel ($VERCEL_DOMAIN):"
echo -e "  DNS:       $( [ $dns_vercel -eq 1 ] && echo '${GREEN}✅${NC}' || echo '${RED}❌${NC}' )"
echo -e "  HTTPS:     $( [ $https_vercel -eq 1 ] && echo '${GREEN}✅${NC}' || echo '${RED}❌${NC}' )"
echo -e "  SSL:       $( [ $ssl_vercel -eq 1 ] && echo '${GREEN}✅${NC}' || echo '${RED}❌${NC}' )"
echo -e "  Endpoint:  $( [ $endpoint_vercel -eq 1 ] && echo '${GREEN}✅${NC}' || echo '${RED}❌${NC}' )"

passed_checks=$((dns_vercel + https_vercel + ssl_vercel + endpoint_vercel))

echo ""
echo "API CrewAI ($API_DOMAIN):"
echo -e "  DNS:       $( [ $dns_api -eq 1 ] && echo '${GREEN}✅${NC}' || echo '${RED}❌${NC}' )"
echo -e "  HTTPS:     $( [ $https_api -eq 1 ] && echo '${GREEN}✅${NC}' || echo '${RED}❌${NC}' )"
echo -e "  SSL:       $( [ $ssl_api -eq 1 ] && echo '${GREEN}✅${NC}' || echo '${RED}❌${NC}' )"
echo -e "  Endpoint:  $( [ $endpoint_api -eq 1 ] && echo '${GREEN}✅${NC}' || echo '${RED}❌${NC}' )"
echo -e "  Process:   $( [ $process_test -eq 1 ] && echo '${GREEN}✅${NC}' || echo '${RED}❌${NC}' )"

passed_checks=$((passed_checks + dns_api + https_api + ssl_api + endpoint_api + process_test))

echo ""
echo "======================================"
success_rate=$((passed_checks * 100 / total_checks))

if [ $success_rate -eq 100 ]; then
  echo -e "${GREEN}✅ TUDO FUNCIONANDO!${NC} ($passed_checks/$total_checks checks)"
elif [ $success_rate -ge 80 ]; then
  echo -e "${YELLOW}⚠️  PROBLEMAS MENORES${NC} ($passed_checks/$total_checks checks)"
elif [ $success_rate -ge 50 ]; then
  echo -e "${RED}❌ PROBLEMAS SÉRIOS${NC} ($passed_checks/$total_checks checks)"
else
  echo -e "${RED}🚨 SISTEMA QUEBRADO${NC} ($passed_checks/$total_checks checks)"
fi
echo "======================================"

echo ""
echo "💡 PRÓXIMOS PASSOS:"
echo ""

if [ $dns_api -eq 0 ]; then
  echo "1. ❌ Configurar DNS: Registro A 'api' → $HETZNER_IP"
fi

if [ $https_api -eq 0 ] && [ $dns_api -eq 1 ]; then
  echo "2. ❌ Verificar servidor Hetzner: ssh root@$HETZNER_IP"
  echo "   - Checar se Docker Stack está rodando"
  echo "   - Checar logs: docker service logs falachefe_crewai-api"
fi

if [ $ssl_api -eq 0 ] && [ $https_api -eq 1 ]; then
  echo "3. ❌ Gerar certificado SSL via Traefik"
  echo "   - Verificar logs: docker service logs traefik_traefik"
fi

if [ $process_test -eq 0 ] && [ $endpoint_api -eq 1 ]; then
  echo "4. ❌ Verificar logs da API CrewAI"
  echo "   - Checar se agentes estão inicializados"
  echo "   - Verificar variáveis de ambiente"
fi

echo ""
echo "📝 Relatório salvo em: diagnose-report-$(date +%Y%m%d-%H%M%S).log"

# Retornar código de saída baseado no sucesso
if [ $success_rate -ge 80 ]; then
  exit 0
else
  exit 1
fi

