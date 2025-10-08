# 🎯 Guia do Sistema de Orquestração Falachefe

## 📋 Visão Geral

O sistema Falachefe agora opera com uma **arquitetura hierárquica orquestrada**, onde:

1. **Orquestrador** recebe e analisa demandas dos usuários
2. **Especialistas** (Financeiro, Marketing, Vendas, RH) são acionados conforme necessário
3. **Agente de Suporte** formata e envia respostas via WhatsApp (uazapi)

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────┐
│           USUÁRIO VIA WHATSAPP                  │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         AGENTE ORQUESTRADOR                     │
│  • Analisa a demanda                            │
│  • Identifica especialista(s) necessário(s)     │
│  • Delega para o especialista correto           │
└────────┬────────────────────────────────────────┘
         │
         ├──────►┌─────────────────────────┐
         │       │  Especialista Financeiro │
         │       └─────────────────────────┘
         │
         ├──────►┌─────────────────────────┐
         │       │  Especialista Marketing  │
         │       └─────────────────────────┘
         │
         ├──────►┌─────────────────────────┐
         │       │  Especialista Vendas     │
         │       └─────────────────────────┘
         │
         └──────►┌─────────────────────────┐
                 │  Especialista RH         │
                 └─────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │    AGENTE DE SUPORTE           │
         │  • Formata a resposta          │
         │  • Adiciona saudação/assinatura│
         │  • Envia via WhatsApp (uazapi) │
         └────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────┐
         │   USUÁRIO RECEBE RESPOSTA      │
         └────────────────────────────────┘
```

## 🔧 Componentes Principais

### 1. Agente Orquestrador (`orchestrator`)

**Responsabilidades:**
- Analisar demandas dos usuários
- Identificar qual especialista deve atender
- Coordenar consultorias multi-disciplinares
- Garantir que cada cliente receba a consultoria adequada

**Características:**
- `allow_delegation: true` - Pode delegar para outros agentes
- Visão holística de negócios
- Conhece competências de cada especialista

**Quando usar cada especialista:**
- **Financeiro**: Fluxo de caixa, custos, precificação, análise financeira, DRE
- **Marketing**: Estratégias digitais, redes sociais, campanhas, SEO, branding
- **Vendas**: Processos comerciais, prospecção, fechamento, CRM, funil de vendas
- **RH**: Contratação, legislação trabalhista, gestão de pessoas, folha de pagamento

### 2. Agentes Especialistas

Cada especialista é focado em sua área e **não delega** (`allow_delegation: false`):

- `financial_expert` - Finanças e contabilidade
- `marketing_expert` - Marketing digital
- `sales_expert` - Vendas e gestão comercial
- `hr_expert` - Recursos humanos

**Ferramentas dos Especialistas:**
- Especialista Financeiro tem acesso às ferramentas de fluxo de caixa
- Demais especialistas usam conhecimento e raciocínio

### 3. Agente de Suporte (`support_agent`)

**Responsabilidades:**
- Receber respostas dos especialistas
- Formatar para WhatsApp (claro, amigável, profissional)
- Escolher formato adequado (texto/menu/mídia)
- Enviar via uazapi
- Atualizar informações do lead

**Ferramentas disponíveis:**
- `SendTextMessageTool` - Enviar textos simples
- `SendMenuMessageTool` - Enviar menus interativos
- `SendMediaMessageTool` - Enviar documentos/imagens
- `FormatResponseTool` - Formatar respostas
- `GetChatDetailsTool` - Obter dados do chat/lead
- `UpdateLeadInfoTool` - Atualizar CRM

**Diretrizes de formatação:**
- Até 500 chars: texto simples
- 500-2000 chars: texto estruturado com emojis
- Acima de 2000 chars: dividir ou gerar documento
- 3+ opções: considerar menu interativo

## 🚀 Como Usar

### Configuração Inicial

1. **Configure as variáveis de ambiente:**

```bash
# .env no diretório falachefe_crew
UAZAPI_BASE_URL=https://free.uazapi.com  # ou seu servidor
UAZAPI_TOKEN=seu_token_aqui
FALACHEFE_API_URL=http://localhost:3000
```

2. **Instale as dependências:**

```bash
cd crewai-projects/falachefe_crew
uv sync
```

### Exemplo de Uso - Atendimento Completo

```python
from falachefe_crew.crew import FalachefeCrew

