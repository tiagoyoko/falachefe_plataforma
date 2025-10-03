# 📋 **Story 1.3: Agente Financeiro de Fluxo de Caixa**

## 🎯 **Story Statement**
Como **usuário do sistema**, quero **interagir com um agente especializado em finanças e fluxo de caixa** para que **possa gerenciar minhas despesas, receitas e análises financeiras** de forma inteligente via WhatsApp.

## 📝 **Descrição Detalhada**

### **Contexto**
O Agente Financeiro é o componente principal do Agent Squad Framework, especializado em gestão financeira e análise de fluxo de caixa. Ele processa mensagens do WhatsApp via UazAPI e fornece respostas inteligentes baseadas no contexto do usuário.

### **Objetivos**
- Implementar agente especializado em finanças
- Processar comandos de gestão financeira
- Manter contexto individual por usuário
- Integrar com sistema de memória
- Fornecer análises inteligentes

## ✅ **Acceptance Criteria**

### **AC1: Processamento de Comandos Financeiros**
- [ ] Reconhecer comandos de adicionar despesa
- [ ] Reconhecer comandos de adicionar receita
- [ ] Reconhecer comandos de criar categoria
- [ ] Reconhecer comandos de análise de fluxo de caixa
- [ ] Precisão de classificação > 85%

### **AC2: Gestão de Dados Financeiros**
- [ ] Salvar despesas com validação
- [ ] Salvar receitas com validação
- [ ] Gerenciar categorias personalizadas
- [ ] Calcular totais e médias
- [ ] Manter histórico de transações

### **AC3: Análises Inteligentes**
- [ ] Gerar análise de fluxo de caixa
- [ ] Identificar padrões de gastos
- [ ] Sugerir otimizações
- [ ] Calcular métricas financeiras
- [ ] Gerar relatórios personalizados

### **AC4: Integração e Performance**
- [ ] Integrar com sistema de memória
- [ ] Resposta em < 3 segundos
- [ ] Manter contexto entre conversas
- [ ] Tratamento de erros robusto
- [ ] Logs detalhados de operações

## 📋 **Tasks / Subtasks**

### **Task 1: Implementar Classificação de Intenções**
- [ ] Criar sistema de classificação LLM
- [ ] Implementar prompts especializados
- [ ] Configurar fallback para intenções não reconhecidas
- [ ] Testar precisão de classificação
- [ ] Otimizar prompts baseado em testes

### **Task 2: Implementar Gestão de Despesas**
- [ ] Criar extração de dados de despesas
- [ ] Implementar validação de valores
- [ ] Implementar validação de categorias
- [ ] Salvar no banco de dados
- [ ] Atualizar memória individual

### **Task 3: Implementar Gestão de Receitas**
- [ ] Criar extração de dados de receitas
- [ ] Implementar validação de valores
- [ ] Implementar validação de categorias
- [ ] Salvar no banco de dados
- [ ] Atualizar memória individual

### **Task 4: Implementar Sistema de Categorias**
- [ ] Criar CRUD de categorias
- [ ] Implementar categorias padrão
- [ ] Permitir categorias personalizadas
- [ ] Validar nomes de categorias
- [ ] Implementar hierarquia de categorias

### **Task 5: Implementar Análises Financeiras**
- [ ] Criar análise de fluxo de caixa
- [ ] Implementar cálculo de métricas
- [ ] Gerar insights automáticos
- [ ] Criar visualizações de dados
- [ ] Implementar relatórios personalizados

### **Task 6: Integração e Testes**
- [ ] Integrar com sistema de memória
- [ ] Integrar com UazAPI
- [ ] Implementar tratamento de erros
- [ ] Criar testes unitários
- [ ] Criar testes de integração

## 🔧 **Dev Notes**

### **Arquitetura do Agente Financeiro**

```typescript
// src/agents/financial/financial-agent.ts
export class FinancialAgent extends BaseAgent {
  private db: DrizzleClient
  private memoryManager: MemoryManager
  private uazClient: UAZClient
  private llmClient: OpenAI

  constructor(config: AgentConfig) {
    super({
      name: 'FinancialAgent',
      type: 'financial',
      capabilities: [
        'expense_tracking',
        'revenue_tracking',
        'category_management',
        'cashflow_analysis',
        'financial_insights'
      ],
      memory: {
        individual: true,
        shared: false
      },
      streaming: true
    })
  }

  async process(message: string, context: AgentContext): Promise<AgentResponse> {
    // 1. Classificar intenção
    const intent = await this.classifyIntent(message)
    
    // 2. Processar baseado na intenção
    switch (intent) {
      case 'add_expense':
        return await this.addExpense(message, context)
      case 'add_revenue':
        return await this.addRevenue(message, context)
      case 'create_category':
        return await this.createCategory(message, context)
      case 'cashflow_analysis':
        return await this.analyzeCashFlow(message, context)
      default:
        return await this.generalFinancialQuery(message, context)
    }
  }
}
```

