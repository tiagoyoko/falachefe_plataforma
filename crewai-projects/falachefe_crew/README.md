# Falachefe CrewAI

> **Plataforma de Consultoria Multi-Agente com IA para Pequenos e Médios Empresários Brasileiros**

## 🎯 Visão Geral

O Falachefe é uma plataforma de chat multi-agente com especialistas de IA em:
- **💰 Finanças** - Gestão de fluxo de caixa e consultoria financeira
- **📱 Marketing** - Estratégias de marketing digital para PMEs
- **🤝 Vendas** - Estruturação de processos comerciais
- **👥 RH** - Gestão de pessoas e legislação trabalhista brasileira

## 🤖 Agentes Especialistas

### Financial Expert (Especialista Financeiro)
**Responsabilidade principal:** Ajudar empresários a criar e gerenciar fluxo de caixa

**Capacidades:**
- ✅ Criar o primeiro fluxo de caixa da empresa
- ✅ Atualizar registros de entradas e saídas
- ✅ Analisar resultados financeiros
- ✅ Fornecer conselhos práticos de gestão financeira
- ✅ Identificar oportunidades de melhoria

### Marketing Expert (Especialista em Marketing)
**Responsabilidade principal:** Desenvolver estratégias de marketing digital eficazes

**Capacidades:**
- 📊 Criar estratégias de marketing com orçamento limitado
- 🎯 Definir público-alvo e personas
- 📱 Otimizar presença em redes sociais
- 💡 Sugerir campanhas com alto ROI
- 📈 Definir métricas e KPIs de marketing

### Sales Expert (Especialista em Vendas)
**Responsabilidade principal:** Estruturar e otimizar processos de vendas

**Capacidades:**
- 🎯 Criar funil de vendas estruturado
- 📞 Desenvolver estratégias de prospecção
- 💬 Criar scripts de vendas
- 🤝 Técnicas de fechamento e negociação
- 📊 Definir KPIs comerciais

### HR Expert (Especialista em RH)
**Responsabilidade principal:** Gestão de pessoas e conformidade trabalhista

**Capacidades:**
- 📋 Orientação sobre contratação e demissão
- ⚖️ Compliance com legislação brasileira (CLT, eSocial)
- 👥 Gestão de equipes
- 📝 Processos de RH para PMEs
- 🎓 Treinamento e desenvolvimento

## 🚀 Como Usar

### Instalação

```bash
# Navegar para o diretório do projeto
cd crewai-projects/falachefe_crew

# Instalar dependências
crewai install
```

### Executar

```bash
# Executar exemplo completo
crewai run

# Testar com 2 iterações
crewai test -n 2 -m gpt-4o-mini

# Treinar a crew
crewai train -n 5 -f training_data.pkl
```

### Executar via Python

```python
from falachefe_crew.crew import FalachefeCrew

# Criar inputs
inputs = {
    'user_id': 'empresa_123',
    'company_context': 'Pequena loja, 3 funcionários',
    'question': 'Como criar meu fluxo de caixa?',
    # ... outros inputs
}

# Executar crew
result = FalachefeCrew().crew().kickoff(inputs=inputs)
print(result)
```

## 📊 Tasks Disponíveis

### Área Financeira
- **create_cashflow** - Criar primeiro fluxo de caixa
- **update_cashflow** - Registrar movimentações
- **analyze_cashflow** - Analisar resultados
- **financial_advice** - Consultoria financeira geral

### Área de Marketing
- **marketing_strategy** - Desenvolver estratégia de marketing

### Área de Vendas
- **sales_process** - Estruturar processo de vendas

### Área de RH
- **hr_guidance** - Orientação sobre RH e legislação

### Consultoria Integrada
- **business_consultation** - Consultoria multi-disciplinar

## 🎓 Exemplo de Uso - Fluxo de Caixa

### 1. Criar Fluxo de Caixa

```python
inputs = {
    'user_id': 'empresa_001',
    'company_context': 'Loja de roupas, 3 funcionários, R$ 30k/mês'
}

crew = FalachefeCrew()
# A crew irá guiar o empresário na criação do fluxo de caixa
```

### 2. Registrar Movimentação

```python
inputs = {
    'user_id': 'empresa_001',
    'transaction_type': 'saída',
    'transaction_data': {
        'valor': 3000,
        'categoria': 'aluguel',
        'data': '2025-01-05'
    }
}
```

### 3. Analisar Resultados

```python
inputs = {
    'user_id': 'empresa_001',
    'period': 'Janeiro 2025',
    'cashflow_data': {
        'entradas': {'vendas': 28500},
        'saidas': {
            'aluguel': 3000,
            'salarios': 6000,
            'fornecedores': 12000
        }
    }
}
# Receberá análise detalhada com recomendações
```

## 🔧 Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_MODEL_NAME=gpt-4o-mini

# CrewAI (opcional)
CREWAI_VERBOSE=true
CREWAI_DEBUG=false
```

### Customização de Agentes

Edite `src/falachefe_crew/config/agents.yaml` para customizar:
- Role (papel)
- Goal (objetivo)
- Backstory (história de fundo)

### Customização de Tasks

Edite `src/falachefe_crew/config/tasks.yaml` para customizar:
- Description (descrição)
- Expected Output (saída esperada)
- Agent (agente responsável)

## 📚 Documentação CrewAI

- [Agents](https://docs.crewai.com/concepts/agents)
- [Tasks](https://docs.crewai.com/concepts/tasks)
- [Crews](https://docs.crewai.com/concepts/crews)
- [Tools](https://docs.crewai.com/concepts/tools)
- [Knowledge](https://docs.crewai.com/concepts/knowledge)

## 🤝 Contribuindo

Este é um projeto em desenvolvimento ativo. Sugestões e melhorias são bem-vindas!

## 📄 Licença

Propriedade de Falachefe - Todos os direitos reservados

---

**Desenvolvido com ❤️ para pequenos e médios empresários brasileiros**
