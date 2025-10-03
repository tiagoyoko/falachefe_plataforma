# 🚀 **Guia de Implementação Agent Squad - Parte 2**

## 🎮 **Playground e Testes**

### **Fase 5: Ambiente de Desenvolvimento**

#### **Passo 5.1: Setup do Playground**
```python
# playground/main.py
import asyncio
from src.agents.orchestrator import FalachefeOrchestrator
from src.memory.shared_memory import SharedMemory
from src.integrations.database_client import DatabaseClient

async def test_conversation():
    """Testa conversação completa com múltiplos agentes"""
    
    config = {
        "OPENAI_API_KEY": "your_key",
        "DATABASE_URL": "postgresql://...",
        "REDIS_URL": "redis://..."
    }
    
    # Inicializar sistema
    orchestrator = FalachefeOrchestrator(config)
    shared_memory = SharedMemory(DatabaseClient(config))
    
    # Simular conversa
    conversation_id = "test_conv_001"
    user_id = "test_user"
    
    test_messages = [
        "Olá, preciso de ajuda com análise financeira",
        "Qual é o ROI do nosso último projeto de marketing?",
        "Como está nosso fluxo de caixa para o próximo trimestre?",
        "Preciso contratar um desenvolvedor, qual o processo?",
        "Quero criar uma campanha de marketing digital"
    ]
    
    context = {
        "user_id": user_id,
        "conversation_id": conversation_id,
        "platform": "playground"
    }
    
    for message in test_messages:
        print(f"\n👤 Usuário: {message}")
        
        # Processar mensagem
        result = await orchestrator.process_message(message, context)
        
        print(f"🤖 Agente: {result['agent']}")
        print(f"🎯 Intenção: {result['intent']}")
        print(f"💬 Resposta: {result['response']}")
        print(f"🎯 Confiança: {result['confidence']:.2f}")
        
        # Aguardar input do usuário para continuar
        input("\nPressione Enter para continuar...")

if __name__ == "__main__":
    asyncio.run(test_conversation())
```

#### **Passo 5.2: Testes Unitários**
```python
# tests/test_agents.py
import pytest
from unittest.mock import Mock, AsyncMock
from src.agents.financial_agent import FinancialAgent

class TestFinancialAgent:
    @pytest.fixture
    def agent(self):
        config = {"OPENAI_API_KEY": "test_key"}
        return FinancialAgent(config)
    
    @pytest.mark.asyncio
    async def test_budget_analysis(self, agent):
        """Testa análise de orçamento"""
        
        message = "Preciso analisar o orçamento do departamento de marketing"
        context = {
            "user_id": "test_user",
            "conversation_id": "test_conv",
            "budget_data": {"marketing": 50000, "sales": 30000}
        }
        
        response = await agent.process(message, context)
        
        assert "orçamento" in response.lower()
        assert "marketing" in response.lower()
        assert len(response) > 50
    
    @pytest.mark.asyncio
    async def test_roi_calculation(self, agent):
        """Testa cálculo de ROI"""
        
        message = "Qual o ROI do projeto que investimos R$ 100.000 e retornou R$ 150.000?"
        context = {
            "user_id": "test_user", 
            "conversation_id": "test_conv"
        }
        
        response = await agent.process(message, context)
        
        assert "roi" in response.lower()
        assert "50%" in response or "50" in response

# tests/test_orchestrator.py
class TestOrchestrator:
    @pytest.mark.asyncio
    async def test_intent_routing(self):
        """Testa roteamento de intenções"""
        
        orchestrator = FalachefeOrchestrator({"OPENAI_API_KEY": "test"})
        
        test_cases = [
            ("Preciso de ajuda com orçamento", "financial_agent"),
            ("Como está nosso fluxo de caixa?", "cashflow_agent"),
            ("Quero criar uma campanha", "marketing_sales_agent"),
            ("Preciso contratar alguém", "hr_agent")
        ]
        
        for message, expected_agent in test_cases:
            context = {"user_id": "test", "conversation_id": "test"}
            result = await orchestrator.process_message(message, context)
            
            assert result["agent"] == expected_agent
```

### **Fase 6: Deploy e Produção**