### **Sistema de Classificação de Intenções**

```typescript
// src/agents/financial/intent-classifier.ts
export class IntentClassifier {
  private llmClient: OpenAI
  private prompts: Record<string, string>

  constructor() {
    this.llmClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    })
    
    this.prompts = {
      classification: `
        Classifique a intenção da seguinte mensagem financeira:
        "{message}"

        Opções disponíveis:
        - add_expense: Adicionar despesa
        - add_revenue: Adicionar receita
        - create_category: Criar categoria
        - delete_category: Deletar categoria
        - cashflow_analysis: Análise de fluxo de caixa
        - budget_planning: Planejamento orçamentário
        - general_query: Consulta geral

        Responda apenas com a intenção classificada.
      `,
      expense_extraction: `
        Extraia os dados da seguinte despesa:
        "{message}"

        Retorne em formato JSON:
        {
          "amount": valor_numerico,
          "category": "nome_da_categoria",
          "description": "descrição_da_despesa",
          "date": "YYYY-MM-DD" (opcional, padrão hoje)
        }
      `
    }
  }

  async classifyIntent(message: string): Promise<string> {
    const response = await this.llmClient.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'user',
        content: this.prompts.classification.replace('{message}', message)
      }],
      temperature: 0.1,
      max_tokens: 50
    })

    return response.choices[0].message.content?.trim().toLowerCase() || 'general_query'
  }
}
```

### **Gestão de Despesas e Receitas**

```typescript
// src/agents/financial/expense-manager.ts
export class ExpenseManager {
  private db: DrizzleClient
  private memoryManager: MemoryManager

  async addExpense(message: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // 1. Extrair dados da mensagem
      const expenseData = await this.extractExpenseData(message)
      
      // 2. Validar dados
      const validation = this.validateExpenseData(expenseData)
      if (!validation.isValid) {
        return {
          response: `❌ ${validation.error}`,
          confidence: 0.8,
          shouldStream: false
        }
      }

      // 3. Salvar no banco
      const expense = await this.db.insert(expenses).values({
        userId: context.userId,
        amount: expenseData.amount,
        category: expenseData.category,
        description: expenseData.description,
        date: expenseData.date || new Date(),
        createdAt: new Date()
      }).returning()

      // 4. Atualizar memória individual
      await this.updateIndividualMemory(context.conversationId, {
        lastExpense: expense[0],
        totalExpenses: await this.getTotalExpenses(context.userId),
        monthlyExpenses: await this.getMonthlyExpenses(context.userId)
      })

      // 5. Gerar resposta personalizada
      const response = await this.generatePersonalizedResponse('expense_added', {
        expense: expense[0],
        user: context.user,
        context: await this.getFinancialContext(context.userId)
      })

      return {
        response,
        confidence: 0.95,
        shouldStream: true,
        data: expense[0]
      }

    } catch (error) {
      console.error('Erro ao adicionar despesa:', error)
      return {
        response: '❌ Ocorreu um erro ao processar sua despesa. Tente novamente.',
        confidence: 0.3,
        shouldStream: false
      }
    }
  }

  private async extractExpenseData(message: string): Promise<ExpenseData> {
    const response = await this.llmClient.chat.completions.create({
      model: 'gpt-4',
      messages: [{
        role: 'user',
        content: this.prompts.expense_extraction.replace('{message}', message)
      }],
      temperature: 0.1,
      max_tokens: 200
    })

    return JSON.parse(response.choices[0].message.content || '{}')
  }
}
```

### **Análise de Fluxo de Caixa**

