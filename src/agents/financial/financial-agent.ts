/**
 * Financial Agent - Specialized agent for financial operations
 * Based on AWS Labs Agent Squad Framework
 */

import { BaseAgent, AgentResponse } from '../core/types'
import { AgentConfig } from '../../types'
import { MemorySystem } from '../core/memory-system'
import IntentClassifier from './intent-classifier'
import ExpenseManager from './expense-manager'
import CashFlowAnalyzer from './cashflow-analyzer'
import CategoryManager from './category-manager'

export interface FinancialData {
  id: string
  type: 'expense' | 'revenue'
  amount: number
  description: string
  category: string
  date: Date
  userId: string
  metadata?: Record<string, any>
  createdAt: Date
  updatedAt: Date
}

export interface CashFlowAnalysis {
  period: {
    start: Date
    end: Date
  }
  summary: {
    totalRevenue: number
    totalExpenses: number
    netCashFlow: number
    margin: number
  }
  trends: {
    revenueTrend: 'increasing' | 'decreasing' | 'stable'
    expenseTrend: 'increasing' | 'decreasing' | 'stable'
    netTrend: 'increasing' | 'decreasing' | 'stable'
  }
  insights: string[]
  recommendations: string[]
  categoryBreakdown: Array<{
    category: string
    amount: number
    percentage: number
    trend: 'up' | 'down' | 'stable'
  }>
  monthlyBreakdown: Array<{
    month: string
    revenue: number
    expenses: number
    net: number
    margin: number
  }>
}

export class FinancialAgent extends BaseAgent {
  public id: string
  public type: string = 'financial'
  public isActive: boolean
  private intentClassifier: IntentClassifier
  private expenseManager: ExpenseManager
  private cashFlowAnalyzer: CashFlowAnalyzer
  private categoryManager: CategoryManager
  private memoryManager: MemorySystem
  private capabilities: string[]
  private categories: string[] = [
    'alimentação',
    'transporte',
    'saúde',
    'educação',
    'lazer',
    'serviços',
    'produtos',
    'vendas',
    'consultoria',
    'investimentos',
    'outros'
  ]

  constructor(config: AgentConfig, memoryManager: MemorySystem) {
    super()
    
    this.id = config.id || 'financial-agent'
    this.isActive = true
    
    this.capabilities = [
      'add_expense',
      'add_revenue',
      'create_category',
      'delete_category',
      'cashflow_analysis',
      'budget_planning',
      'financial_query',
      'category_list',
      'expense_list',
      'revenue_list',
      'financial_summary'
    ]
    
    this.memoryManager = memoryManager
    this.intentClassifier = new IntentClassifier()
    this.expenseManager = new ExpenseManager(memoryManager)
    this.cashFlowAnalyzer = new CashFlowAnalyzer(this.expenseManager, memoryManager)
    this.categoryManager = new CategoryManager(memoryManager)
  }

