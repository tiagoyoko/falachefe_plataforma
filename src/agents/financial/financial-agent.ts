/**
 * Financial Agent - Specialized agent for financial operations
 * Based on AWS Labs Agent Squad Framework
 */

import { BaseAgent, AgentConfig, AgentResponse } from '../core/agent-manager'

export interface FinancialData {
  id: string
  type: 'expense' | 'revenue'
  amount: number
  description: string
  category: string
  date: Date
  userId: string
  metadata?: Record<string, any>
}

export interface CashFlowAnalysis {
  totalRevenue: number
  totalExpenses: number
  netCashFlow: number
  period: {
    start: Date
    end: Date
  }
  breakdown: {
    byCategory: Record<string, number>
    byMonth: Record<string, number>
  }
}

export class FinancialAgent extends BaseAgent {
  private financialData: FinancialData[] = []
  private categories: string[] = [
    'alimentação',
    'transporte',
    'saúde',
    'educação',
    'lazer',
    'serviços',
    'produtos',
    'outros'
  ]

  constructor(config: AgentConfig) {
    super({
      ...config,
      capabilities: [
        'add_expense',
        'add_revenue',
        'cashflow_analysis',
        'budget_planning',
        'financial_query'
      ]
    })
  }

  public async processMessage(
    message: string,
    context: Record<string, any>
  ): Promise<AgentResponse> {
    const startTime = Date.now()
    
    try {
      const intent = this.classifyFinancialIntent(message)
      let response: string
      let confidence: number = 0.8

      switch (intent) {
        case 'add_expense':
          response = await this.handleAddExpense(message, context)
          confidence = 0.9
          break
          
        case 'add_revenue':
          response = await this.handleAddRevenue(message, context)
          confidence = 0.9
          break
          
        case 'cashflow_analysis':
          response = await this.handleCashFlowAnalysis(message, context)
          confidence = 0.85
          break
          
        case 'budget_planning':
          response = await this.handleBudgetPlanning(message, context)
          confidence = 0.8
          break
          
        case 'financial_query':
          response = await this.handleFinancialQuery(message, context)
          confidence = 0.7
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
          financialDataCount: this.financialData.length
        }
      }

    } catch (error) {
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

  private classifyFinancialIntent(message: string): string {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('despesa') || lowerMessage.includes('gasto') || lowerMessage.includes('pagamento')) {
      return 'add_expense'
    }
    
    if (lowerMessage.includes('receita') || lowerMessage.includes('venda') || lowerMessage.includes('faturamento')) {
      return 'add_revenue'
    }
    
    if (lowerMessage.includes('fluxo de caixa') || lowerMessage.includes('caixa') || lowerMessage.includes('saldo')) {
      return 'cashflow_analysis'
    }
    
    if (lowerMessage.includes('orçamento') || lowerMessage.includes('planejamento') || lowerMessage.includes('meta')) {
      return 'budget_planning'
    }
    
    return 'financial_query'
  }

  private async handleAddExpense(message: string, context: Record<string, any>): Promise<string> {
    const expenseData = this.extractExpenseData(message)
    
    if (!expenseData) {
      return 'Para adicionar uma despesa, me informe o valor e a descrição. Exemplo: "Adicionar despesa de R$ 50,00 para almoço"'
    }

    const expense: FinancialData = {
      id: this.generateId(),
      type: 'expense',
      amount: expenseData.amount,
      description: expenseData.description,
      category: expenseData.category || 'outros',
      date: expenseData.date || new Date(),
      userId: context.userId || 'unknown',
      metadata: expenseData.metadata
    }

    this.financialData.push(expense)
    
    return `✅ Despesa adicionada com sucesso!\n\n💰 Valor: R$ ${expense.amount.toFixed(2)}\n📝 Descrição: ${expense.description}\n📂 Categoria: ${expense.category}\n📅 Data: ${expense.date.toLocaleDateString('pt-BR')}`
  }

  private async handleAddRevenue(message: string, context: Record<string, any>): Promise<string> {
    const revenueData = this.extractRevenueData(message)
    
    if (!revenueData) {
      return 'Para adicionar uma receita, me informe o valor e a descrição. Exemplo: "Adicionar receita de R$ 500,00 de venda de consultoria"'
    }

    const revenue: FinancialData = {
      id: this.generateId(),
      type: 'revenue',
      amount: revenueData.amount,
      description: revenueData.description,
      category: revenueData.category || 'vendas',
      date: revenueData.date || new Date(),
      userId: context.userId || 'unknown',
      metadata: revenueData.metadata
    }

    this.financialData.push(revenue)
    
    return `✅ Receita adicionada com sucesso!\n\n💰 Valor: R$ ${revenue.amount.toFixed(2)}\n📝 Descrição: ${revenue.description}\n📂 Categoria: ${revenue.category}\n📅 Data: ${revenue.date.toLocaleDateString('pt-BR')}`
  }