#### **Passo 6.1: Configuração AWS Lambda**
```yaml
# serverless.yml
service: falachefe-agent-squad

provider:
  name: aws
  runtime: python3.9
  region: us-east-1
  timeout: 30
  memorySize: 1024
  
  environment:
    OPENAI_API_KEY: ${env:OPENAI_API_KEY}
    DATABASE_URL: ${env:DATABASE_URL}
    REDIS_URL: ${env:REDIS_URL}
    UAZ_API_KEY: ${env:UAZ_API_KEY}
    UAZ_API_SECRET: ${env:UAZ_API_SECRET}

functions:
  webhook:
    handler: src.main.webhook_handler
    events:
      - http:
          path: /webhook/uaz
          method: post
          cors: true
  
  agent_processing:
    handler: src.main.agent_processor
    events:
      - sqs:
          arn: ${env:AGENT_QUEUE_ARN}
  
  memory_cleanup:
    handler: src.main.memory_cleanup
    events:
      - schedule: rate(1 hour)

plugins:
  - serverless-python-requirements

custom:
  pythonRequirements:
    dockerizePip: true
    slim: true
    strip: false
```

#### **Passo 6.2: Docker para Desenvolvimento**
```dockerfile
# Dockerfile
FROM python:3.9-slim

WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .
RUN pip install -r requirements.txt

# Copiar código
COPY src/ ./src/
COPY playground/ ./playground/
COPY tests/ ./tests/

# Expor porta
EXPOSE 8000

# Comando padrão
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### **Passo 6.3: Scripts de Deploy**
```bash
#!/bin/bash
# scripts/deploy.sh

echo "🚀 Iniciando deploy do Agent Squad..."

# 1. Testes
echo "🧪 Executando testes..."
pytest tests/ -v --cov=src/

if [ $? -ne 0 ]; then
    echo "❌ Testes falharam. Deploy cancelado."
    exit 1
fi

# 2. Build Docker
echo "🐳 Construindo imagem Docker..."
docker build -t falachefe-agent-squad .

# 3. Deploy para AWS
echo "☁️ Deployando para AWS..."
serverless deploy --stage production

# 4. Verificar health
echo "🏥 Verificando health check..."
sleep 30
curl -f https://api.falachefe.com/health || {
    echo "❌ Health check falhou"
    exit 1
}

echo "✅ Deploy concluído com sucesso!"
```

### **Fase 7: Monitoramento e Métricas**

#### **Passo 7.1: Dashboard de Monitoramento**
```python
# src/monitoring/dashboard.py
from fastapi import FastAPI
from fastapi.responses import HTMLResponse
import json
from datetime import datetime, timedelta
from ..integrations.database_client import DatabaseClient

class MonitoringDashboard:
    def __init__(self, db_client: DatabaseClient):
        self.db_client = db_client
    
    async def get_agent_metrics(self, time_range: int = 24) -> dict:
        """Obtém métricas dos agentes"""
        
        since = datetime.now() - timedelta(hours=time_range)
        
        # Métricas por agente
        agent_stats = await self.db_client.query("""
            SELECT 
                agent_id,
                COUNT(*) as total_interactions,
                AVG(response_time) as avg_response_time,
                COUNT(CASE WHEN intent_confidence > 0.8 THEN 1 END) as high_confidence_count
            FROM agent_interactions 
            WHERE created_at >= %s
            GROUP BY agent_id
        """, (since,))
        
        # Métricas de intenção
        intent_stats = await self.db_client.query("""
            SELECT 
                intent,
                COUNT(*) as count,
                AVG(confidence) as avg_confidence
            FROM agent_interactions
            WHERE created_at >= %s
            GROUP BY intent
            ORDER BY count DESC
        """, (since,))
        
        return {
            "agent_metrics": agent_stats,
            "intent_metrics": intent_stats,
            "time_range_hours": time_range,
            "generated_at": datetime.now().isoformat()
        }
    
    async def get_conversation_flow(self) -> dict:
        """Obtém fluxo de conversas entre agentes"""
        
        flow_data = await self.db_client.query("""
            SELECT 
                conversation_id,
                ARRAY_AGG(agent_id ORDER BY created_at) as agent_sequence,
                COUNT(*) as total_interactions
            FROM agent_interactions
            WHERE created_at >= NOW() - INTERVAL '24 hours'
            GROUP BY conversation_id
            HAVING COUNT(*) > 1
            ORDER BY total_interactions DESC
            LIMIT 100
        """)
        
        return {
            "conversation_flows": flow_data,
            "total_multi_agent_conversations": len(flow_data)
        }
```

#### **Passo 7.2: Alertas e Notificações**
```python
# src/monitoring/alerts.py
import asyncio
from typing import List, Dict
from ..integrations.database_client import DatabaseClient
from ..integrations.uazapi_client import UazAPIClient