# Criar instância do crew
crew = FalachefeCrew()

# Exemplo 1: Dúvida sobre fluxo de caixa
result = crew.crew().kickoff(inputs={
    "user_request": "Preciso organizar o financeiro da minha empresa. Como criar um fluxo de caixa?",
    "user_context": "Pequena empresa de serviços, 5 funcionários",
    "whatsapp_number": "5511999999999",
    "user_id": "user_123"
})

# Exemplo 2: Dúvida sobre marketing
result = crew.crew().kickoff(inputs={
    "user_request": "Como aumentar minhas vendas online? Tenho R$ 500/mês para investir em marketing",
    "user_context": "Loja de roupas online, Instagram com 2k seguidores",
    "whatsapp_number": "5511888888888",
    "user_id": "user_456"
})

# Exemplo 3: Consultoria integrada
result = crew.crew().kickoff(inputs={
    "user_request": "Minha empresa está com problemas de caixa e equipe desmotivada",
    "user_context": "Restaurante, 8 funcionários, faturamento irregular",
    "whatsapp_number": "5511777777777",
    "user_id": "user_789"
})
```

## 🔄 Fluxo de Trabalho

### Cenário 1: Demanda Simples (um especialista)

```
1. Usuário: "Como calcular meu ponto de equilíbrio?"
   ↓
2. Orquestrador: Analisa → Identifica como questão FINANCEIRA
   ↓
3. Orquestrador: Delega para financial_expert
   ↓
4. Financial Expert: Responde com cálculo e explicação
   ↓
5. Support Agent: Formata resposta para WhatsApp
   ↓
6. Support Agent: Envia via uazapi
   ↓
7. Usuário: Recebe resposta formatada
```

### Cenário 2: Demanda Complexa (múltiplos especialistas)

```
1. Usuário: "Preciso contratar vendedor e definir comissões"
   ↓
2. Orquestrador: Identifica → Envolve VENDAS + RH + FINANÇAS
   ↓
3. Orquestrador: Coordena consulta com múltiplos especialistas:
   - Sales Expert: Define perfil e processo de vendas
   - HR Expert: Orienta sobre contratação e CLT
   - Financial Expert: Sugere modelo de comissionamento
   ↓
4. Support Agent: Compila e formata resposta integrada
   ↓
5. Support Agent: Envia via WhatsApp
   ↓
6. Usuário: Recebe consultoria completa
```

### Cenário 3: Necessita Esclarecimento

```
1. Usuário: "Preciso melhorar minha empresa"
   ↓
2. Orquestrador: Demanda vaga → needs_clarification
   ↓
3. Support Agent: Formata perguntas de esclarecimento
   ↓
4. Support Agent: Envia menu interativo com opções:
   - "📊 Melhorar resultados financeiros"
   - "📱 Aumentar vendas e marketing"
   - "👥 Gestão de equipe"
   - "💼 Consultoria geral"
   ↓
5. Usuário: Seleciona opção
   ↓
