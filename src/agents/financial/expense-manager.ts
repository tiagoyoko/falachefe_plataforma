/**
 * Expense Manager - Handles expense and revenue management
 * Based on AWS Labs Agent Squad Framework
 */

import { db } from '@/lib/db'
import { agentSquadFinancialData } from '@/lib/schema'
import { eq, and, desc, gte, lte } from 'drizzle-orm'
import { MemorySystem } from '../core/memory-system'

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

export interface FinancialMetrics {
  totalRevenue: number
  totalExpenses: number
  netCashFlow: number
  expenseCount: number
  revenueCount: number
  averageExpense: number
  averageRevenue: number
  topExpenseCategories: Array<{ name: string; amount: number; count: number }>
  topRevenueCategories: Array<{ name: string; amount: number; count: number }>
  monthlyTrend: Array<{ month: string; revenue: number; expenses: number; net: number }>
}

export class ExpenseManager {
  private memoryManager: MemorySystem

  constructor(memoryManager: MemorySystem) {
    this.memoryManager = memoryManager
  }

  async addExpense(
    message: string, 
    context: Record<string, any>,
    expenseData: {
      amount: number
      category: string
      description: string
      date?: Date
      metadata?: Record<string, any>
    }
  ): Promise<{ success: boolean; data?: FinancialData; error?: string }> {
    try {
      // Validate expense data
      const validation = this.validateExpenseData(expenseData)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        }
      }

      // Save to database
      const [expense] = await db.insert(agentSquadFinancialData).values({
        type: 'expense',
        amount: expenseData.amount,
        description: expenseData.description,
        category: expenseData.category,
        date: expenseData.date || new Date(),
        userId: context.userId || 'unknown',
        metadata: expenseData.metadata || {}
      }).returning()

      // Update individual memory
      await this.updateIndividualMemory(context.conversationId, {
        lastExpense: expense,
        totalExpenses: await this.getTotalExpenses(context.userId),
        monthlyExpenses: await this.getMonthlyExpenses(context.userId)
      })