  public async processMessage(
    message: string,
    context: Record<string, any>
  ): Promise<AgentResponse> {
    const startTime = Date.now()
    
    try {
      // Simplified intent classification without LLM for now
      const lowerMessage = message.toLowerCase()
      let intent: string
      let confidence: number = 0.8

      if (lowerMessage.includes('despesa') || lowerMessage.includes('gasto') || lowerMessage.includes('pagamento')) {
        intent = 'add_expense'
      } else if (lowerMessage.includes('receita') || lowerMessage.includes('venda') || lowerMessage.includes('faturamento')) {
        intent = 'add_revenue'
      } else if (lowerMessage.includes('fluxo de caixa') || lowerMessage.includes('caixa') || lowerMessage.includes('saldo')) {
        intent = 'cashflow_analysis'
      } else if (lowerMessage.includes('orçamento') || lowerMessage.includes('budget')) {
        intent = 'budget_planning'
      } else {
        intent = 'financial_query'
      }

      let response: string

      switch (intent) {
        case 'add_expense':
          response = await this.handleAddExpense(message, context)
          confidence = Math.max(confidence, 0.9)
          break
          
        case 'add_revenue':
          response = await this.handleAddRevenue(message, context)
          confidence = Math.max(confidence, 0.9)
          break
          
        case 'create_category':
          response = await this.handleCreateCategory(message, context)
          confidence = Math.max(confidence, 0.8)
          break
          
        case 'delete_category':
          response = await this.handleDeleteCategory(message, context)
          confidence = Math.max(confidence, 0.8)
          break
          
        case 'cashflow_analysis':
          response = await this.handleCashFlowAnalysis(message, context)
          confidence = Math.max(confidence, 0.85)
          break
          
        case 'budget_planning':
          response = await this.handleBudgetPlanning(message, context)
          confidence = Math.max(confidence, 0.8)
          break
          
        case 'category_list':
          response = await this.handleCategoryList(message, context)
          confidence = Math.max(confidence, 0.9)
          break
          
        case 'expense_list':
          response = await this.handleExpenseList(message, context)
          confidence = Math.max(confidence, 0.8)
          break
          
        case 'revenue_list':
          response = await this.handleRevenueList(message, context)
          confidence = Math.max(confidence, 0.8)
          break
          
        case 'financial_summary':
          response = await this.handleFinancialSummary(message, context)
          confidence = Math.max(confidence, 0.8)
          break
          
        case 'financial_query':
          response = await this.handleFinancialQuery(message, context)
          confidence = Math.max(confidence, 0.7)
          break
          
        default:
          response = 'Não entendi sua solicitação financeira. Posso ajudar com despesas, receitas, análise de fluxo de caixa ou planejamento orçamentário.'
          confidence = 0.3
      }

      return {
        agentId: this.id,
        response,
        confidence,
        processingTime: Date.now() - startTime,
        metadata: {
          intent,
          reasoning: classification.reasoning,
          financialDataCount: await this.getFinancialDataCount(context.userId)
        }
      }

    } catch (error) {
      console.error('Error in financial agent:', error)
      return {
        agentId: this.id,
        response: 'Desculpe, ocorreu um erro ao processar sua solicitação financeira. Tente novamente.',
        confidence: 0,
        processingTime: Date.now() - startTime,
        metadata: { error: error instanceof Error ? error.message : 'Unknown error' }
      }
    }
  }

  public isAvailable(): boolean {
    return this.isActive
  }

  private async handleAddExpense(message: string, context: Record<string, any>): Promise<string> {
    try {
      // Extract expense data using LLM
      const expenseData = await this.intentClassifier.extractExpenseData(message)
      
      // Add expense using expense manager
      const result = await this.expenseManager.addExpense(message, context, expenseData)
      
      if (!result.success) {
        return `❌ ${result.error}`
      }

      const expense = result.data!
      
      return `✅ Despesa adicionada com sucesso!\n\n💰 Valor: R$ ${expense.amount.toFixed(2)}\n📝 Descrição: ${expense.description}\n📂 Categoria: ${expense.category}\n📅 Data: ${expense.date.toLocaleDateString('pt-BR')}`
      
    } catch (error) {
      console.error('Error handling add expense:', error)
      return '❌ Erro ao processar despesa. Tente novamente.'
    }
  }

  private async handleAddRevenue(message: string, context: Record<string, any>): Promise<string> {
    try {
      // Extract revenue data using LLM
      const revenueData = await this.intentClassifier.extractRevenueData(message)
      
      // Add revenue using expense manager
      const result = await this.expenseManager.addRevenue(message, context, revenueData)
      
      if (!result.success) {
        return `❌ ${result.error}`
      }

      const revenue = result.data!
      
      return `✅ Receita adicionada com sucesso!\n\n💰 Valor: R$ ${revenue.amount.toFixed(2)}\n📝 Descrição: ${revenue.description}\n📂 Categoria: ${revenue.category}\n📅 Data: ${revenue.date.toLocaleDateString('pt-BR')}`
      
    } catch (error) {
      console.error('Error handling add revenue:', error)
      return '❌ Erro ao processar receita. Tente novamente.'
    }
  }

