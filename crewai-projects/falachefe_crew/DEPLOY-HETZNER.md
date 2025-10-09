# 🚀 Deploy CrewAI na Hetzner com Docker Compose

## 📋 Pré-requisitos

1. **Servidor Hetzner** com:
   - Ubuntu 22.04 LTS ou superior
   - Mínimo 2GB RAM, 2 CPU cores
   - Docker e Docker Compose instalados
   - Acesso SSH configurado

2. **Domínio** (opcional):
   - `api.falachefe.app.br` apontando para o IP do servidor

---

## 🔧 1. Preparar Servidor

### 1.1 Conectar no Servidor
```bash
ssh root@SEU_IP_HETZNER
```

### 1.2 Instalar Docker (se necessário)
```bash
# Atualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt install docker-compose-plugin -y

# Verificar instalação
docker --version
docker compose version
```

### 1.3 Configurar Firewall
```bash
# Permitir portas necessárias
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw allow 8000/tcp # API (temporário para testes)
ufw enable
```

---

## 📦 2. Deploy da Aplicação

### 2.1 Criar Diretório
```bash
mkdir -p /opt/falachefe-crewai
cd /opt/falachefe-crewai
```

### 2.2 Copiar Arquivos do Projeto

**Opção A: Via Git (Recomendado)**
```bash
# Clonar repositório (se for privado, configure SSH key primeiro)
git clone https://github.com/seu-usuario/falachefe.git .
cd crewai-projects/falachefe_crew
```

**Opção B: Via SCP (do seu Mac)**
```bash
# No seu Mac, executar:
scp -r /Users/tiagoyokoyama/Falachefe/crewai-projects/falachefe_crew root@SEU_IP_HETZNER:/opt/falachefe-crewai/
```

### 2.3 Configurar Variáveis de Ambiente
```bash
cd /opt/falachefe-crewai

# Copiar exemplo
cp .env.production .env

# Editar com suas credenciais
nano .env
```

**Edite o `.env`:**
```bash
# OpenAI
OPENAI_API_KEY=sk-proj-SEU_TOKEN_REAL_AQUI

# UAZAPI
UAZAPI_BASE_URL=https://falachefe.uazapi.com
UAZAPI_TOKEN=4fbeda58-0b8a-4905-9218-8ec89967a4a4
UAZAPI_ADMIN_TOKEN=SEU_ADMIN_TOKEN_REAL_AQUI

# Database (gere senhas fortes!)
POSTGRES_PASSWORD=$(openssl rand -base64 32)
REDIS_PASSWORD=$(openssl rand -base64 32)
GRAFANA_PASSWORD=$(openssl rand -base64 32)

# Logging
LOG_LEVEL=info

# Workers
GUNICORN_WORKERS=2
GUNICORN_THREADS=4
GUNICORN_TIMEOUT=120
```

---

## 🚀 3. Iniciar Aplicação

### 3.1 Versão Mínima (Apenas API)
```bash
# Build e start
docker compose -f docker-compose.minimal.yml up -d --build

# Ver logs
docker compose -f docker-compose.minimal.yml logs -f

# Testar
curl http://localhost:8000/health
```

### 3.2 Versão Completa (Com Nginx, Redis, PostgreSQL, Monitoring)
```bash
# Criar diretórios necessários
mkdir -p logs nginx/ssl monitoring/grafana/dashboards backups

# Build e start
docker compose up -d --build

# Ver logs
docker compose logs -f crewai-api

# Verificar status
docker compose ps
```

---

## 🧪 4. Testar API

### 4.1 Health Check
```bash
curl http://localhost:8000/health
```

**Resposta esperada:**
```json
{
  "status": "healthy",
  "timestamp": "2025-01-10T...",
  "version": "1.0.0"
}
```

### 4.2 Testar Processamento
```bash
curl -X POST http://localhost:8000/process \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá, preciso de ajuda com marketing",
    "userId": "test-user-123",
    "phoneNumber": "5511999999999",
    "context": {}
  }'
```

---

## 🔐 5. Configurar SSL/HTTPS (Certbot + Let's Encrypt)

### 5.1 Instalar Certbot
```bash
apt install certbot python3-certbot-nginx -y
```

