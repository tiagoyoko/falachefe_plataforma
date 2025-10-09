# 🐳 Docker Setup - Falachefe CrewAI

## 📦 Arquivos Docker

- **`Dockerfile`** - Imagem otimizada para produção (Python 3.12, multi-stage)
- **`docker-compose.yml`** - Stack completa com Nginx, Redis, PostgreSQL, Prometheus, Grafana
- **`docker-compose.minimal.yml`** - Apenas API CrewAI (recomendado para começar)
- **`.dockerignore`** - Otimiza build excluindo arquivos desnecessários
- **`.env.production`** - Template de variáveis de ambiente

---

## 🚀 Quick Start (Local)

### 1. Configurar Ambiente
```bash
# Copiar template
cp .env.production .env

# Editar com suas credenciais
nano .env
```

### 2. Rodar Versão Mínima (Apenas API)
```bash
# Build
docker compose -f docker-compose.minimal.yml build

# Start
docker compose -f docker-compose.minimal.yml up -d

# Logs
docker compose -f docker-compose.minimal.yml logs -f

# Testar
curl http://localhost:8000/health
```

### 3. Rodar Versão Completa
```bash
# Criar diretórios
mkdir -p logs nginx/ssl monitoring/grafana/dashboards backups

# Build e start
docker compose up -d --build

# Ver todos os containers
docker compose ps
```

---

## 🌐 Acessar Serviços

| Serviço | URL Local | Porta |
|---------|-----------|-------|
| **API CrewAI** | http://localhost:8000 | 8000 |
| **Nginx** | http://localhost | 80/443 |
| **Redis** | redis://localhost:6379 | 6379 |
| **PostgreSQL** | postgresql://localhost:5432 | 5432 |
| **Prometheus** | http://localhost:9090 | 9090 |
| **Grafana** | http://localhost:3000 | 3000 |

---

## 🧪 Testar API

### Health Check
```bash
curl http://localhost:8000/health
```

**Resposta:**
```json
{
  "status": "healthy",
  "service": "falachefe-crewai-api",
  "version": "1.0.0",
  "timestamp": "2025-01-10T...",
  "uptime_seconds": 123,
  "crew_initialized": true,
  "uazapi_configured": true,
  "qstash_configured": false,
  "system": {
    "cpu_percent": 12.5,
    "memory_percent": 45.2,
    "disk_percent": 32.1
  }
}
```

### Processar Mensagem
```bash
curl -X POST http://localhost:8000/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Preciso de ajuda com marketing digital",
    "userId": "user-123",
    "phoneNumber": "5511999999999",
    "context": {
      "conversationId": "conv-456",
      "userName": "João Silva"
    }
  }'
```

### Métricas (Prometheus)
```bash
curl http://localhost:8000/metrics
```

---

## 🔧 Comandos Úteis

### Gerenciar Containers
```bash
# Ver logs
docker compose logs -f crewai-api

# Restart
docker compose restart crewai-api

# Stop
docker compose stop

# Start
docker compose start

# Rebuild
docker compose up -d --build

# Remover tudo
docker compose down -v
```

### Debug
```bash
# Entrar no container
docker compose exec crewai-api /bin/sh

# Ver variáveis de ambiente
docker compose exec crewai-api env

# Testar de dentro do container
docker compose exec crewai-api curl localhost:8000/health
```

### Monitorar Recursos
```bash
# Ver uso de CPU/RAM
docker stats

# Ver logs em tempo real
docker compose logs -f --tail=100
```

---

## 📊 Estrutura de Volumes

```
/opt/falachefe-crewai/
├── logs/              # Logs da aplicação
│   ├── nginx/         # Logs do Nginx
│   └── app.log
├── nginx/
│   ├── nginx.conf     # Configuração Nginx
│   └── ssl/           # Certificados SSL
├── monitoring/
│   ├── prometheus.yml
│   └── grafana/
│       └── dashboards/
├── backups/           # Backups do PostgreSQL
└── knowledge/         # Base de conhecimento (read-only)
```

---

## 🔐 Segurança

### Variáveis Sensíveis
**NUNCA** commitar o arquivo `.env` com credenciais reais!

```bash
# Gerar senhas fortes
openssl rand -base64 32

# Permissões do .env
chmod 600 .env
```

### Firewall
```bash
# Permitir apenas portas necessárias
ufw allow 80/tcp
ufw allow 443/tcp
ufw deny 8000/tcp  # API apenas via Nginx
```

### SSL/TLS
```bash
# Gerar certificado auto-assinado (desenvolvimento)
openssl req -x509 -nodes -days 365 \
  -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem

# Produção: usar Certbot (Let's Encrypt)
certbot certonly --standalone -d api.falachefe.app.br
```

---

## 🚀 Deploy em Produção (Hetzner)

### Opção 1: Script Automatizado
```bash
# Do seu Mac
./scripts/deploy-hetzner.sh SEU_IP_HETZNER
```

### Opção 2: Manual
Veja instruções completas em **`DEPLOY-HETZNER.md`**

---

## 📈 Monitoramento

### Prometheus
1. Acesse http://localhost:9090
2. Query: `falachefe_uptime_seconds`
3. Ver gráficos de CPU, memória, etc.

### Grafana
1. Acesse http://localhost:3000
2. Login: `admin` / senha do `.env`
3. Adicionar datasource: Prometheus (http://prometheus:9090)
4. Importar dashboards prontos

### Logs Centralizados
```bash
# Todos os logs
docker compose logs -f

# Apenas API
docker compose logs -f crewai-api

# Apenas erros
docker compose logs crewai-api | grep ERROR
```

---

## 🐛 Troubleshooting

### Container não inicia
```bash
# Ver logs detalhados
docker compose logs crewai-api

# Verificar configuração
docker compose config

# Rebuild sem cache
docker compose build --no-cache
```

### Erro "no space left on device"
```bash
# Limpar imagens antigas
docker system prune -af

# Limpar volumes
docker volume prune -f
```

### API não responde
```bash
# Verificar health
curl -I http://localhost:8000/health

# Ver logs
docker compose logs --tail=100 crewai-api

# Restart
docker compose restart crewai-api
```

### Performance ruim
```bash
# Aumentar workers no .env
GUNICORN_WORKERS=4
GUNICORN_THREADS=8

# Aumentar recursos no docker-compose.yml
resources:
  limits:
    cpus: '4.0'
    memory: 4G
```

---

## 📚 Referências

- **Docker Compose**: https://docs.docker.com/compose/
- **Gunicorn**: https://docs.gunicorn.org/
- **Nginx**: https://nginx.org/en/docs/
- **Prometheus**: https://prometheus.io/docs/
- **Grafana**: https://grafana.com/docs/

---

## ✅ Checklist de Produção

- [ ] `.env` configurado com credenciais reais
- [ ] Senhas fortes geradas (PostgreSQL, Redis, Grafana)
- [ ] SSL/TLS configurado
- [ ] Firewall configurado
- [ ] Backup automático configurado
- [ ] Monitoramento ativo (Prometheus/Grafana)
- [ ] Logs sendo persistidos
- [ ] Health checks respondendo
- [ ] Testes de carga realizados
- [ ] Documentação atualizada

---

## 🆘 Suporte

**Logs em tempo real:**
```bash
docker compose logs -f --tail=100
```

**Restart completo:**
```bash
docker compose down && docker compose up -d
```

**Reset total (CUIDADO - perde dados!):**
```bash
docker compose down -v
docker system prune -af
docker compose up -d --build
```

