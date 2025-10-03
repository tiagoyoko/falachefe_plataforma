# ⚙️ **Configurações e Scripts Práticos - Agent Squad**

## 🔧 **Configurações de Ambiente**

### **Variáveis de Ambiente (.env)**
```bash
# OpenAI Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_ORG_ID=org-your-org-id-here
OPENAI_MODEL=gpt-4-1106-preview

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_ACCOUNT_ID=123456789012

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/falachefe_agents
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=falachefe_agents
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your-password

# Redis Configuration
REDIS_URL=redis://localhost:6379
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# UazAPI Configuration
UAZ_API_KEY=your-uaz-api-key
UAZ_API_SECRET=your-uaz-api-secret
UAZ_BASE_URL=https://falachefe.uazapi.com
UAZ_WEBHOOK_SECRET=your-webhook-secret

# Agent Squad Configuration
AGENT_SQUAD_VERSION=0.8.1
DEFAULT_MODEL=gpt-4-1106-preview
MAX_TOKENS=4000
TEMPERATURE=0.7
TIMEOUT_SECONDS=30

# Memory Configuration
MEMORY_RETENTION_DAYS=30
MAX_CONTEXT_MESSAGES=20
CACHE_TTL_SECONDS=3600

# Monitoring Configuration
LOG_LEVEL=INFO
METRICS_ENABLED=true
ALERTS_ENABLED=true
ADMIN_PHONE_NUMBERS=5511999999999,5511888888888

# Development Configuration
DEBUG_MODE=true
PLAYGROUND_ENABLED=true
TEST_MODE=false
```

### **Configuração do Agent Squad (config.yaml)**
```yaml
# agent_squad_config.yaml
orchestrator:
  name: "falachefe_orchestrator"
  model: "gpt-4-1106-preview"
  temperature: 0.7
  max_tokens: 4000
  timeout: 30
  
agents:
  financial_agent:
    name: "financial_agent"
    model: "gpt-4-1106-preview"
    temperature: 0.3
    max_tokens: 3000
    tools:
      - "calculate_roi"
      - "analyze_budget"
      - "project_cashflow"
      - "generate_financial_report"
    
  cashflow_agent:
    name: "cashflow_agent"
    model: "gpt-4-1106-preview"
    temperature: 0.3
    max_tokens: 2500
    tools:
      - "monitor_cashflow"
      - "alert_dues"
      - "project_revenue"
      - "analyze_liquidity"
    
  marketing_sales_agent:
    name: "marketing_sales_agent"
    model: "gpt-4-1106-preview"
    temperature: 0.5
    max_tokens: 3500
    tools:
      - "create_campaign"
      - "analyze_metrics"
      - "qualify_lead"
      - "optimize_funnel"
    
  hr_agent:
    name: "hr_agent"
    model: "gpt-4-1106-preview"
    temperature: 0.4
    max_tokens: 3000
    tools:
      - "recruit_candidate"
      - "evaluate_performance"
      - "manage_policies"
      - "plan_career"

memory:
  individual:
    retention_days: 30
    max_messages: 50
    compression_enabled: true
  
  shared:
    retention_days: 90
    max_context_size: 10000
    sync_interval: 60

classifier:
  model: "gpt-4-1106-preview"
  temperature: 0.1
  intents:
    - "financial_analysis"
    - "budget_planning"
    - "cost_optimization"
    - "cashflow_monitoring"
    - "revenue_projection"
    - "marketing_strategy"
    - "campaign_management"
    - "lead_qualification"
    - "sales_funnel"
    - "hr_recruitment"
    - "performance_management"
    - "policy_consultation"

monitoring:
  metrics_enabled: true
  alerts_enabled: true
  dashboard_enabled: true
  log_level: "INFO"
  
  thresholds:
    response_time_warning: 3.0
    response_time_critical: 5.0
    confidence_warning: 0.7
    confidence_critical: 0.5
```