### 5.2 Obter Certificado
```bash
# Parar Nginx temporariamente
docker compose stop nginx

# Obter certificado
certbot certonly --standalone -d api.falachefe.app.br

# Copiar certificados para volume Docker
cp /etc/letsencrypt/live/api.falachefe.app.br/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/api.falachefe.app.br/privkey.pem nginx/ssl/

# Reiniciar Nginx
docker compose up -d nginx
```

### 5.3 Auto-renovação
```bash
# Adicionar cronjob
crontab -e

# Adicionar linha:
0 3 * * * certbot renew --quiet --deploy-hook "cp /etc/letsencrypt/live/api.falachefe.app.br/*.pem /opt/falachefe-crewai/nginx/ssl/ && docker compose -f /opt/falachefe-crewai/docker-compose.yml restart nginx"
```

---

## 📊 6. Monitoramento

### 6.1 Prometheus
- URL: `http://SEU_IP:9090`
- Métricas: CPU, memória, requests, latência

### 6.2 Grafana
- URL: `http://SEU_IP:3000`
- Login: `admin` / senha do `.env`
- Dashboards pré-configurados em `monitoring/grafana/dashboards/`

### 6.3 Logs
```bash
# Logs da API
docker compose logs -f crewai-api

# Logs do Nginx
tail -f logs/nginx/access.log

# Logs de todos os serviços
docker compose logs -f
```

---

## 🔄 7. Atualizar Aplicação

```bash
cd /opt/falachefe-crewai

# Pull do código atualizado (se usar Git)
git pull origin main

# Rebuild e restart
docker compose down
docker compose up -d --build

# Limpar imagens antigas
docker image prune -f
```

---

## 🛡️ 8. Backup

### 8.1 Backup do PostgreSQL (se habilitado)
```bash
# Criar backup
docker compose exec postgres pg_dump -U crewai falachefe > backups/backup-$(date +%Y%m%d-%H%M%S).sql

# Restaurar backup
docker compose exec -T postgres psql -U crewai falachefe < backups/backup-XXXXXXXX-XXXXXX.sql
```

### 8.2 Backup Automático (Cron)
```bash
# Adicionar ao crontab
0 2 * * * cd /opt/falachefe-crewai && docker compose exec postgres pg_dump -U crewai falachefe > backups/backup-$(date +\%Y\%m\%d-\%H\%M\%S).sql
```

---

## 🐛 9. Troubleshooting

### 9.1 Container não inicia
```bash
# Ver logs detalhados
docker compose logs crewai-api

# Verificar configuração
docker compose config

# Rebuild forçado
docker compose build --no-cache crewai-api
docker compose up -d crewai-api
```

### 9.2 Erro de conexão com UAZAPI
```bash
# Testar de dentro do container
docker compose exec crewai-api curl -I https://falachefe.uazapi.com

# Verificar variáveis de ambiente
docker compose exec crewai-api env | grep UAZAPI
```

### 9.3 Performance ruim
```bash
# Ver uso de recursos
docker stats

# Aumentar workers no .env
GUNICORN_WORKERS=4
GUNICORN_THREADS=8

# Restart
docker compose restart crewai-api
```

---

## 📝 10. Manutenção

### 10.1 Limpar Docker
```bash
# Remover containers parados
docker container prune -f

# Remover imagens não usadas
docker image prune -a -f

# Remover volumes não usados (CUIDADO!)
docker volume prune -f
```

### 10.2 Atualizar Docker
```bash
apt update
apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin -y
```

---

## ✅ Checklist de Deploy

- [ ] Servidor Hetzner preparado com Docker
- [ ] Firewall configurado
- [ ] Código copiado para `/opt/falachefe-crewai`
- [ ] Arquivo `.env` configurado com credenciais reais
- [ ] API iniciada com `docker compose up -d`
- [ ] Health check respondendo: `curl http://localhost:8000/health`
- [ ] SSL configurado (se usar Nginx)
- [ ] Domínio apontando para o servidor
- [ ] Monitoramento funcionando (Prometheus/Grafana)
- [ ] Backup automático configurado
- [ ] Webhook do Vercel atualizado para `https://api.falachefe.app.br/process`

---

## 🆘 Suporte

**Logs em tempo real:**
```bash
docker compose logs -f --tail=100
```

**Status dos containers:**
```bash
docker compose ps
docker stats
```

**Restart completo:**
```bash
docker compose down && docker compose up -d
```