6. Fluxo reinicia com contexto clarificado
```

## 🛠️ Ferramentas de Integração uazapi

### SendTextMessageTool

Envia mensagens de texto simples:

```python
# Usado internamente pelo support_agent
{
    "number": "5511999999999",
    "text": "Sua resposta formatada aqui",
    "link_preview": false,
    "delay": 1000,  # Simula digitação
    "read_chat": true
}
```

### SendMenuMessageTool

Envia menus interativos (botões, listas, enquetes):

```python
{
    "number": "5511999999999",
    "text": "Escolha uma área para consultoria:",
    "choices": [
        "💰 Financeiro",
        "📱 Marketing",
        "📊 Vendas",
        "👥 RH"
    ],
    "menu_type": "button",  # ou "list", "poll"
    "footer_text": "Falachefe Consultoria"
}
```

### FormatResponseTool

Formata respostas técnicas para WhatsApp:

```python
{
    "agent_response": "Resposta do especialista...",
    "format_type": "structured",  # text/structured/menu
    "add_greeting": true,
    "add_signature": true
}
```

## 📊 Tasks de Orquestração

### Task: `orchestrate_request`

**Input esperado:**
```python
{
    "user_request": "Demanda do usuário",
    "user_context": "Contexto da empresa/situação",
    "whatsapp_number": "5511999999999"
}
```

**Output esperado:**
```json
{
    "specialist": "financial_expert",
    "confidence": "high",
    "reasoning": "Demanda é sobre fluxo de caixa, área financeira",
    "context_for_specialist": "Cliente precisa organizar finanças..."
}
```

### Task: `format_and_send_response`

**Input esperado:**
```python
{
    "specialist_response": "Resposta completa do especialista",
    "specialist_type": "financial_expert",
    "whatsapp_number": "5511999999999",
    "conversation_context": "Contexto da conversa"
}
```

**Output esperado:**
```json
{
    "status": "success",
    "message_id": "ABC123",
    "timestamp": "2025-01-07T10:30:00",
    "format_type": "structured",
    "char_count": 450
}
```

## 🎯 Casos de Uso

### Caso 1: Consultoria Financeira Rápida

```python
crew.crew().kickoff(inputs={
    "user_request": "Quanto devo guardar de reserva de emergência?",
    "user_context": "Pequeno comércio, faturamento R$ 30k/mês",
    "whatsapp_number": "5511999999999",
    "user_id": "usr_001"
})
```

**Resultado:**
- Orquestrador → Identifica como Financeiro
- Financial Expert → Responde com cálculo e recomendações
- Support Agent → Formata e envia texto estruturado

### Caso 2: Estratégia de Marketing

```python
crew.crew().kickoff(inputs={
    "user_request": "Como divulgar meu restaurante no Instagram?",
    "user_context": "Restaurante local, orçamento R$ 300/mês",
    "whatsapp_number": "5511888888888",
    "user_id": "usr_002",
    "marketing_goal": "Aumentar visibilidade e pedidos delivery",
    "budget": "R$ 300/mês"
})
```

**Resultado:**
- Orquestrador → Marketing Expert
- Marketing Expert → Estratégia completa
- Support Agent → Divide em mensagens digestíveis ou menu interativo

### Caso 3: Problema Complexo (Multi-especialista)

```python
crew.crew().kickoff(inputs={
    "user_request": "Minha equipe está desmotivada e as vendas caindo",
    "user_context": "Empresa de software B2B, 12 funcionários",
    "whatsapp_number": "5511777777777",
    "user_id": "usr_003"
})
```

**Resultado:**
- Orquestrador → Identifica como multi-disciplinar
- HR Expert → Aborda motivação e gestão de pessoas
- Sales Expert → Analisa processo comercial
- Financial Expert → Verifica impacto financeiro
- Support Agent → Compila resposta integrada e envia

## ⚙️ Configuração Avançada

### Personalizar Comportamento do Orquestrador

Edite `config/agents.yaml`:

```yaml
orchestrator:
  role: >
    Seu papel customizado
  goal: >
    Seu objetivo customizado
  backstory: >
    Sua história customizada
  allow_delegation: true  # OBRIGATÓRIO para orquestração
```

### Adicionar Novos Especialistas

1. Adicione o agente em `config/agents.yaml`
2. Crie o método `@agent` em `crew.py`
3. Atualize a task `orchestrate_request` para incluir o novo especialista

### Customizar Formatação de Mensagens

Edite o `support_agent` em `config/agents.yaml` para mudar:
- Tom das mensagens
- Uso de emojis
- Estilo de formatação
- Assinatura padrão

## 🧪 Testes

### Teste Básico de Orquestração

```bash
cd crewai-projects/falachefe_crew
python -c "
from src.falachefe_crew.crew import FalachefeCrew

crew = FalachefeCrew()
result = crew.crew().kickoff(inputs={
    'user_request': 'Como fazer fluxo de caixa?',
    'user_context': 'PME',
    'whatsapp_number': '5511999999999',
    'user_id': 'test_user'
})
print(result)
"
```

### Teste de Integração com uazapi

**Pré-requisito:** Configure `UAZAPI_TOKEN` no `.env`

```bash
cd crewai-projects/falachefe_crew
python -c "
from src.falachefe_crew.tools.uazapi_tools import SendTextMessageTool

tool = SendTextMessageTool()
result = tool._run(
    number='5511999999999',
    text='Teste de integração Falachefe + uazapi'
)
print(result)
"
```

## 📝 Variáveis de Ambiente Necessárias

Crie um arquivo `.env` em `crewai-projects/falachefe_crew/`:

```env
# Configuração uazapi (WhatsApp)
UAZAPI_BASE_URL=https://free.uazapi.com
UAZAPI_TOKEN=seu_token_aqui