## 🚀 **Scripts de Setup**

### **Script de Instalação (setup.sh)**
```bash
#!/bin/bash
# scripts/setup.sh

set -e

echo "🚀 Configurando Agent Squad para Falachefe..."

# 1. Verificar Python
echo "🐍 Verificando Python..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 não encontrado. Instale Python 3.9+ primeiro."
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2 | cut -d'.' -f1,2)
if [[ $(echo "$PYTHON_VERSION < 3.9" | bc -l) -eq 1 ]]; then
    echo "❌ Python 3.9+ necessário. Versão atual: $PYTHON_VERSION"
    exit 1
fi

echo "✅ Python $PYTHON_VERSION encontrado"

# 2. Criar ambiente virtual
echo "📦 Criando ambiente virtual..."
python3 -m venv venv
source venv/bin/activate

# 3. Instalar dependências
echo "📚 Instalando dependências..."
pip install --upgrade pip
pip install -r requirements.txt

# 4. Configurar banco de dados
echo "🗄️ Configurando banco de dados..."
python scripts/setup_database.py

# 5. Configurar Redis
echo "🔴 Configurando Redis..."
python scripts/setup_redis.py

# 6. Testar configuração
echo "🧪 Testando configuração..."
python scripts/test_setup.py

echo "✅ Setup concluído com sucesso!"
echo "📝 Para ativar o ambiente: source venv/bin/activate"
echo "🎮 Para testar: python playground/main.py"
```

### **Script de Teste (test_setup.py)**
```python
#!/usr/bin/env python3
# scripts/test_setup.py

import os
import sys
import asyncio
import asyncpg
import redis.asyncio as redis
from openai import AsyncOpenAI

async def test_database():
    """Testa conexão com banco de dados"""
    try:
        conn = await asyncpg.connect(os.getenv('DATABASE_URL'))
        result = await conn.fetchval('SELECT 1')
        await conn.close()
        print("✅ Banco de dados: OK")
        return True
    except Exception as e:
        print(f"❌ Banco de dados: ERRO - {e}")
        return False

async def test_redis():
    """Testa conexão com Redis"""
    try:
        r = redis.from_url(os.getenv('REDIS_URL'))
        await r.ping()
        await r.close()
        print("✅ Redis: OK")
        return True
    except Exception as e:
        print(f"❌ Redis: ERRO - {e}")
        return False

async def test_openai():
    """Testa conexão com OpenAI"""
    try:
        client = AsyncOpenAI()
        response = await client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": "Hello"}],
            max_tokens=10
        )
        print("✅ OpenAI: OK")
        return True
    except Exception as e:
        print(f"❌ OpenAI: ERRO - {e}")
        return False

async def test_uazapi():
    """Testa conexão com UazAPI"""
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{os.getenv('UAZ_BASE_URL')}/status",
                headers={"Authorization": f"Bearer {os.getenv('UAZ_API_KEY')}"},
                timeout=10
            )
            if response.status_code == 200:
                print("✅ UazAPI: OK")
                return True
            else:
                print(f"❌ UazAPI: ERRO - Status {response.status_code}")
                return False
    except Exception as e:
        print(f"❌ UazAPI: ERRO - {e}")
        return False

async def main():
    """Executa todos os testes"""
    print("🧪 Testando configuração do Agent Squad...\n")
    
    tests = [
        test_database(),
        test_redis(), 
        test_openai(),
        test_uazapi()
    ]
    
    results = await asyncio.gather(*tests, return_exceptions=True)
    
    passed = sum(1 for r in results if r is True)
    total = len(tests)
    
    print(f"\n📊 Resultado: {passed}/{total} testes passaram")
    
    if passed == total:
        print("🎉 Todos os testes passaram! Sistema pronto para uso.")
        sys.exit(0)
    else:
        print("⚠️ Alguns testes falharam. Verifique a configuração.")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(main())
```