  private async handleCreateCategory(message: string, context: Record<string, any>): Promise<string> {
    try {
      const categoryData = await this.intentClassifier.extractCategoryData(message)
      
      const result = await this.categoryManager.createCategory(message, context, {
        name: categoryData.name,
        description: categoryData.description,
        color: categoryData.color
      })
      
      if (result.success) {
        return `✅ Categoria "${categoryData.name}" criada com sucesso!\n\n📂 Nome: ${categoryData.name}\n🎨 Cor: ${categoryData.color || '#3B82F6'}\n📝 Descrição: ${categoryData.description || 'Sem descrição'}`
      } else {
        return `❌ ${result.error}`
      }
      
    } catch (error) {
      console.error('Error handling create category:', error)
      return '❌ Erro ao criar categoria. Tente novamente.'
    }
  }

  private async handleDeleteCategory(message: string, context: Record<string, any>): Promise<string> {
    try {
      const categoryData = await this.intentClassifier.extractCategoryData(message)
      
      const result = await this.categoryManager.deleteCategory(message, context, categoryData.name)
      
      if (result.success) {
        return `✅ Categoria "${categoryData.name}" removida com sucesso!`
      } else {
        return `❌ ${result.error}`
      }
      
    } catch (error) {
      console.error('Error handling delete category:', error)
      return '❌ Erro ao remover categoria. Tente novamente.'
    }
  }

  private async handleCategoryList(message: string, context: Record<string, any>): Promise<string> {
    try {
      const categories = await this.categoryManager.getCategories(context.userId)
      
      if (categories.length === 0) {
        return '📂 Nenhuma categoria encontrada. Use "criar categoria [nome]" para adicionar novas categorias.'
      }
      
      const expenseCategories = categories.filter(cat => 
        ['alimentação', 'transporte', 'saúde', 'educação', 'lazer', 'serviços', 'produtos', 'outros'].includes(cat.name)
      )
      
      const revenueCategories = categories.filter(cat => 
        ['vendas', 'consultoria', 'investimentos', 'outros'].includes(cat.name)
      )
      
      let response = `📂 **Categorias Disponíveis**\n\n`
      
      if (expenseCategories.length > 0) {
        response += `💸 **Despesas:**\n${expenseCategories.map(cat => `• ${cat.name}${cat.color ? ` (${cat.color})` : ''}`).join('\n')}\n\n`
      }
      
      if (revenueCategories.length > 0) {
        response += `💰 **Receitas:**\n${revenueCategories.map(cat => `• ${cat.name}${cat.color ? ` (${cat.color})` : ''}`).join('\n')}\n\n`
      }
      
      response += `💡 **Dica:** Use "criar categoria [nome]" para adicionar novas categorias.`
      
      return response
      
    } catch (error) {
      console.error('Error handling category list:', error)
      return '❌ Erro ao listar categorias. Tente novamente.'
    }
  }

  private async handleExpenseList(message: string, context: Record<string, any>): Promise<string> {
    try {
      const expenses = await this.expenseManager.getFinancialData(context.userId)
      const expenseList = expenses.filter(item => item.type === 'expense').slice(0, 10)
      
      if (expenseList.length === 0) {
        return '📋 Nenhuma despesa registrada ainda.'
      }
      
      let response = `📋 **Últimas Despesas**\n\n`
      
      expenseList.forEach((expense, index) => {
        response += `${index + 1}. 💸 R$ ${expense.amount.toFixed(2)} - ${expense.description}\n`
        response += `   📂 ${expense.category} | 📅 ${expense.date.toLocaleDateString('pt-BR')}\n\n`
      })
      
      if (expenses.filter(item => item.type === 'expense').length > 10) {
        response += `... e mais ${expenses.filter(item => item.type === 'expense').length - 10} despesas.`
      }
      
      return response
      
    } catch (error) {
      console.error('Error handling expense list:', error)
      return '❌ Erro ao listar despesas. Tente novamente.'
    }
  }