# Configuração API Falachefe
FALACHEFE_API_URL=http://localhost:3000

# Configuração LLM (para os agentes)
OPENAI_API_KEY=sk-...
# ou
ANTHROPIC_API_KEY=sk-ant-...
# ou
GOOGLE_API_KEY=...
```

## 🎨 Formatação de Mensagens WhatsApp

O `support_agent` formata automaticamente as mensagens seguindo estas diretrizes:

### Mensagem Curta (< 500 chars)

```
☀️ Bom dia!

Resposta direta e objetiva aqui.

---
🤝 *Falachefe Consultoria*
💼 Especialistas em Gestão para PMEs
📱 Atendimento via WhatsApp
```

### Mensagem Estruturada (500-2000 chars)

```
☀️ Boa tarde!

📋 *CONSULTORIA FALACHEFE*
──────────────────────────────

📊 *Análise da Situação*
Sua empresa...

💡 *Recomendações*
1. Ação 1
2. Ação 2
3. Ação 3

✅ *Próximos Passos*
- Passo 1
- Passo 2

──────────────────────────────

---
🤝 *Falachefe Consultoria*
💼 Especialistas em Gestão para PMEs
📱 Atendimento via WhatsApp
```

### Menu Interativo (quando há escolhas)

```
☀️ Bom dia!

Para te ajudar melhor, escolha uma área:

[Botões interativos no WhatsApp:]
💰 Financeiro
📱 Marketing  
📊 Vendas
👥 RH

---
🤝 Falachefe Consultoria
```

## 🔍 Monitoramento e Debug

### Logs Verbosos

O sistema está configurado com `verbose=True` em todos os agentes. Você verá:

```
> Entering new AgentExecutor chain...
[orchestrator] Analyzing user request...
[orchestrator] Identified specialist: financial_expert
[financial_expert] Processing financial query...
[support_agent] Formatting response...
[support_agent] Sending via uazapi...
```

### Verificar Status de Envio

Todas as ferramentas uazapi retornam JSON com:
- `success`: boolean
- `message_id`: ID da mensagem (se sucesso)
- `error`: mensagem de erro (se falha)

## 🚨 Tratamento de Erros

### Token uazapi Inválido

```json
{
    "success": false,
    "error": "Token da uazapi não configurado. Configure UAZAPI_TOKEN no ambiente."
}
```

**Solução:** Configure `UAZAPI_TOKEN` no `.env`

### Timeout na API

```json
{
    "success": false,
    "error": "Timeout ao enviar mensagem - servidor não respondeu"
}
```

**Solução:** Verifique conectividade com o servidor uazapi

### Número Inválido

```json
{
    "success": false,
    "error": "Erro ao enviar mensagem: 400",
    "details": "Invalid phone number format"
}
```

**Solução:** Use formato internacional: `5511999999999`

## 📚 Próximos Passos

1. **Integração com Webhook uazapi**
   - Receber mensagens dos usuários automaticamente
   - Processar com o crew
   - Responder automaticamente

2. **Memória de Conversas**
   - Implementar knowledge base com histórico
   - Contextualizar respostas baseado em interações anteriores

3. **Análise de Sentimento**
   - Identificar urgência nas mensagens
   - Priorizar atendimentos críticos

4. **Métricas e Dashboard**
   - Tempo médio de resposta
   - Especialista mais acionado
   - Taxa de satisfação

## 💡 Dicas e Boas Práticas

1. **Sempre teste com o token correto** configurado no `.env`
2. **Monitore os logs** para entender o fluxo de decisão
3. **Ajuste os prompts** dos agentes para melhor performance
4. **Use menu interativo** quando a resposta tiver múltiplas opções
5. **Mantenha mensagens concisas** - WhatsApp é mobile-first
6. **Adicione delay nas mensagens** para simular digitação humana
7. **Atualize informações do lead** após cada interação importante

## 🔗 Referências

- [Documentação CrewAI Hierarchical Process](https://docs.crewai.com/concepts/processes#hierarchical-process)
- [uazapi OpenAPI Spec](../../docs/technical/uazapi-openapi-spec.yaml)
- [CrewAI Tools](https://docs.crewai.com/concepts/tools)
- [Agent Delegation](https://docs.crewai.com/concepts/agents#delegation)

---

**Desenvolvido para Falachefe Consultoria**  
Sistema de Consultoria Multi-Agente com IA para PMEs Brasileiras