### **Script de Deploy (deploy.sh)**
```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-staging}
echo "🚀 Deploying to $ENVIRONMENT..."

# 1. Executar testes
echo "🧪 Executando testes..."
pytest tests/ -v --cov=src/ --cov-report=html

if [ $? -ne 0 ]; then
    echo "❌ Testes falharam. Deploy cancelado."
    exit 1
fi

# 2. Build e push Docker
echo "🐳 Building Docker image..."
docker build -t falachefe-agent-squad:$ENVIRONMENT .
docker tag falachefe-agent-squad:$ENVIRONMENT falachefe-agent-squad:latest

# 3. Deploy para AWS
echo "☁️ Deploying to AWS..."
if [ "$ENVIRONMENT" = "production" ]; then
    serverless deploy --stage prod --verbose
else
    serverless deploy --stage $ENVIRONMENT --verbose
fi

# 4. Executar migrações
echo "🗄️ Executando migrações..."
python scripts/migrate_database.py --environment $ENVIRONMENT

# 5. Verificar health
echo "🏥 Verificando health check..."
sleep 30

HEALTH_URL="https://api-$ENVIRONMENT.falachefe.com/health"
if curl -f "$HEALTH_URL" > /dev/null 2>&1; then
    echo "✅ Health check passou"
else
    echo "❌ Health check falhou"
    exit 1
fi

# 6. Notificar sucesso
echo "📢 Notificando administradores..."
python scripts/notify_deployment.py --environment $ENVIRONMENT --status success

echo "🎉 Deploy para $ENVIRONMENT concluído com sucesso!"
```

## 📊 **Scripts de Monitoramento**

### **Dashboard de Métricas (dashboard.py)**
```python
#!/usr/bin/env python3
# scripts/dashboard.py

import asyncio
import json
from datetime import datetime, timedelta
from src.monitoring.dashboard import MonitoringDashboard
from src.integrations.database_client import DatabaseClient

async def generate_daily_report():
    """Gera relatório diário de métricas"""
    
    db_client = DatabaseClient()
    dashboard = MonitoringDashboard(db_client)
    
    # Métricas das últimas 24h
    metrics = await dashboard.get_agent_metrics(24)
    flows = await dashboard.get_conversation_flow()
    
    report = {
        "date": datetime.now().isoformat(),
        "period": "24h",
        "metrics": metrics,
        "flows": flows,
        "summary": {
            "total_interactions": sum(agent["total_interactions"] for agent in metrics["agent_metrics"]),
            "avg_response_time": sum(agent["avg_response_time"] for agent in metrics["agent_metrics"]) / len(metrics["agent_metrics"]),
            "high_confidence_rate": sum(agent["high_confidence_count"] for agent in metrics["agent_metrics"]) / sum(agent["total_interactions"] for agent in metrics["agent_metrics"])
        }
    }
    
    # Salvar relatório
    with open(f"reports/daily_report_{datetime.now().strftime('%Y%m%d')}.json", "w") as f:
        json.dump(report, f, indent=2)
    
    print("📊 Relatório diário gerado:")
    print(f"   Total de interações: {report['summary']['total_interactions']}")
    print(f"   Tempo médio de resposta: {report['summary']['avg_response_time']:.2f}s")
    print(f"   Taxa de alta confiança: {report['summary']['high_confidence_rate']:.2%}")
    
    return report

if __name__ == "__main__":
    asyncio.run(generate_daily_report())
```