  private async handleRevenueList(message: string, context: Record<string, any>): Promise<string> {
    try {
      const revenues = await this.expenseManager.getFinancialData(context.userId)
      const revenueList = revenues.filter(item => item.type === 'revenue').slice(0, 10)
      
      if (revenueList.length === 0) {
        return '📋 Nenhuma receita registrada ainda.'
      }
      
      let response = `📋 **Últimas Receitas**\n\n`
      
      revenueList.forEach((revenue, index) => {
        response += `${index + 1}. 💰 R$ ${revenue.amount.toFixed(2)} - ${revenue.description}\n`
        response += `   📂 ${revenue.category} | 📅 ${revenue.date.toLocaleDateString('pt-BR')}\n\n`
      })
      
      if (revenues.filter(item => item.type === 'revenue').length > 10) {
        response += `... e mais ${revenues.filter(item => item.type === 'revenue').length - 10} receitas.`
      }
      
      return response
      
    } catch (error) {
      console.error('Error handling revenue list:', error)
      return '❌ Erro ao listar receitas. Tente novamente.'
    }
  }

  private async handleFinancialSummary(message: string, context: Record<string, any>): Promise<string> {
    try {
      const metrics = await this.expenseManager.calculateMetrics(context.userId)
      
      let response = `📊 **Resumo Financeiro**\n\n`
      response += `💰 **Receitas:** R$ ${metrics.totalRevenue.toFixed(2)}\n`
      response += `💸 **Despesas:** R$ ${metrics.totalExpenses.toFixed(2)}\n`
      response += `📈 **Saldo:** R$ ${metrics.netCashFlow.toFixed(2)}\n\n`
      
      if (metrics.totalRevenue > 0) {
        const margin = (metrics.netCashFlow / metrics.totalRevenue) * 100
        response += `📊 **Margem:** ${margin.toFixed(1)}%\n\n`
      }
      
      response += `📈 **Estatísticas:**\n`
      response += `• Total de transações: ${metrics.expenseCount + metrics.revenueCount}\n`
      response += `• Média de despesas: R$ ${metrics.averageExpense.toFixed(2)}\n`
      response += `• Média de receitas: R$ ${metrics.averageRevenue.toFixed(2)}\n\n`
      
      if (metrics.topExpenseCategories.length > 0) {
        response += `💸 **Maior Categoria de Despesas:**\n`
        response += `• ${metrics.topExpenseCategories[0].name}: R$ ${metrics.topExpenseCategories[0].amount.toFixed(2)}\n`
      }
      
      return response
      
    } catch (error) {
      console.error('Error handling financial summary:', error)
      return '❌ Erro ao gerar resumo financeiro. Tente novamente.'
    }
  }

  private async handleCashFlowAnalysis(message: string, context: Record<string, any>): Promise<string> {
    try {
      // Perform advanced cash flow analysis
      const analysis = await this.cashFlowAnalyzer.analyzeCashFlow(context.userId)
      
      // Generate personalized insights
      const insights = await this.cashFlowAnalyzer.generatePersonalizedInsights(context.userId, analysis)
      
      return insights
      
    } catch (error) {
      console.error('Error handling cash flow analysis:', error)
      return '❌ Erro ao gerar análise de fluxo de caixa. Tente novamente.'
    }
  }

  private async handleBudgetPlanning(message: string, context: Record<string, any>): Promise<string> {
    try {
      // Generate budget recommendations
      const recommendations = await this.cashFlowAnalyzer.generateBudgetRecommendations(context.userId)
      
      return recommendations
      
    } catch (error) {
      console.error('Error handling budget planning:', error)
      return '❌ Erro ao gerar planejamento orçamentário. Tente novamente.'
    }
  }

