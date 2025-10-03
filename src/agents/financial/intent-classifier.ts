/**
 * Intent Classifier - LLM-based intent classification for financial operations
 * Based on AWS Labs Agent Squad Framework
 */

import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'

export interface IntentClassificationResult {
  intent: string
  confidence: number
  extractedData?: Record<string, any>
  reasoning?: string
}

export interface ExpenseData {
  amount: number
  category: string
  description: string
  date?: Date
  metadata?: Record<string, any>
}

export interface RevenueData {
  amount: number
  category: string
  description: string
  date?: Date
  metadata?: Record<string, any>
}

export class IntentClassifier {
  private llmClient: typeof openai
  private prompts: Record<string, string>

  constructor() {
    this.llmClient = openai
    
    this.prompts = {
      classification: `
        Você é um especialista em classificação de intenções financeiras. 
        Classifique a seguinte mensagem do usuário e determine qual ação financeira ele deseja realizar.

        Mensagem: "{message}"

        Opções disponíveis:
        - add_expense: Adicionar despesa/gasto
        - add_revenue: Adicionar receita/faturamento
        - create_category: Criar nova categoria
        - delete_category: Deletar categoria
        - cashflow_analysis: Análise de fluxo de caixa
        - budget_planning: Planejamento orçamentário
        - financial_query: Consulta geral sobre finanças
        - category_list: Listar categorias disponíveis
        - expense_list: Listar despesas
        - revenue_list: Listar receitas
        - financial_summary: Resumo financeiro

        Responda APENAS com o nome da intenção em formato JSON:
        {
          "intent": "nome_da_intenção",
          "confidence": 0.95,
          "reasoning": "explicação_breve"
        }
      `,
      
      expense_extraction: `
        Extraia os dados financeiros da seguinte mensagem de despesa:
        "{message}"

        Retorne em formato JSON:
        {
          "amount": valor_numerico,
          "category": "nome_da_categoria",
          "description": "descrição_da_despesa",
          "date": "YYYY-MM-DD" (opcional, padrão hoje),
          "metadata": {}
        }

        Categorias disponíveis: alimentação, transporte, saúde, educação, lazer, serviços, produtos, outros
      `,
      
      revenue_extraction: `
        Extraia os dados financeiros da seguinte mensagem de receita:
        "{message}"

        Retorne em formato JSON:
        {
          "amount": valor_numerico,
          "category": "nome_da_categoria",
          "description": "descrição_da_receita",
          "date": "YYYY-MM-DD" (opcional, padrão hoje),
          "metadata": {}
        }

        Categorias disponíveis: vendas, consultoria, serviços, produtos, investimentos, outros
      `,
      
      category_extraction: `
        Extraia os dados da categoria da seguinte mensagem:
        "{message}"

        Retorne em formato JSON:
        {
          "name": "nome_da_categoria",
          "type": "expense" ou "revenue",
          "color": "#hex_color" (opcional),
          "icon": "nome_do_icone" (opcional),
          "description": "descrição_da_categoria" (opcional)
        }
      `
    }
  }

  async classifyIntent(message: string): Promise<IntentClassificationResult> {
    try {
      const { text } = await generateText({
        model: this.llmClient('gpt-4'),
        prompt: this.prompts.classification.replace('{message}', message),
        temperature: 0.1
      })

      if (!text) {
        throw new Error('Empty response from LLM')
      }

      const result = JSON.parse(text)
      
      return {
        intent: result.intent || 'financial_query',
        confidence: result.confidence || 0.5,
        reasoning: result.reasoning || 'No reasoning provided'
      }

    } catch (error) {
      console.error('Error in intent classification:', error)
      
      // Fallback to simple keyword matching
      return this.fallbackClassification(message)
    }
  }

  async extractExpenseData(message: string): Promise<ExpenseData> {
    try {
      const { text } = await generateText({
        model: this.llmClient('gpt-4'),
        prompt: this.prompts.expense_extraction.replace('{message}', message),
        temperature: 0.1
      })

      if (!text) {
        throw new Error('Empty response from LLM')
      }

      const data = JSON.parse(text)
      
      return {
        amount: data.amount || 0,
        category: data.category || 'outros',
        description: data.description || 'Despesa sem descrição',
        date: data.date ? new Date(data.date) : new Date(),
        metadata: data.metadata || {}
      }

    } catch (error) {
      console.error('Error in expense data extraction:', error)
      
      // Fallback to simple extraction
      return this.fallbackExpenseExtraction(message)
    }
  }

