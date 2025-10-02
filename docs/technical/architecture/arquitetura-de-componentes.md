# Arquitetura de Componentes

## 1. UAZ API Gateway
- Gateway principal para integração WhatsApp
- Circuit breaker e retry logic
- Rate limiting e cache
- Webhook processing

## 2. Orchestrator Agent
- Analisa mensagens e determina intenção
- Roteia para agentes especializados
- Gerencia contexto da conversa
- Aprendizado contínuo

## 3. Agentes Especializados
- **Sales Agent:** Vendas e propostas
- **Support Agent:** Suporte técnico
- **Marketing Agent:** Campanhas e segmentação
- **Finance Agent:** Relatórios e cobrança

## 4. Sistema de Memória
- **Agent Memory:** Memórias individuais por agente
- **Shared Memory:** Memórias compartilhadas entre agentes
- **Conversation Context:** Contexto persistente das conversas
- **Learning Memory:** Padrões de aprendizado