### **Script de Limpeza (cleanup.py)**
```python
#!/usr/bin/env python3
# scripts/cleanup.py

import asyncio
from datetime import datetime, timedelta
from src.integrations.database_client import DatabaseClient

async def cleanup_old_data():
    """Remove dados antigos para manter performance"""
    
    db_client = DatabaseClient()
    
    # Limpar interações antigas (mais de 90 dias)
    cutoff_date = datetime.now() - timedelta(days=90)
    
    result = await db_client.execute(
        """
        DELETE FROM agent_interactions 
        WHERE created_at < %s
        """,
        (cutoff_date,)
    )
    
    print(f"🗑️ Removidas {result} interações antigas")
    
    # Limpar contexto de conversas antigas (mais de 30 dias)
    context_cutoff = datetime.now() - timedelta(days=30)
    
    result = await db_client.execute(
        """
        DELETE FROM conversation_context 
        WHERE last_updated < %s
        """,
        (context_cutoff,)
    )
    
    print(f"🗑️ Removidos {result} contextos antigos")
    
    # Limpar insights compartilhados antigos (mais de 7 dias)
    insights_cutoff = datetime.now() - timedelta(days=7)
    
    result = await db_client.execute(
        """
        DELETE FROM shared_insights 
        WHERE created_at < %s
        """,
        (insights_cutoff,)
    )
    
    print(f"🗑️ Removidos {result} insights antigos")
    
    print("✅ Limpeza concluída")

if __name__ == "__main__":
    asyncio.run(cleanup_old_data())
```

## 🎮 **Scripts do Playground**

### **Simulador de Conversas (conversation_simulator.py)**
```python
#!/usr/bin/env python3
# playground/conversation_simulator.py

import asyncio
import random
from datetime import datetime
from src.agents.orchestrator import FalachefeOrchestrator

class ConversationSimulator:
    def __init__(self, config):
        self.orchestrator = FalachefeOrchestrator(config)
        self.scenarios = self._load_scenarios()
    
    def _load_scenarios(self):
        """Carrega cenários de teste"""
        return {
            "financial_analysis": [
                "Preciso analisar o ROI do último projeto",
                "Como está nosso orçamento de marketing?",
                "Qual o custo-benefício dessa campanha?",
                "Preciso de um relatório financeiro do trimestre"
            ],
            "cashflow_monitoring": [
                "Como está nosso fluxo de caixa?",
                "Temos dinheiro para pagar as contas?",
                "Quando recebemos o pagamento do cliente X?",
                "Preciso de uma projeção para os próximos 3 meses"
            ],
            "marketing_strategy": [
                "Quero criar uma campanha de marketing digital",
                "Como aumentar nossas vendas online?",
                "Qual a melhor estratégia para o Instagram?",
                "Preciso de ideias para conteúdo"
            ],
            "hr_recruitment": [
                "Preciso contratar um desenvolvedor",
                "Qual o processo de recrutamento?",
                "Como avaliar candidatos?",
                "Preciso de ajuda com políticas de RH"
            ]
        }
    
    async def run_scenario(self, scenario_name: str, iterations: int = 5):
        """Executa um cenário específico"""
        
        print(f"\n🎭 Executando cenário: {scenario_name}")
        print("=" * 50)
        
        messages = self.scenarios[scenario_name]
        
        context = {
            "user_id": f"simulator_{scenario_name}",
            "conversation_id": f"sim_{scenario_name}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
            "platform": "playground",
            "simulation": True
        }
        
        for i in range(iterations):
            message = random.choice(messages)
            
            print(f"\n👤 Usuário: {message}")
            
            start_time = datetime.now()
            result = await self.orchestrator.process_message(message, context)
            end_time = datetime.now()
            
            response_time = (end_time - start_time).total_seconds()
            
            print(f"🤖 Agente: {result['agent']}")
            print(f"🎯 Intenção: {result['intent']} (confiança: {result['confidence']:.2f})")
            print(f"⏱️ Tempo: {response_time:.2f}s")
            print(f"💬 Resposta: {result['response'][:100]}...")
            
            # Aguardar entre interações
            await asyncio.sleep(1)
    
    async def run_stress_test(self, concurrent_users: int = 10, messages_per_user: int = 5):
        """Executa teste de stress"""
        
        print(f"\n💪 Teste de stress: {concurrent_users} usuários, {messages_per_user} mensagens cada")
        print("=" * 60)
        
        async def simulate_user(user_id: int):
            context = {
                "user_id": f"stress_user_{user_id}",
                "conversation_id": f"stress_{user_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "platform": "playground",
                "simulation": True
            }
            
            all_messages = []
            for scenario_messages in self.scenarios.values():
                all_messages.extend(scenario_messages)
            
            for i in range(messages_per_user):
                message = random.choice(all_messages)
                
                start_time = datetime.now()
                result = await self.orchestrator.process_message(message, context)
                end_time = datetime.now()
                
                return {
                    "user_id": user_id,
                    "message": message,
                    "response_time": (end_time - start_time).total_seconds(),
                    "agent": result["agent"],
                    "confidence": result["confidence"]
                }
        
        # Executar usuários concorrentes
        tasks = [simulate_user(i) for i in range(concurrent_users)]
        results = await asyncio.gather(*tasks)
        
        # Analisar resultados
        avg_response_time = sum(r["response_time"] for r in results) / len(results)
        avg_confidence = sum(r["confidence"] for r in results) / len(results)
        
        print(f"\n📊 Resultados do teste de stress:")
        print(f"   Tempo médio de resposta: {avg_response_time:.2f}s")
        print(f"   Confiança média: {avg_confidence:.2f}")
        print(f"   Usuários processados: {len(results)}")

async def main():
    """Função principal do simulador"""
    
    config = {
        "OPENAI_API_KEY": "your-key",
        "DATABASE_URL": "postgresql://...",
        "REDIS_URL": "redis://..."
    }
    
    simulator = ConversationSimulator(config)
    
    print("🎮 Simulador de Conversas - Agent Squad Falachefe")
    print("Escolha uma opção:")
    print("1. Cenário Financeiro")
    print("2. Cenário Fluxo de Caixa")
    print("3. Cenário Marketing")
    print("4. Cenário RH")
    print("5. Teste de Stress")
    print("6. Todos os cenários")
    
    choice = input("\nOpção: ")
    
    if choice == "1":
        await simulator.run_scenario("financial_analysis")
    elif choice == "2":
        await simulator.run_scenario("cashflow_monitoring")
    elif choice == "3":
        await simulator.run_scenario("marketing_strategy")
    elif choice == "4":
        await simulator.run_scenario("hr_recruitment")
    elif choice == "5":
        await simulator.run_stress_test()
    elif choice == "6":
        for scenario in simulator.scenarios.keys():
            await simulator.run_scenario(scenario, 3)
    else:
        print("❌ Opção inválida")

if __name__ == "__main__":
    asyncio.run(main())
```

