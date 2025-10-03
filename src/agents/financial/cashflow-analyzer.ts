/**
 * Cash Flow Analyzer - Advanced financial analysis and insights
 * Based on AWS Labs Agent Squad Framework
 */

import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { ExpenseManager, FinancialMetrics } from './expense-manager'
import { MemorySystem } from '../core/memory-system'

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

export interface FinancialInsights {
  keyFindings: string[]
  riskFactors: string[]
  opportunities: string[]
  recommendations: string[]
  confidence: number
}

export class CashFlowAnalyzer {
  private llmClient: typeof openai
  private expenseManager: ExpenseManager
  private memoryManager: MemorySystem

  constructor(expenseManager: ExpenseManager, memoryManager: MemorySystem) {
    this.llmClient = openai
    this.expenseManager = expenseManager
    this.memoryManager = memoryManager
  }

  async analyzeCashFlow(
    userId: string,
    period?: { start: Date; end: Date }
  ): Promise<CashFlowAnalysis> {
    try {
      // Get financial metrics
      const metrics = await this.expenseManager.calculateMetrics(userId, period)
      
      // Calculate trends
      const trends = this.calculateTrends(metrics)
      
      // Generate insights using LLM
      const insights = await this.generateInsights(metrics, trends)
      
      // Calculate category breakdown
      const categoryBreakdown = this.calculateCategoryBreakdown(metrics)
      
      // Calculate monthly breakdown
      const monthlyBreakdown = this.calculateMonthlyBreakdown(metrics)
      
      // Generate recommendations
      const recommendations = this.generateRecommendations(metrics, trends, insights)
      
      const analysis: CashFlowAnalysis = {
        period: {
          start: period?.start || new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          end: period?.end || new Date()
        },
        summary: {
          totalRevenue: metrics.totalRevenue,
          totalExpenses: metrics.totalExpenses,
          netCashFlow: metrics.netCashFlow,
          margin: metrics.totalRevenue > 0 ? (metrics.netCashFlow / metrics.totalRevenue) * 100 : 0
        },
        trends,
        insights: insights.keyFindings,
        recommendations: insights.recommendations,
        categoryBreakdown,
        monthlyBreakdown
      }

      // Update shared memory
      await this.updateSharedMemory(userId, analysis)

      return analysis

    } catch (error) {
      console.error('Error analyzing cash flow:', error)
      throw new Error('Erro ao analisar fluxo de caixa')
    }
  }

