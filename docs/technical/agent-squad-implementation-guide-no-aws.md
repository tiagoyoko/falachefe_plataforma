# 🚀 **Guia de Implementação Agent Squad - Sem AWS (Self-Hosted)**

## 📋 **Índice**
1. [Visão Geral](#visão-geral)
2. [Arquitetura do Sistema](#arquitetura-do-sistema)
3. [Stack Tecnológica](#stack-tecnológica)
4. [Infraestrutura Self-Hosted](#infraestrutura-self-hosted)
5. [Implementação Passo a Passo](#implementação-passo-a-passo)
6. [Deploy e Produção](#deploy-e-produção)
7. [Monitoramento](#monitoramento)

---

## 🎯 **Visão Geral**

### **Objetivo**
Implementar um sistema de agentes de IA especializados para o projeto Falachefe, utilizando o framework Agent Squad em infraestrutura self-hosted, com orquestração inteligente de múltiplos agentes especializados.

### **Equipe de Agentes Proposta**
- **🤖 Orquestrador Principal**: Coordena e roteia conversas
- **💰 Agente Financeiro**: Gestão financeira e análise de custos
- **📊 Agente Fluxo de Caixa**: Monitoramento de receitas e despesas
- **📈 Agente Marketing e Vendas**: Estratégias de marketing e conversão
- **👥 Agente RH**: Recursos humanos e gestão de pessoas

---

## 🏗️ **Arquitetura do Sistema**

### **Diagrama de Arquitetura Self-Hosted**
```
┌─────────────────────────────────────────────────────────────┐
│                FALACHEFE AGENT SQUAD (Self-Hosted)         │
├─────────────────────────────────────────────────────────────┤
│  WhatsApp User  →  UazAPI  →  Webhook  →  Nginx Reverse Proxy │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              FASTAPI APPLICATION                       │ │
│  │  • Webhook Handler                                     │ │
│  │  • Agent Orchestrator                                  │ │
│  │  • Memory Management                                   │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────┐ │
│  │   AGENTE    │ │   AGENTE    │ │   AGENTE    │ │ AGENTE  │ │
│  │ FINANCEIRO  │ │ FLUXO CAIXA │ │MARKETING/   │ │   RH    │ │
│  │             │ │             │ │   VENDAS    │ │         │ │
│  └─────────────┘ └─────────────┘ └─────────────┘ └─────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              STORAGE LAYER                              │ │
│  │  • PostgreSQL (Conversations, Users, Context)          │ │
│  │  • Redis (Session Cache, Queue)                        │ │
│  │  • File System (Logs, Temp Files)                      │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ **Stack Tecnológica**

### **Backend**
- **Framework**: Agent Squad (Python)
- **API Framework**: FastAPI
- **LLM**: OpenAI GPT-5-mini
- **Banco de Dados**: PostgreSQL
- **Cache/Queue**: Redis
- **Web Server**: Nginx (Reverse Proxy)

### **Frontend** (Dashboard)
- **Framework**: Next.js (existente)
- **UI Components**: Shadcn/ui
- **Styling**: Tailwind CSS

### **Integração**
- **WhatsApp**: UazAPI
- **Deploy**: Docker + Docker Compose
- **Monitoramento**: Prometheus + Grafana
- **Logs**: Structured Logging

### **Infraestrutura**
- **Servidor**: VPS/Cloud Provider (DigitalOcean, Linode, etc.)
- **OS**: Ubuntu 22.04 LTS
- **Containerização**: Docker + Docker Compose
- **SSL**: Let's Encrypt (Certbot)

---

## 🏠 **Infraestrutura Self-Hosted**

### **Requisitos Mínimos do Servidor**
```
CPU: 4 cores
RAM: 8GB (16GB recomendado)
Storage: 100GB SSD
Network: 1Gbps
OS: Ubuntu 22.04 LTS
```

### **Requisitos Recomendados**
```
CPU: 8 cores
RAM: 16GB
Storage: 200GB SSD
Network: 1Gbps
OS: Ubuntu 22.04 LTS
```

### **Estrutura de Deploy**
```
/opt/falachefe-agent-squad/
├── docker-compose.yml
├── .env
├── nginx/
│   ├── nginx.conf
│   └── ssl/
├── data/
│   ├── postgres/
│   ├── redis/
│   └── logs/
└── backups/
```

---

## 🛠️ **Implementação Passo a Passo**

### **Fase 1: Setup do Servidor**

#### **Passo 1.1: Preparar Servidor**
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
sudo apt install -y curl wget git htop vim

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot para SSL
sudo apt install -y certbot python3-certbot-nginx
```

#### **Passo 1.2: Configurar Firewall**
```bash
# Configurar UFW
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw --force enable
```

### **Fase 2: Aplicação Agent Squad**

#### **Passo 2.1: Estrutura do Projeto**
```bash
# Criar diretório do projeto
sudo mkdir -p /opt/falachefe-agent-squad
cd /opt/falachefe-agent-squad

# Criar estrutura de diretórios
mkdir -p {nginx,data/{postgres,redis,logs},backups,src}
```

#### **Passo 2.2: Docker Compose**
```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: falachefe_postgres
    environment:
      POSTGRES_DB: falachefe_agents
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: falachefe_redis
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - ./data/redis:/data
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  agent-squad:
    build:
      context: ./src
      dockerfile: Dockerfile
    container_name: falachefe_agent_squad
    environment:
      - DATABASE_URL=postgresql://postgres:${POSTGRES_PASSWORD}@postgres:5432/falachefe_agents
      - REDIS_URL=redis://:${REDIS_PASSWORD}@redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - UAZ_API_KEY=${UAZ_API_KEY}
      - UAZ_API_SECRET=${UAZ_API_SECRET}
      - UAZ_BASE_URL=${UAZ_BASE_URL}
      - LOG_LEVEL=${LOG_LEVEL:-INFO}
    volumes:
      - ./data/logs:/app/logs
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

  nginx:
    image: nginx:alpine
    container_name: falachefe_nginx
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - agent-squad
    restart: unless-stopped

  prometheus:
    image: prom/prometheus:latest
    container_name: falachefe_prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    container_name: falachefe_grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana_data:/var/lib/grafana
    ports:
      - "3000:3000"
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

#### **Passo 2.3: Dockerfile da Aplicação**
```dockerfile
# src/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código
COPY . .

# Criar usuário não-root
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser

# Expor porta
EXPOSE 8000

# Comando de inicialização
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### **Fase 3: Configuração Nginx**

#### **Passo 3.1: Configuração Nginx**
```nginx
# nginx/nginx.conf
events {
    worker_connections 1024;
}

http {
    upstream agent_squad {
        server agent-squad:8000;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=webhook:10m rate=5r/s;

    server {
        listen 80;
        server_name your-domain.com;
        
        # Redirect HTTP to HTTPS
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

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Webhook endpoint (rate limited)
        location /webhook/uaz {
            limit_req zone=webhook burst=10 nodelay;
            proxy_pass http://agent_squad;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # API endpoints (rate limited)
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

        # Dashboard (Next.js)
        location / {
            proxy_pass http://your-nextjs-app:3000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### **Fase 4: Aplicação Agent Squad**

#### **Passo 4.1: Estrutura da Aplicação**
```python
# src/main.py
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
import uvicorn
import os
from contextlib import asynccontextmanager

from agents.orchestrator import FalachefeOrchestrator
from integrations.webhook_handler import WebhookHandler
from monitoring.metrics import setup_metrics
from utils.logger import setup_logging
from utils.config import get_config

# Configuração global
config = get_config()
orchestrator = None
webhook_handler = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação"""
    global orchestrator, webhook_handler
    
    # Setup logging
    setup_logging(config)
    
    # Setup metrics
    setup_metrics()
    
    # Inicializar orquestrador
    orchestrator = FalachefeOrchestrator(config)
    webhook_handler = WebhookHandler(config, orchestrator)
    
    yield
    
    # Cleanup
    if orchestrator:
        await orchestrator.cleanup()

# Criar aplicação FastAPI
app = FastAPI(
    title="Falachefe Agent Squad",
    description="Sistema de agentes de IA especializados",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware de segurança
app.add_middleware(
    TrustedHostMiddleware, 
    allowed_hosts=["your-domain.com", "*.your-domain.com"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.post("/webhook/uaz")
async def webhook_endpoint(request: Request):
    """Endpoint para webhooks do UazAPI"""
    try:
        payload = await request.json()
        result = await webhook_handler.process_webhook(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/metrics")
async def get_metrics():
    """Endpoint de métricas para Prometheus"""
    # Retornar métricas do Prometheus
    pass

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=config.DEBUG_MODE,
        log_level=config.LOG_LEVEL.lower()
    )
```

#### **Passo 4.2: Orquestrador Simplificado**
```python
# src/agents/orchestrator.py
from typing import Dict, List
import asyncio
from datetime import datetime

from .financial_agent import FinancialAgent
from .cashflow_agent import CashFlowAgent
from .marketing_sales_agent import MarketingSalesAgent
from .hr_agent import HRAgent
from ..memory.shared_memory import SharedMemory
from ..integrations.database_client import DatabaseClient

class FalachefeOrchestrator:
    def __init__(self, config: dict):
        self.config = config
        self.db_client = DatabaseClient(config)
        self.shared_memory = SharedMemory(self.db_client)
        
        # Inicializar agentes
        self.agents = {
            "financial": FinancialAgent(config),
            "cashflow": CashFlowAgent(config),
            "marketing_sales": MarketingSalesAgent(config),
            "hr": HRAgent(config)
        }
        
        # Mapeamento de intenções para agentes
        self.intent_mapping = {
            "financial_analysis": "financial",
            "budget_planning": "financial",
            "cost_optimization": "financial",
            "cashflow_monitoring": "cashflow",
            "revenue_projection": "cashflow",
            "marketing_strategy": "marketing_sales",
            "campaign_management": "marketing_sales",
            "lead_qualification": "marketing_sales",
            "sales_funnel": "marketing_sales",
            "hr_recruitment": "hr",
            "performance_management": "hr",
            "policy_consultation": "hr"
        }
    
    async def process_message(self, message: str, context: Dict) -> Dict:
        """Processa mensagem e roteia para agente apropriado"""
        
        # Classificar intenção (simplificado)
        intent = await self._classify_intent(message)
        
        # Rotear para agente
        agent_name = self.intent_mapping.get(intent, "financial")  # Default
        agent = self.agents[agent_name]
        
        # Processar com contexto
        response = await agent.process(message, context)
        
        # Atualizar contexto compartilhado
        await self.shared_memory.update_conversation_context(
            context.get("conversation_id"),
            {
                "last_agent": agent_name,
                "last_intent": intent,
                "last_response": response
            },
            agent_name
        )
        
        return {
            "response": response,
            "agent": agent_name,
            "intent": intent,
            "confidence": 0.85  # Simplificado
        }
    
    async def _classify_intent(self, message: str) -> str:
        """Classifica intenção da mensagem (versão simplificada)"""
        
        message_lower = message.lower()
        
        # Palavras-chave para cada domínio
        financial_keywords = ["orçamento", "custo", "roi", "financeiro", "investimento"]
        cashflow_keywords = ["fluxo", "caixa", "receita", "despesa", "pagamento"]
        marketing_keywords = ["marketing", "campanha", "vendas", "lead", "conversão"]
        hr_keywords = ["rh", "recrutamento", "contratação", "funcionário", "colaborador"]
        
        if any(keyword in message_lower for keyword in financial_keywords):
            return "financial_analysis"
        elif any(keyword in message_lower for keyword in cashflow_keywords):
            return "cashflow_monitoring"
        elif any(keyword in message_lower for keyword in marketing_keywords):
            return "marketing_strategy"
        elif any(keyword in message_lower for keyword in hr_keywords):
            return "hr_recruitment"
        else:
            return "financial_analysis"  # Default
    
    async def cleanup(self):
        """Limpeza de recursos"""
        if self.db_client:
            await self.db_client.close()
```

---

## 🚀 **Deploy e Produção**

### **Script de Deploy**
```bash
#!/bin/bash
# deploy.sh

set -e

echo "🚀 Deploying Falachefe Agent Squad..."

# 1. Backup do banco de dados
echo "📦 Criando backup..."
docker-compose exec postgres pg_dump -U postgres falachefe_agents > backups/backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Pull das últimas imagens
echo "📥 Atualizando imagens..."
docker-compose pull

# 3. Rebuild da aplicação
echo "🔨 Reconstruindo aplicação..."
docker-compose build --no-cache agent-squad

# 4. Deploy com zero downtime
echo "🔄 Deploy com zero downtime..."
docker-compose up -d --no-deps agent-squad

# 5. Verificar health
echo "🏥 Verificando health..."
sleep 30
curl -f http://localhost:8000/health || {
    echo "❌ Health check falhou"
    exit 1
}

# 6. Limpar imagens antigas
echo "🧹 Limpando imagens antigas..."
docker image prune -f

echo "✅ Deploy concluído com sucesso!"
```

### **Script de Backup**
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/opt/falachefe-agent-squad/backups"
DATE=$(date +%Y%m%d_%H%M%S)

# Backup do banco de dados
docker-compose exec -T postgres pg_dump -U postgres falachefe_agents > $BACKUP_DIR/db_backup_$DATE.sql

# Backup dos dados do Redis
docker-compose exec -T redis redis-cli --rdb /data/dump_$DATE.rdb

# Compactar backups
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz -C $BACKUP_DIR db_backup_$DATE.sql

# Remover backups antigos (manter últimos 7 dias)
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "✅ Backup concluído: backup_$DATE.tar.gz"
```

---

## 📊 **Monitoramento**

### **Prometheus Configuration**
```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'falachefe-agent-squad'
    static_configs:
      - targets: ['agent-squad:8000']
    metrics_path: '/api/metrics'
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
```

### **Grafana Dashboard**
- **CPU Usage**: Uso de CPU por container
- **Memory Usage**: Uso de memória
- **Database Connections**: Conexões PostgreSQL
- **Redis Operations**: Operações Redis
- **API Response Time**: Tempo de resposta da API
- **Error Rate**: Taxa de erros
- **Agent Performance**: Performance por agente

---

## 💰 **Análise de Custos**

### **Infraestrutura Self-Hosted**
| Componente | Custo Mensal | Descrição |
|------------|--------------|-----------|
| **VPS/Cloud Server** | R$ 200-400 | 8GB RAM, 4 CPU cores |
| **Domínio + SSL** | R$ 50/ano | Let's Encrypt gratuito |
| **Backup Storage** | R$ 30 | Armazenamento de backups |
| **OpenAI API** | R$ 1.500 | Uso estimado |
| **Manutenção** | R$ 500 | Tempo de DevOps |
| **Total Mensal** | **R$ 2.230** | Sem custos de licença |

### **Comparação AWS vs Self-Hosted**
| Aspecto | AWS | Self-Hosted |
|---------|-----|-------------|
| **Custo Mensal** | R$ 3.500 | R$ 2.230 |
| **Controle** | Limitado | Total |
| **Escalabilidade** | Automática | Manual |
| **Manutenção** | Gerenciada | Manual |
| **Flexibilidade** | Limitada | Total |

---

## 🔒 **Segurança**

### **Medidas de Segurança**
- **SSL/TLS**: Let's Encrypt com renovação automática
- **Firewall**: UFW configurado
- **Rate Limiting**: Nginx + Redis
- **Backup Automático**: Scripts diários
- **Monitoramento**: Prometheus + Grafana
- **Logs**: Structured logging com rotação

### **Certificado SSL**
```bash
# Obter certificado SSL
sudo certbot --nginx -d your-domain.com

# Renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 📋 **Checklist de Implementação**

### **✅ Preparação**
- [ ] Servidor VPS configurado
- [ ] Domínio configurado
- [ ] DNS apontando para servidor
- [ ] Docker e Docker Compose instalados

### **✅ Aplicação**
- [ ] Código Agent Squad implementado
- [ ] Docker Compose configurado
- [ ] Nginx configurado
- [ ] SSL configurado

### **✅ Monitoramento**
- [ ] Prometheus configurado
- [ ] Grafana configurado
- [ ] Dashboards criados
- [ ] Alertas configurados

### **✅ Backup**
- [ ] Scripts de backup criados
- [ ] Cron jobs configurados
- [ ] Teste de restauração realizado

### **✅ Produção**
- [ ] Deploy realizado
- [ ] Health checks passando
- [ ] Monitoramento ativo
- [ ] Documentação atualizada

---

**🎉 Agora você tem uma implementação completa do Agent Squad sem dependências AWS, totalmente self-hosted e mais econômica!**