class AlertManager:
    def __init__(self, db_client: DatabaseClient, uaz_client: UazAPIClient):
        self.db_client = db_client
        self.uaz_client = uaz_client
    
    async def check_agent_performance(self) -> List[Dict]:
        """Verifica performance dos agentes e gera alertas"""
        
        alerts = []
        
        # Verificar tempo de resposta alto
        slow_agents = await self.db_client.query("""
            SELECT agent_id, AVG(response_time) as avg_time
            FROM agent_interactions
            WHERE created_at >= NOW() - INTERVAL '1 hour'
            GROUP BY agent_id
            HAVING AVG(response_time) > 5.0
        """)
        
        for agent in slow_agents:
            alerts.append({
                "type": "performance",
                "severity": "warning",
                "agent_id": agent["agent_id"],
                "message": f"Agente {agent['agent_id']} com tempo de resposta alto: {agent['avg_time']:.2f}s",
                "timestamp": datetime.now().isoformat()
            })
        
        # Verificar baixa confiança
        low_confidence = await self.db_client.query("""
            SELECT agent_id, COUNT(*) as low_conf_count
            FROM agent_interactions
            WHERE created_at >= NOW() - INTERVAL '1 hour'
            AND intent_confidence < 0.6
            GROUP BY agent_id
            HAVING COUNT(*) > 5
        """)
        
        for agent in low_confidence:
            alerts.append({
                "type": "confidence",
                "severity": "critical",
                "agent_id": agent["agent_id"],
                "message": f"Agente {agent['agent_id']} com {agent['low_conf_count']} respostas de baixa confiança",
                "timestamp": datetime.now().isoformat()
            })
        
        return alerts
    
    async def send_admin_alert(self, alert: Dict) -> None:
        """Envia alerta para administradores"""
        
        admin_numbers = ["5511999999999", "5511888888888"]  # Configurar
        
        message = f"🚨 ALERTA FALACHEFE AGENT SQUAD\n\n"
        message += f"Tipo: {alert['type']}\n"
        message += f"Severidade: {alert['severity']}\n"
        message += f"Agente: {alert['agent_id']}\n"
        message += f"Mensagem: {alert['message']}\n"
        message += f"Timestamp: {alert['timestamp']}"
        
        for number in admin_numbers:
            await self.uaz_client.send_message(
                number=number,
                text=message,
                message_type="text"
            )
```

## 📋 **Checklist de Implementação**

### **✅ Pré-requisitos**
- [ ] Conta AWS configurada com permissões
- [ ] OpenAI API Key válida
- [ ] Banco PostgreSQL configurado
- [ ] Redis para cache
- [ ] UazAPI configurado e funcionando
- [ ] Ambiente Python 3.9+

### **✅ Fase 1: Setup**
- [ ] Clone do Agent Squad
- [ ] Instalação de dependências
- [ ] Configuração de variáveis de ambiente
- [ ] Estrutura de projeto criada

### **✅ Fase 2: Agentes**
- [ ] Orquestrador implementado
- [ ] Agente Financeiro implementado
- [ ] Agente Fluxo de Caixa implementado
- [ ] Agente Marketing/Vendas implementado
- [ ] Agente RH implementado
- [ ] Testes unitários dos agentes

### **✅ Fase 3: Memória**
- [ ] Sistema de memória individual
- [ ] Sistema de memória compartilhada
- [ ] Persistência no banco de dados
- [ ] Cache Redis implementado

### **✅ Fase 4: Integração**
- [ ] Cliente UazAPI implementado
- [ ] Webhook handler funcionando
- [ ] Fluxo de mensagens testado
- [ ] Tratamento de erros implementado

### **✅ Fase 5: Playground**
- [ ] Ambiente de desenvolvimento
- [ ] Testes de conversação
- [ ] Simulação de cenários
- [ ] Debugging e logs

### **✅ Fase 6: Produção**
- [ ] Deploy AWS Lambda
- [ ] Configuração de domínio
- [ ] SSL/HTTPS configurado
- [ ] Monitoramento ativo

### **✅ Fase 7: Monitoramento**
- [ ] Dashboard de métricas
- [ ] Sistema de alertas
- [ ] Logs estruturados
- [ ] Backup e recuperação

## 🎯 **Próximos Passos**

1. **Implementar Fase 1**: Setup básico e estrutura
2. **Desenvolver Agentes**: Começar com um agente por vez
3. **Testar Integração**: Validar com UazAPI
4. **Expandir Funcionalidades**: Adicionar mais capacidades
5. **Otimizar Performance**: Ajustar baseado em métricas
6. **Escalar Sistema**: Preparar para maior volume

## 📚 **Recursos Adicionais**

- **Documentação Agent Squad**: https://github.com/awslabs/agent-squad
- **OpenAI API Docs**: https://platform.openai.com/docs
- **UazAPI Docs**: https://uazapi.com/docs
- **AWS Lambda Docs**: https://docs.aws.amazon.com/lambda/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/

---

**🎉 Parabéns! Você agora tem um guia completo para implementar o Agent Squad no projeto Falachefe!**