```typescript
// src/agents/financial/cashflow-analyzer.ts
export class CashFlowAnalyzer {
  private db: DrizzleClient
  private memoryManager: MemoryManager

  async analyzeCashFlow(message: string, context: AgentContext): Promise<AgentResponse> {
    try {
      // 1. Buscar dados financeiros
      const financialData = await this.getFinancialData(context.userId)
      
      // 2. Calcular métricas
      const metrics = this.calculateMetrics(financialData)
      
      // 3. Gerar insights usando LLM
      const insights = await this.generateInsights(financialData, metrics)
      
      // 4. Atualizar memória compartilhada
      await this.updateSharedMemory(context.conversationId, {
        lastAnalysis: insights,
        analysisDate: new Date(),
        metrics
      })

      // 5. Gerar resposta formatada
      const response = this.formatAnalysisResponse(insights, metrics)

      return {
        response,
        confidence: 0.9,
        shouldStream: true,
        data: { insights, metrics }
      }

    } catch (error) {
      console.error('Erro na análise de fluxo de caixa:', error)
      return {
        response: '❌ Erro ao gerar análise financeira. Tente novamente.',
        confidence: 0.3,
        shouldStream: false
      }
    }
  }

  private async generateInsights(data: FinancialData, metrics: FinancialMetrics): Promise<string> {
    const prompt = `
      Analise os seguintes dados financeiros e gere insights úteis:
      
      Receitas: R$ ${metrics.totalRevenue}
      Despesas: R$ ${metrics.totalExpenses}
      Saldo: R$ ${metrics.balance}
      Margem: ${metrics.margin}%
      
      Categorias com maior gasto:
      ${metrics.topExpenseCategories.map(cat => `- ${cat.name}: R$ ${cat.amount}`).join('\n')}
      
      Tendências:
      - Receitas: ${metrics.revenueTrend}
      - Despesas: ${metrics.expenseTrend}
      
      Gere insights práticos e sugestões de melhoria em português brasileiro.
    `

    const response = await this.llmClient.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    })

    return response.choices[0].message.content || 'Análise não disponível'
  }
}
```

### **Schema do Banco de Dados**

```sql
-- Tabela de despesas
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de receitas
CREATE TABLE revenues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabela de categorias personalizadas
CREATE TABLE financial_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('expense', 'revenue')),
  color VARCHAR(7), -- hex color
  icon VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, name, type)
);

-- Índices para performance
CREATE INDEX idx_expenses_user_id ON expenses(user_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_revenues_user_id ON revenues(user_id);
CREATE INDEX idx_revenues_date ON revenues(date);
CREATE INDEX idx_revenues_category ON revenues(category);
CREATE INDEX idx_financial_categories_user_id ON financial_categories(user_id);
```

## 🧪 **Testing**

### **Testes Unitários**
- [ ] Testar classificação de intenções
- [ ] Testar extração de dados financeiros
- [ ] Testar validação de dados
- [ ] Testar cálculos de métricas
- [ ] Testar geração de insights

### **Testes de Integração**
- [ ] Testar integração com banco de dados
- [ ] Testar integração com sistema de memória
- [ ] Testar integração com UazAPI
- [ ] Testar fluxo completo de processamento

### **Testes de Performance**
- [ ] Testar tempo de resposta < 3 segundos
- [ ] Testar processamento de múltiplas mensagens
- [ ] Testar uso de memória
- [ ] Testar escalabilidade

## 📊 **Definition of Done**

- [ ] Agente financeiro implementado e funcionando
- [ ] Classificação de intenções com precisão > 85%
- [ ] Gestão de despesas e receitas funcionando
- [ ] Análise de fluxo de caixa implementada
- [ ] Integração com sistema de memória
- [ ] Testes unitários e de integração passando
- [ ] Performance dentro dos parâmetros
- [ ] Documentação atualizada

## 📈 **Estimativas**

- **Story Points**: 21
- **Tempo Estimado**: 3-4 dias
- **Prioridade**: Alta
- **Dependências**: Story 1.2 (Sistema de Memória)
- **Complexidade**: Muito Alta

## 👥 **Responsáveis**

- **Backend Developer**: Implementação principal
- **AI Specialist**: Otimização de prompts e LLM
- **Tech Lead**: Revisão e validação

## 🔗 **Dependências**

- **Entrada**: Story 1.2 concluída
- **Saída**: Agente financeiro funcional
- **Bloqueadores**: Configuração OpenAI API

---

**Status**: Ready for Development
**Criado em**: Janeiro 2025
**Última atualização**: Janeiro 2025
**Responsável**: Sarah (Product Owner)
**Desenvolvedor**: James (Full Stack Developer)