  private async handleFinancialQuery(message: string, context: Record<string, any>): Promise<string> {
    try {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('total') || lowerMessage.includes('soma')) {
        return await this.handleFinancialSummary(message, context)
    }
    
    if (lowerMessage.includes('categoria') || lowerMessage.includes('categorias')) {
        return await this.handleCategoryList(message, context)
    }
    
    if (lowerMessage.includes('última') || lowerMessage.includes('recente')) {
        const recent = await this.expenseManager.getFinancialData(context.userId)
        const recentList = recent.slice(-5)
        
        if (recentList.length === 0) {
          return '📋 Nenhuma transação registrada ainda.'
        }
        
        let response = `📋 **Últimas Transações**\n\n`
        recentList.forEach((item, index) => {
          response += `${index + 1}. ${item.type === 'expense' ? '💸' : '💰'} R$ ${item.amount.toFixed(2)} - ${item.description}\n`
          response += `   📂 ${item.category} | 📅 ${item.date.toLocaleDateString('pt-BR')}\n\n`
        })
        
        return response
      }
      
      return `💡 **Como posso ajudar?**\n\n` +
             `• Adicionar despesas e receitas\n` +
             `• Análise de fluxo de caixa\n` +
             `• Planejamento orçamentário\n` +
             `• Listar categorias disponíveis\n` +
             `• Ver resumos financeiros\n` +
             `• Listar despesas e receitas\n\n` +
             `💬 **Exemplos:**\n` +
             `• "Adicionar despesa de R$ 50 para almoço"\n` +
             `• "Análise de fluxo de caixa"\n` +
             `• "Listar categorias"`
      
    } catch (error) {
      console.error('Error handling financial query:', error)
      return '❌ Erro ao processar consulta financeira. Tente novamente.'
    }
  }

  private async getFinancialDataCount(userId: string): Promise<number> {
    try {
      const data = await this.expenseManager.getFinancialData(userId)
      return data.length
    } catch (error) {
      console.error('Error getting financial data count:', error)
      return 0
    }
  }

  private extractExpenseData(message: string): any {
    const amountMatch = message.match(/r\$\s*(\d+(?:,\d{2})?)/i)
    if (!amountMatch) return null
    
    const amount = parseFloat(amountMatch[1].replace(',', '.'))
    const description = this.extractDescription(message)
    const category = this.extractCategory(message)
    
    return {
      amount,
      description,
      category,
      date: this.extractDate(message),
      metadata: {}
    }
  }

  private extractRevenueData(message: string): any {
    const amountMatch = message.match(/r\$\s*(\d+(?:,\d{2})?)/i)
    if (!amountMatch) return null
    
    const amount = parseFloat(amountMatch[1].replace(',', '.'))
    const description = this.extractDescription(message)
    const category = this.extractCategory(message) || 'vendas'
    
    return {
      amount,
      description,
      category,
      date: this.extractDate(message),
      metadata: {}
    }
  }

  private extractDescription(message: string): string {
    // Simple extraction - in real implementation, use NLP
    const words = message.split(' ')
    const descriptionWords = words.filter(word => 
      !word.match(/r\$\s*\d+/i) && 
      !word.match(/\d+/i) &&
      !['despesa', 'receita', 'adicionar', 'para', 'de', 'da', 'do'].includes(word.toLowerCase())
    )
    
    return descriptionWords.join(' ') || 'Transação sem descrição'
  }

  private extractCategory(message: string): string | null {
    const lowerMessage = message.toLowerCase()
    
    for (const category of this.categories) {
      if (lowerMessage.includes(category)) {
        return category
      }
    }
    
    return null
  }

  private extractDate(message: string): Date | null {
    // Simple date extraction - in real implementation, use proper date parsing
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (message.toLowerCase().includes('ontem')) {
      return yesterday
    }
    
    if (message.toLowerCase().includes('hoje')) {
      return today
    }
    
    return today
  }

  // Implementação dos métodos abstratos da BaseAgent
  async initialize(config: Record<string, any>): Promise<void> {
    // Inicialização do agente financeiro
    console.log('Financial Agent initialized with config:', config)
  }

  async process(message: string, context: Record<string, any>): Promise<any> {
    // Usar o método processMessage existente
    return this.processMessage(message, context)
  }

  async shutdown(): Promise<void> {
    // Limpeza e shutdown do agente
    console.log('Financial Agent shutting down')
  }

  async isHealthy(): Promise<boolean> {
    // Verificar se o agente está saudável
    return true
  }

  getCapabilities(): string[] {
    // Retornar as capacidades do agente
    return this.capabilities || []
  }

  getCurrentLoad(): number {
    // Retornar a carga atual do agente (0-1)
    return 0.5
  }

  getMemoryUsage(): number {
    // Retornar o uso de memória em MB
    return process.memoryUsage().heapUsed / 1024 / 1024
  }
}

export default FinancialAgent