  private async handleCashFlowAnalysis(message: string, context: Record<string, any>): Promise<string> {
    const analysis = this.performCashFlowAnalysis()
    
    return `📊 **Análise de Fluxo de Caixa**\n\n` +
           `💰 Receitas: R$ ${analysis.totalRevenue.toFixed(2)}\n` +
           `💸 Despesas: R$ ${analysis.totalExpenses.toFixed(2)}\n` +
           `📈 Saldo: R$ ${analysis.netCashFlow.toFixed(2)}\n\n` +
           `📅 Período: ${analysis.period.start.toLocaleDateString('pt-BR')} a ${analysis.period.end.toLocaleDateString('pt-BR')}\n\n` +
           `📊 **Por Categoria:**\n${this.formatCategoryBreakdown(analysis.breakdown.byCategory)}`
  }

  private async handleBudgetPlanning(message: string, context: Record<string, any>): Promise<string> {
    const analysis = this.performCashFlowAnalysis()
    const recommendations = this.generateBudgetRecommendations(analysis)
    
    return `🎯 **Planejamento Orçamentário**\n\n` +
           `📊 Situação Atual:\n` +
           `💰 Receitas: R$ ${analysis.totalRevenue.toFixed(2)}\n` +
           `💸 Despesas: R$ ${analysis.totalExpenses.toFixed(2)}\n` +
           `📈 Saldo: R$ ${analysis.netCashFlow.toFixed(2)}\n\n` +
           `💡 **Recomendações:**\n${recommendations}`
  }

  private async handleFinancialQuery(message: string, context: Record<string, any>): Promise<string> {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('total') || lowerMessage.includes('soma')) {
      const analysis = this.performCashFlowAnalysis()
      return `💰 **Resumo Financeiro**\n\nReceitas: R$ ${analysis.totalRevenue.toFixed(2)}\nDespesas: R$ ${analysis.totalExpenses.toFixed(2)}\nSaldo: R$ ${analysis.netCashFlow.toFixed(2)}`
    }
    
    if (lowerMessage.includes('categoria') || lowerMessage.includes('categorias')) {
      return `📂 **Categorias Disponíveis:**\n${this.categories.map(cat => `• ${cat}`).join('\n')}`
    }
    
    if (lowerMessage.includes('última') || lowerMessage.includes('recente')) {
      const recent = this.financialData.slice(-5)
      if (recent.length === 0) {
        return 'Nenhuma transação registrada ainda.'
      }
      
      return `📋 **Últimas Transações:**\n${recent.map(item => 
        `${item.type === 'expense' ? '💸' : '💰'} R$ ${item.amount.toFixed(2)} - ${item.description} (${item.category})`
      ).join('\n')}`
    }
    
    return 'Posso ajudar com:\n• Adicionar despesas e receitas\n• Análise de fluxo de caixa\n• Planejamento orçamentário\n• Consultas sobre categorias\n• Resumos financeiros'
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

  private performCashFlowAnalysis(): CashFlowAnalysis {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const monthlyData = this.financialData.filter(item => 
      item.date >= startOfMonth && item.date <= now
    )
    
    const revenues = monthlyData.filter(item => item.type === 'revenue')
    const expenses = monthlyData.filter(item => item.type === 'expense')
    
    const totalRevenue = revenues.reduce((sum, item) => sum + item.amount, 0)
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0)
    
    const byCategory: Record<string, number> = {}
    monthlyData.forEach(item => {
      byCategory[item.category] = (byCategory[item.category] || 0) + item.amount
    })
    
    return {
      totalRevenue,
      totalExpenses,
      netCashFlow: totalRevenue - totalExpenses,
      period: {
        start: startOfMonth,
        end: now
      },
      breakdown: {
        byCategory,
        byMonth: {} // Simplified for now
      }
    }
  }

  private generateBudgetRecommendations(analysis: CashFlowAnalysis): string {
    const recommendations: string[] = []
    
    if (analysis.netCashFlow < 0) {
      recommendations.push('⚠️ Seu saldo está negativo. Considere reduzir despesas ou aumentar receitas.')
    } else if (analysis.netCashFlow > 0) {
      recommendations.push('✅ Ótimo! Você está com saldo positivo. Considere investir o excedente.')
    }
    
    const expenseRatio = analysis.totalExpenses / analysis.totalRevenue
    if (expenseRatio > 0.8) {
      recommendations.push('📊 Suas despesas representam mais de 80% das receitas. Revise seus gastos.')
    }
    
    if (recommendations.length === 0) {
      recommendations.push('💡 Continue mantendo o controle financeiro!')
    }
    
    return recommendations.map(rec => `• ${rec}`).join('\n')
  }

  private formatCategoryBreakdown(breakdown: Record<string, number>): string {
    return Object.entries(breakdown)
      .sort(([,a], [,b]) => b - a)
      .map(([category, amount]) => `• ${category}: R$ ${amount.toFixed(2)}`)
      .join('\n')
  }

  private generateId(): string {
    return `fin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public getFinancialData(): FinancialData[] {
    return [...this.financialData]
  }

  public clearFinancialData(): void {
    this.financialData = []
  }
}

export default FinancialAgent