      return {
        success: true,
        data: expense as FinancialData
      }

    } catch (error) {
      console.error('Error adding expense:', error)
      return {
        success: false,
        error: 'Erro interno ao adicionar despesa'
      }
    }
  }

  async addRevenue(
    message: string, 
    context: Record<string, any>,
    revenueData: {
      amount: number
      category: string
      description: string
      date?: Date
      metadata?: Record<string, any>
    }
  ): Promise<{ success: boolean; data?: FinancialData; error?: string }> {
    try {
      // Validate revenue data
      const validation = this.validateRevenueData(revenueData)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        }
      }

      // Save to database
      const [revenue] = await db.insert(agentSquadFinancialData).values({
        type: 'revenue',
        amount: revenueData.amount,
        description: revenueData.description,
        category: revenueData.category,
        date: revenueData.date || new Date(),
        userId: context.userId || 'unknown',
        metadata: revenueData.metadata || {}
      }).returning()

      // Update individual memory
      await this.updateIndividualMemory(context.conversationId, {
        lastRevenue: revenue,
        totalRevenue: await this.getTotalRevenue(context.userId),
        monthlyRevenue: await this.getMonthlyRevenue(context.userId)
      })

      return {
        success: true,
        data: revenue as FinancialData
      }

    } catch (error) {
      console.error('Error adding revenue:', error)
      return {
        success: false,
        error: 'Erro interno ao adicionar receita'
      }
    }
  }

  async getFinancialData(
    userId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<FinancialData[]> {
    try {
      const conditions = [eq(agentSquadFinancialData.userId, userId)]
      
      if (startDate && endDate) {
        conditions.push(
          gte(agentSquadFinancialData.date, startDate),
          lte(agentSquadFinancialData.date, endDate)
        )
      }

      const query = db.select().from(agentSquadFinancialData)
        .where(and(...conditions))
        .orderBy(desc(agentSquadFinancialData.date))

      const results = await query
      return results as FinancialData[]

    } catch (error) {
      console.error('Error getting financial data:', error)
      return []
    }
  }

  async calculateMetrics(userId: string, period?: { start: Date; end: Date }): Promise<FinancialMetrics> {
    try {
      const data = await this.getFinancialData(userId, period?.start, period?.end)
      
      const expenses = data.filter(item => item.type === 'expense')
      const revenues = data.filter(item => item.type === 'revenue')
      
      const totalRevenue = revenues.reduce((sum, item) => sum + item.amount, 0)
      const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0)
      const netCashFlow = totalRevenue - totalExpenses
      
      const averageExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0
      const averageRevenue = revenues.length > 0 ? totalRevenue / revenues.length : 0
      
      // Calculate top categories
      const expenseCategories = this.calculateCategoryBreakdown(expenses)
      const revenueCategories = this.calculateCategoryBreakdown(revenues)
      
      // Calculate monthly trend
      const monthlyTrend = this.calculateMonthlyTrend(data)
      
      return {
        totalRevenue,
        totalExpenses,
        netCashFlow,
        expenseCount: expenses.length,
        revenueCount: revenues.length,
        averageExpense,
        averageRevenue,
        topExpenseCategories: expenseCategories,
        topRevenueCategories: revenueCategories,
        monthlyTrend
      }

    } catch (error) {
      console.error('Error calculating metrics:', error)
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netCashFlow: 0,
        expenseCount: 0,
        revenueCount: 0,
        averageExpense: 0,
        averageRevenue: 0,
        topExpenseCategories: [],
        topRevenueCategories: [],
        monthlyTrend: []
      }
    }
  }

  async getTotalExpenses(userId: string): Promise<number> {
    try {
      const data = await db.select().from(agentSquadFinancialData)
        .where(
          and(
            eq(agentSquadFinancialData.userId, userId),
            eq(agentSquadFinancialData.type, 'expense')
          )
        )
      
      return data.reduce((sum, item) => sum + item.amount, 0)
    } catch (error) {
      console.error('Error getting total expenses:', error)
      return 0
    }
  }

  async getTotalRevenue(userId: string): Promise<number> {
    try {
      const data = await db.select().from(agentSquadFinancialData)
        .where(
          and(
            eq(agentSquadFinancialData.userId, userId),
            eq(agentSquadFinancialData.type, 'revenue')
          )
        )
      
      return data.reduce((sum, item) => sum + item.amount, 0)
    } catch (error) {
      console.error('Error getting total revenue:', error)
      return 0
    }
  }

  async getMonthlyExpenses(userId: string): Promise<number> {
    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      
      const data = await db.select().from(agentSquadFinancialData)
        .where(
          and(
            eq(agentSquadFinancialData.userId, userId),
            eq(agentSquadFinancialData.type, 'expense'),
            gte(agentSquadFinancialData.date, startOfMonth)
          )
        )
      
      return data.reduce((sum, item) => sum + item.amount, 0)
    } catch (error) {
      console.error('Error getting monthly expenses:', error)
      return 0
    }
  }

  async getMonthlyRevenue(userId: string): Promise<number> {
    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)
      
      const data = await db.select().from(agentSquadFinancialData)
        .where(
          and(
            eq(agentSquadFinancialData.userId, userId),
            eq(agentSquadFinancialData.type, 'revenue'),
            gte(agentSquadFinancialData.date, startOfMonth)
          )
        )
      
      return data.reduce((sum, item) => sum + item.amount, 0)
    } catch (error) {
      console.error('Error getting monthly revenue:', error)
      return 0
    }
  }

  private validateExpenseData(data: any): { isValid: boolean; error?: string } {
    if (!data.amount || data.amount <= 0) {
      return { isValid: false, error: 'Valor da despesa deve ser maior que zero' }
    }
    
    if (!data.description || data.description.trim().length === 0) {
      return { isValid: false, error: 'Descrição da despesa é obrigatória' }
    }
    
    if (!data.category || data.category.trim().length === 0) {
      return { isValid: false, error: 'Categoria da despesa é obrigatória' }
    }
    
    return { isValid: true }
  }

  private validateRevenueData(data: any): { isValid: boolean; error?: string } {
    if (!data.amount || data.amount <= 0) {
      return { isValid: false, error: 'Valor da receita deve ser maior que zero' }
    }
    
    if (!data.description || data.description.trim().length === 0) {
      return { isValid: false, error: 'Descrição da receita é obrigatória' }
    }
    
    if (!data.category || data.category.trim().length === 0) {
      return { isValid: false, error: 'Categoria da receita é obrigatória' }
    }
    
    return { isValid: true }
  }

  private calculateCategoryBreakdown(data: FinancialData[]): Array<{ name: string; amount: number; count: number }> {
    const breakdown: Record<string, { amount: number; count: number }> = {}
    
    data.forEach(item => {
      if (!breakdown[item.category]) {
        breakdown[item.category] = { amount: 0, count: 0 }
      }
      breakdown[item.category].amount += item.amount
      breakdown[item.category].count += 1
    })
    
    return Object.entries(breakdown)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
  }

  private calculateMonthlyTrend(data: FinancialData[]): Array<{ month: string; revenue: number; expenses: number; net: number }> {
    const monthlyData: Record<string, { revenue: number; expenses: number }> = {}
    
    data.forEach(item => {
      const month = item.date.toISOString().substring(0, 7) // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { revenue: 0, expenses: 0 }
      }
      
      if (item.type === 'revenue') {
        monthlyData[month].revenue += item.amount
      } else {
        monthlyData[month].expenses += item.amount
      }
    })
    
    return Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        revenue: data.revenue,
        expenses: data.expenses,
        net: data.revenue - data.expenses
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  }

  private async updateIndividualMemory(
    conversationId: string, 
    data: Record<string, any>
  ): Promise<void> {
    try {
      await this.memoryManager.setIndividualMemory(
        conversationId,
        'financial',
        data,
        3600 // 1 hour TTL
      )
    } catch (error) {
      console.error('Error updating individual memory:', error)
    }
  }
}

export default ExpenseManager