  async generatePersonalizedInsights(
    userId: string,
    analysis: CashFlowAnalysis
  ): Promise<string> {
    try {
      const prompt = `
        Analise os seguintes dados financeiros e gere insights personalizados em português brasileiro:

        **Resumo Financeiro:**
        - Receitas: R$ ${analysis.summary.totalRevenue.toFixed(2)}
        - Despesas: R$ ${analysis.summary.totalExpenses.toFixed(2)}
        - Saldo: R$ ${analysis.summary.netCashFlow.toFixed(2)}
        - Margem: ${analysis.summary.margin.toFixed(1)}%

        **Tendências:**
        - Receitas: ${analysis.trends.revenueTrend}
        - Despesas: ${analysis.trends.expenseTrend}
        - Saldo: ${analysis.trends.netTrend}

        **Principais Categorias de Despesas:**
        ${analysis.categoryBreakdown.slice(0, 5).map(cat => 
          `- ${cat.category}: R$ ${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`
        ).join('\n')}

        **Principais Categorias de Receitas:**
        ${analysis.categoryBreakdown.filter(cat => cat.amount > 0).slice(0, 3).map(cat => 
          `- ${cat.category}: R$ ${cat.amount.toFixed(2)} (${cat.percentage.toFixed(1)}%)`
        ).join('\n')}

        Gere insights práticos e acionáveis focando em:
        1. Pontos fortes e oportunidades
        2. Riscos e alertas
        3. Recomendações específicas
        4. Próximos passos sugeridos

        Seja direto, prático e use linguagem acessível.
      `

      const { text } = await generateText({
        model: this.llmClient('gpt-4'),
        prompt,
        temperature: 0.7
      })

      return text || 'Análise não disponível'

    } catch (error) {
      console.error('Error generating personalized insights:', error)
      return this.generateFallbackInsights(analysis)
    }
  }

  async generateBudgetRecommendations(
    userId: string,
    targetSavings?: number
  ): Promise<string> {
    const metrics = await this.expenseManager.calculateMetrics(userId)
    
    try {
      const analysis = await this.analyzeCashFlow(userId)
      
      const prompt = `
        Com base nos dados financeiros abaixo, gere recomendações de orçamento:

        **Situação Atual:**
        - Receitas: R$ ${metrics.totalRevenue.toFixed(2)}
        - Despesas: R$ ${metrics.totalExpenses.toFixed(2)}
        - Saldo: R$ ${metrics.netCashFlow.toFixed(2)}
        - Meta de Poupança: ${targetSavings ? `R$ ${targetSavings.toFixed(2)}` : 'Não definida'}

        **Categorias de Despesas:**
        ${metrics.topExpenseCategories.map(cat => 
          `- ${cat.name}: R$ ${cat.amount.toFixed(2)} (${cat.count} transações)`
        ).join('\n')}

        Gere recomendações práticas para:
        1. Otimização de gastos por categoria
        2. Estratégias de aumento de receitas
        3. Planejamento de poupança
        4. Controle de orçamento mensal
        5. Metas financeiras realistas

        Seja específico e acionável.
      `

      const { text } = await generateText({
        model: this.llmClient('gpt-4'),
        prompt,
        temperature: 0.6
      })

      return text || 'Recomendações não disponíveis'

    } catch (error) {
      console.error('Error generating budget recommendations:', error)
      return this.generateFallbackRecommendations(metrics)
    }
  }

  private calculateTrends(metrics: FinancialMetrics): CashFlowAnalysis['trends'] {
    // Simple trend calculation based on monthly data
    const monthlyData = metrics.monthlyTrend
    
    if (monthlyData.length < 2) {
      return {
        revenueTrend: 'stable',
        expenseTrend: 'stable',
        netTrend: 'stable'
      }
    }

    const recent = monthlyData.slice(-2)
    const older = monthlyData.slice(-4, -2)

    const revenueTrend = this.calculateTrend(recent, older, 'revenue')
    const expenseTrend = this.calculateTrend(recent, older, 'expenses')
    const netTrend = this.calculateTrend(recent, older, 'net')

    return {
      revenueTrend,
      expenseTrend,
      netTrend
    }
  }

  private calculateTrend(
    recent: any[], 
    older: any[], 
    field: 'revenue' | 'expenses' | 'net'
  ): 'increasing' | 'decreasing' | 'stable' {
    if (recent.length === 0 || older.length === 0) return 'stable'

    const recentAvg = recent.reduce((sum, item) => sum + item[field], 0) / recent.length
    const olderAvg = older.reduce((sum, item) => sum + item[field], 0) / older.length

    const change = ((recentAvg - olderAvg) / olderAvg) * 100

    if (change > 5) return 'increasing'
    if (change < -5) return 'decreasing'
    return 'stable'
  }

  private async generateInsights(
    metrics: FinancialMetrics,
    trends: CashFlowAnalysis['trends']
  ): Promise<FinancialInsights> {
    const insights: FinancialInsights = {
      keyFindings: [],
      riskFactors: [],
      opportunities: [],
      recommendations: [],
      confidence: 0.8
    }

    // Key findings
    if (metrics.netCashFlow > 0) {
      insights.keyFindings.push(`Saldo positivo de R$ ${metrics.netCashFlow.toFixed(2)}`)
    } else if (metrics.netCashFlow < 0) {
      insights.keyFindings.push(`Saldo negativo de R$ ${Math.abs(metrics.netCashFlow).toFixed(2)}`)
    }

    if (metrics.totalRevenue > 0) {
      const margin = (metrics.netCashFlow / metrics.totalRevenue) * 100
      insights.keyFindings.push(`Margem de ${margin.toFixed(1)}%`)
    }

    // Risk factors
    if (metrics.netCashFlow < 0) {
      insights.riskFactors.push('Saldo negativo - risco de endividamento')
    }

    if (metrics.topExpenseCategories.length > 0) {
      const topCategory = metrics.topExpenseCategories[0]
      const categoryPercentage = (topCategory.amount / metrics.totalExpenses) * 100
      if (categoryPercentage > 50) {
        insights.riskFactors.push(`Concentração excessiva em ${topCategory.name} (${categoryPercentage.toFixed(1)}%)`)
      }
    }

    // Opportunities
    if (trends.revenueTrend === 'increasing') {
      insights.opportunities.push('Tendência de crescimento nas receitas')
    }

    if (trends.expenseTrend === 'decreasing') {
      insights.opportunities.push('Controle eficaz das despesas')
    }

    // Recommendations
    if (metrics.netCashFlow < 0) {
      insights.recommendations.push('Reduzir despesas ou aumentar receitas')
    }

    if (metrics.averageExpense > metrics.averageRevenue * 0.8) {
      insights.recommendations.push('Revisar estrutura de custos')
    }

    return insights
  }

  private calculateCategoryBreakdown(metrics: FinancialMetrics): CashFlowAnalysis['categoryBreakdown'] {
    const total = metrics.totalExpenses + metrics.totalRevenue
    if (total === 0) return []

    const breakdown = [
      ...metrics.topExpenseCategories.map(cat => ({
        category: cat.name,
        amount: -cat.amount, // Negative for expenses
        percentage: (cat.amount / total) * 100,
        trend: 'stable' as const
      })),
      ...metrics.topRevenueCategories.map(cat => ({
        category: cat.name,
        amount: cat.amount,
        percentage: (cat.amount / total) * 100,
        trend: 'stable' as const
      }))
    ]

    return breakdown.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
  }

  private calculateMonthlyBreakdown(metrics: FinancialMetrics): CashFlowAnalysis['monthlyBreakdown'] {
    return metrics.monthlyTrend.map(month => ({
      month: month.month,
      revenue: month.revenue,
      expenses: month.expenses,
      net: month.net,
      margin: month.revenue > 0 ? (month.net / month.revenue) * 100 : 0
    }))
  }

  private generateRecommendations(
    metrics: FinancialMetrics,
    trends: CashFlowAnalysis['trends'],
    insights: FinancialInsights
  ): string[] {
    const recommendations: string[] = []

    if (metrics.netCashFlow < 0) {
      recommendations.push('Implementar plano de redução de despesas')
      recommendations.push('Buscar novas fontes de receita')
    }

    if (trends.expenseTrend === 'increasing') {
      recommendations.push('Revisar e otimizar gastos por categoria')
    }

    if (metrics.topExpenseCategories.length > 0) {
      const topCategory = metrics.topExpenseCategories[0]
      recommendations.push(`Focar na otimização de gastos em ${topCategory.name}`)
    }

    if (trends.revenueTrend === 'decreasing') {
      recommendations.push('Desenvolver estratégias para aumentar receitas')
    }

    return recommendations
  }

  private generateFallbackInsights(analysis: CashFlowAnalysis): string {
    const { summary, trends } = analysis
    
    let insights = `📊 **Análise de Fluxo de Caixa**\n\n`
    insights += `💰 **Resumo:**\n`
    insights += `• Receitas: R$ ${summary.totalRevenue.toFixed(2)}\n`
    insights += `• Despesas: R$ ${summary.totalExpenses.toFixed(2)}\n`
    insights += `• Saldo: R$ ${summary.netCashFlow.toFixed(2)}\n`
    insights += `• Margem: ${summary.margin.toFixed(1)}%\n\n`
    
    insights += `📈 **Tendências:**\n`
    insights += `• Receitas: ${trends.revenueTrend}\n`
    insights += `• Despesas: ${trends.expenseTrend}\n`
    insights += `• Saldo: ${trends.netTrend}\n\n`
    
    if (summary.netCashFlow < 0) {
      insights += `⚠️ **Alerta:** Saldo negativo detectado. Considere reduzir despesas ou aumentar receitas.`
    } else {
      insights += `✅ **Situação:** Saldo positivo. Continue mantendo o controle financeiro.`
    }
    
    return insights
  }

  private generateFallbackRecommendations(metrics: FinancialMetrics): string {
    let recommendations = `💡 **Recomendações de Orçamento**\n\n`
    
    if (metrics.netCashFlow < 0) {
      recommendations += `• Reduzir despesas em ${metrics.topExpenseCategories[0]?.name || 'categorias prioritárias'}\n`
      recommendations += `• Buscar novas fontes de receita\n`
    }
    
    if (metrics.averageExpense > metrics.averageRevenue * 0.8) {
      recommendations += `• Revisar estrutura de custos\n`
    }
    
    recommendations += `• Manter controle mensal de gastos\n`
    recommendations += `• Estabelecer metas de poupança\n`
    
    return recommendations
  }

  private async updateSharedMemory(userId: string, analysis: CashFlowAnalysis): Promise<void> {
    try {
      await this.memoryManager.setSharedMemory(
        `financial_analysis_${userId}`,
        {
          lastAnalysis: analysis,
          analysisDate: new Date(),
          userId
        }
      )
    } catch (error) {
      console.error('Error updating shared memory:', error)
    }
  }
}

export default CashFlowAnalyzer