  async extractRevenueData(message: string): Promise<RevenueData> {
    try {
      const { text } = await generateText({
        model: this.llmClient('gpt-4'),
        prompt: this.prompts.revenue_extraction.replace('{message}', message),
        temperature: 0.1
      })

      if (!text) {
        throw new Error('Empty response from LLM')
      }

      const data = JSON.parse(text)
      
      return {
        amount: data.amount || 0,
        category: data.category || 'vendas',
        description: data.description || 'Receita sem descrição',
        date: data.date ? new Date(data.date) : new Date(),
        metadata: data.metadata || {}
      }

    } catch (error) {
      console.error('Error in revenue data extraction:', error)
      
      // Fallback to simple extraction
      return this.fallbackRevenueExtraction(message)
    }
  }

  async extractCategoryData(message: string): Promise<Record<string, any>> {
    try {
      const { text } = await generateText({
        model: this.llmClient('gpt-4'),
        prompt: this.prompts.category_extraction.replace('{message}', message),
        temperature: 0.1
      })

      if (!text) {
        throw new Error('Empty response from LLM')
      }

      return JSON.parse(text)

    } catch (error) {
      console.error('Error in category data extraction:', error)
      
      // Fallback to simple extraction
      return this.fallbackCategoryExtraction(message)
    }
  }

  private fallbackClassification(message: string): IntentClassificationResult {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('despesa') || lowerMessage.includes('gasto') || lowerMessage.includes('pagamento')) {
      return {
        intent: 'add_expense',
        confidence: 0.7,
        reasoning: 'Keyword matching: despesa/gasto/pagamento'
      }
    }
    
    if (lowerMessage.includes('receita') || lowerMessage.includes('venda') || lowerMessage.includes('faturamento')) {
      return {
        intent: 'add_revenue',
        confidence: 0.7,
        reasoning: 'Keyword matching: receita/venda/faturamento'
      }
    }
    
    if (lowerMessage.includes('fluxo de caixa') || lowerMessage.includes('caixa') || lowerMessage.includes('saldo')) {
      return {
        intent: 'cashflow_analysis',
        confidence: 0.7,
        reasoning: 'Keyword matching: fluxo de caixa/caixa/saldo'
      }
    }
    
    if (lowerMessage.includes('orçamento') || lowerMessage.includes('planejamento') || lowerMessage.includes('meta')) {
      return {
        intent: 'budget_planning',
        confidence: 0.7,
        reasoning: 'Keyword matching: orçamento/planejamento/meta'
      }
    }
    
    return {
      intent: 'financial_query',
      confidence: 0.3,
      reasoning: 'Fallback to general financial query'
    }
  }

  private fallbackExpenseExtraction(message: string): ExpenseData {
    const amountMatch = message.match(/r\$\s*(\d+(?:,\d{2})?)/i)
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0
    
    const description = this.extractDescription(message)
    const category = this.extractCategory(message) || 'outros'
    
    return {
      amount,
      category,
      description,
      date: new Date(),
      metadata: {}
    }
  }

  private fallbackRevenueExtraction(message: string): RevenueData {
    const amountMatch = message.match(/r\$\s*(\d+(?:,\d{2})?)/i)
    const amount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : 0
    
    const description = this.extractDescription(message)
    const category = this.extractCategory(message) || 'vendas'
    
    return {
      amount,
      category,
      description,
      date: new Date(),
      metadata: {}
    }
  }

  private fallbackCategoryExtraction(message: string): Record<string, any> {
    const words = message.split(' ').filter(word => 
      !['criar', 'nova', 'categoria', 'para', 'de', 'da', 'do'].includes(word.toLowerCase())
    )
    
    return {
      name: words.join(' ').toLowerCase(),
      type: 'expense',
      color: '#3B82F6',
      icon: 'folder',
      description: `Categoria ${words.join(' ')}`
    }
  }

  private extractDescription(message: string): string {
    const words = message.split(' ')
    const descriptionWords = words.filter(word => 
      !word.match(/r\$\s*\d+/i) && 
      !word.match(/\d+/i) &&
      !['despesa', 'receita', 'adicionar', 'para', 'de', 'da', 'do', 'criar', 'nova', 'categoria'].includes(word.toLowerCase())
    )
    
    return descriptionWords.join(' ') || 'Transação sem descrição'
  }

  private extractCategory(message: string): string | null {
    const lowerMessage = message.toLowerCase()
    const categories = [
      'alimentação', 'transporte', 'saúde', 'educação', 'lazer', 
      'serviços', 'produtos', 'vendas', 'consultoria', 'investimentos'
    ]
    
    for (const category of categories) {
      if (lowerMessage.includes(category)) {
        return category
      }
    }
    
    return null
  }
}

export default IntentClassifier