## 📝 **Templates de Configuração**

### **Docker Compose (docker-compose.yml)**
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: falachefe_agents
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  agent-squad:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/falachefe_agents
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./src:/app/src
      - ./playground:/app/playground

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - agent-squad

volumes:
  postgres_data:
  redis_data:
```

### **Requirements (requirements.txt)**
```txt
# Agent Squad Framework
agent-squad==0.8.1

# OpenAI Integration
openai==1.3.0
anthropic==0.7.0

# Database
asyncpg==0.29.0
sqlalchemy==2.0.23
alembic==1.12.1

# Redis
redis==5.0.1
aioredis==2.0.1

# HTTP Clients
httpx==0.25.2
aiohttp==3.9.1

# FastAPI
fastapi==0.104.1
uvicorn==0.24.0
pydantic==2.5.0

# AWS
boto3==1.34.0
botocore==1.34.0

# Monitoring
prometheus-client==0.19.0
structlog==23.2.0

# Testing
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
httpx==0.25.2

# Development
black==23.11.0
isort==5.12.0
flake8==6.1.0
mypy==1.7.1

# Utilities
python-dotenv==1.0.0
click==8.1.7
rich==13.7.0
```

---

**🎉 Agora você tem todos os scripts e configurações necessários para implementar o Agent Squad no projeto Falachefe!**
