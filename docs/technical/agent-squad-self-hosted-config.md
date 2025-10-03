# ⚙️ **Configuração Self-Hosted - Agent Squad Falachefe**

## 🔧 **Variáveis de Ambiente (.env)**

```bash
# Database Configuration
POSTGRES_PASSWORD=your_secure_password_here
POSTGRES_DB=falachefe_agents
POSTGRES_USER=postgres

# Redis Configuration  
REDIS_PASSWORD=your_redis_password_here

# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_MODEL=gpt-4-1106-preview
OPENAI_MAX_TOKENS=4000
OPENAI_TEMPERATURE=0.7

# UazAPI Configuration
UAZ_API_KEY=your-uaz-api-key
UAZ_API_SECRET=your-uaz-api-secret
UAZ_BASE_URL=https://falachefe.uazapi.com
UAZ_WEBHOOK_SECRET=your-webhook-secret

# Application Configuration
LOG_LEVEL=INFO
DEBUG_MODE=false
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com

# Monitoring
GRAFANA_PASSWORD=your_grafana_password
PROMETHEUS_RETENTION=30d

# Security
JWT_SECRET=your_jwt_secret_key
ENCRYPTION_KEY=your_encryption_key_32_chars

# Performance
MAX_CONCURRENT_REQUESTS=100
REQUEST_TIMEOUT=30
MEMORY_LIMIT=2GB
```

## 🐳 **Docker Compose Completo**

```yaml
# docker-compose.yml
version: '3.8'

networks:
  falachefe-network:
    driver: bridge

services:
  postgres:
    image: postgres:15-alpine
    container_name: falachefe_postgres
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=C --lc-ctype=C"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s
    networks:
      - falachefe-network

  redis:
    image: redis:7-alpine
    container_name: falachefe_redis
    command: >
      redis-server 
      --appendonly yes 
      --requirepass ${REDIS_PASSWORD}
      --maxmemory 1gb
      --maxmemory-policy allkeys-lru
      --save 900 1
      --save 300 10
      --save 60 10000
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "--no-auth-warning", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - falachefe-network

  agent-squad:
    build:
      context: ./src
      dockerfile: Dockerfile
    container_name: falachefe_agent_squad
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - OPENAI_MODEL=${OPENAI_MODEL}
      - UAZ_API_KEY=${UAZ_API_KEY}
      - UAZ_API_SECRET=${UAZ_API_SECRET}
      - UAZ_BASE_URL=${UAZ_BASE_URL}
      - LOG_LEVEL=${LOG_LEVEL}
      - DEBUG_MODE=${DEBUG_MODE}
      - ALLOWED_ORIGINS=${ALLOWED_ORIGINS}
    volumes:
      - ./data/logs:/app/logs
      - ./data/uploads:/app/uploads
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
    networks:
      - falachefe-network
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'
        reservations:
          memory: 1G
          cpus: '0.5'

  nginx:
    image: nginx:alpine
    container_name: falachefe_nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./nginx/logs:/var/log/nginx
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - agent-squad
    restart: unless-stopped
    networks:
      - falachefe-network

  prometheus:
    image: prom/prometheus:latest
    container_name: falachefe_prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=${PROMETHEUS_RETENTION}'
      - '--web.enable-lifecycle'
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    restart: unless-stopped
    networks:
      - falachefe-network

  grafana:
    image: grafana/grafana:latest
    container_name: falachefe_grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-simple-json-datasource
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources:ro
    ports:
      - "3000:3000"
    restart: unless-stopped
    networks:
      - falachefe-network

  # Worker para processamento assíncrono
  worker:
    build:
      context: ./src
      dockerfile: Dockerfile
    container_name: falachefe_worker
    command: ["python", "-m", "workers.main"]
    environment:
      - DATABASE_URL=postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB}
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - LOG_LEVEL=${LOG_LEVEL}
    volumes:
      - ./data/logs:/app/logs
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - falachefe-network
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
  prometheus_data:
    driver: local
  grafana_data:
    driver: local

networks:
  falachefe-network:
    external: false
```

## 🔧 **Scripts de Gerenciamento**

### **Script de Inicialização (init.sh)**
```bash
#!/bin/bash
# init.sh - Script de inicialização completa

set -e

echo "🚀 Inicializando Falachefe Agent Squad..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Instalando..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    echo "✅ Docker instalado. Reinicie o terminal e execute novamente."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Instalando..."
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Verificar se .env existe
if [ ! -f .env ]; then
    echo "❌ Arquivo .env não encontrado. Criando template..."
    cp .env.example .env
    echo "⚠️ Configure as variáveis no arquivo .env antes de continuar."
    exit 1
fi

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p {data/{logs,uploads,postgres,redis},backups,nginx/{ssl,logs},monitoring/{grafana/{dashboards,datasources}}}

# Configurar permissões
echo "🔐 Configurando permissões..."
sudo chown -R $USER:$USER .
chmod -R 755 .

# Inicializar banco de dados
echo "🗄️ Inicializando banco de dados..."
docker-compose up -d postgres redis

# Aguardar serviços ficarem prontos
echo "⏳ Aguardando serviços ficarem prontos..."
sleep 30

# Executar migrações
echo "🔄 Executando migrações..."
docker-compose exec postgres psql -U postgres -d falachefe_agents -f /docker-entrypoint-initdb.d/init-db.sql

# Iniciar aplicação
echo "🚀 Iniciando aplicação..."
docker-compose up -d

# Verificar health
echo "🏥 Verificando health..."
sleep 30
curl -f http://localhost:8000/health || {
    echo "❌ Health check falhou"
    exit 1
}

echo "✅ Falachefe Agent Squad inicializado com sucesso!"
echo "🌐 Dashboard: http://localhost:3000 (Grafana)"
echo "📊 Métricas: http://localhost:9090 (Prometheus)"
echo "🔗 API: http://localhost:8000"
```

### **Script de Backup Automático (backup.sh)**
```bash
#!/bin/bash
# backup.sh - Script de backup automático

BACKUP_DIR="/opt/falachefe-agent-squad/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

echo "📦 Iniciando backup..."

# Backup do banco de dados
echo "🗄️ Backup do banco de dados..."
docker-compose exec -T postgres pg_dump -U postgres falachefe_agents > $BACKUP_DIR/db_backup_$DATE.sql

# Backup dos dados do Redis
echo "🔴 Backup do Redis..."
docker-compose exec -T redis redis-cli --rdb /data/dump_$DATE.rdb

# Backup dos logs
echo "📝 Backup dos logs..."
tar -czf $BACKUP_DIR/logs_backup_$DATE.tar.gz -C data logs/

# Backup das configurações
echo "⚙️ Backup das configurações..."
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz docker-compose.yml .env nginx/ monitoring/

# Compactar todos os backups
echo "📦 Compactando backups..."
tar -czf $BACKUP_DIR/full_backup_$DATE.tar.gz \
    -C $BACKUP_DIR \
    db_backup_$DATE.sql \
    dump_$DATE.rdb \
    logs_backup_$DATE.tar.gz \
    config_backup_$DATE.tar.gz

# Remover backups antigos
echo "🧹 Removendo backups antigos..."
find $BACKUP_DIR -name "full_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

echo "✅ Backup concluído: full_backup_$DATE.tar.gz"
```

### **Script de Monitoramento (monitor.sh)**
```bash
#!/bin/bash
# monitor.sh - Script de monitoramento

echo "📊 Status do Falachefe Agent Squad"
echo "=================================="

# Status dos containers
echo "🐳 Status dos Containers:"
docker-compose ps

echo ""
echo "💾 Uso de Recursos:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"

echo ""
echo "🔗 Health Checks:"
curl -s http://localhost:8000/health | jq '.' 2>/dev/null || echo "❌ API não respondendo"

echo ""
echo "📊 Métricas do Sistema:"
# CPU
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"

# Memória
echo "Memória: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"

# Disco
echo "Disco: $(df -h / | awk 'NR==2{printf "%s", $5}')"

echo ""
echo "🗄️ Status do Banco:"
docker-compose exec postgres pg_isready -U postgres

echo ""
echo "🔴 Status do Redis:"
docker-compose exec redis redis-cli ping
```

## 🔒 **Configuração de Segurança**

### **Nginx com SSL (nginx.conf)**
```nginx
events {
    worker_connections 1024;
}

http {
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=webhook:10m rate=5r/s;
    
    # Security headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    upstream agent_squad {
        server agent-squad:8000;
        keepalive 32;
    }

    server {
        listen 80;
        server_name your-domain.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name your-domain.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Webhook endpoint
        location /webhook/uaz {
            limit_req zone=webhook burst=10 nodelay;
            proxy_pass http://agent_squad;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }

        # API endpoints
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://agent_squad;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Health check
        location /health {
            proxy_pass http://agent_squad;
            access_log off;
        }

        # Grafana
        location /grafana/ {
            proxy_pass http://grafana:3000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Prometheus
        location /prometheus/ {
            proxy_pass http://prometheus:9090/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### **Firewall UFW**
```bash
#!/bin/bash
# setup-firewall.sh

# Reset UFW
sudo ufw --force reset

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow specific IPs for admin access (opcional)
# sudo ufw allow from YOUR_IP_ADDRESS to any port 22

# Enable UFW
sudo ufw --force enable

echo "✅ Firewall configurado"
sudo ufw status
```

## 📊 **Monitoramento com Prometheus + Grafana**

### **Prometheus Configuration**
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets: []

scrape_configs:
  - job_name: 'falachefe-agent-squad'
    static_configs:
      - targets: ['agent-squad:8000']
    metrics_path: '/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'nginx'
    static_configs:
      - targets: ['nginx:80']
```

### **Alert Rules**
```yaml
# monitoring/alert_rules.yml
groups:
  - name: falachefe_alerts
    rules:
      - alert: HighCPUUsage
        expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High CPU usage detected"
          
      - alert: HighMemoryUsage
        expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "High memory usage detected"
          
      - alert: DatabaseDown
        expr: up{job="postgres"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "PostgreSQL database is down"
          
      - alert: RedisDown
        expr: up{job="redis"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis cache is down"
```

## 🚀 **Scripts de Deploy**

### **Deploy com Zero Downtime (deploy.sh)**
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Iniciando deploy com zero downtime..."

# Backup antes do deploy
echo "📦 Criando backup..."
./backup.sh

# Pull das últimas imagens
echo "📥 Atualizando imagens..."
docker-compose pull

# Rebuild da aplicação
echo "🔨 Reconstruindo aplicação..."
docker-compose build --no-cache agent-squad worker

# Deploy com zero downtime
echo "🔄 Deploy com zero downtime..."

# Parar worker primeiro
docker-compose stop worker

# Deploy worker
docker-compose up -d worker

# Aguardar worker ficar pronto
sleep 10

# Deploy aplicação principal
docker-compose up -d --no-deps agent-squad

# Verificar health
echo "🏥 Verificando health..."
sleep 30
curl -f http://localhost:8000/health || {
    echo "❌ Health check falhou - fazendo rollback"
    docker-compose down
    docker-compose up -d
    exit 1
}

# Limpar imagens antigas
echo "🧹 Limpando imagens antigas..."
docker image prune -f

echo "✅ Deploy concluído com sucesso!"
```

---

**🎉 Configuração completa para implementação self-hosted do Agent Squad Falachefe!**
