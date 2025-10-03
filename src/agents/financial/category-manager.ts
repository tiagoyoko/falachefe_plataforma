/**
 * Category Manager - Handles financial categories management
 * Based on AWS Labs Agent Squad Framework
 */

import { db } from '@/lib/db'
import { financialCategories } from '@/lib/schema'
import { eq, and, desc, ilike, or, isNull } from 'drizzle-orm'
import { MemorySystem } from '../core/memory-system'

export interface FinancialCategory {
  id: string
  name: string
  description?: string
  color?: string
  isDefault: boolean
  isActive: boolean
  userId?: string
  companyId?: string
  createdAt: Date
  updatedAt: Date
}

export interface CategoryStats {
  totalCategories: number
  activeCategories: number
  defaultCategories: number
  userCategories: number
  mostUsedCategories: Array<{ name: string; count: number; amount: number }>
}

export class CategoryManager {
  private memoryManager: MemorySystem

  constructor(memoryManager: MemorySystem) {
    this.memoryManager = memoryManager
  }

  async createCategory(
    message: string,
    context: Record<string, any>,
    categoryData: {
      name: string
      description?: string
      color?: string
    }
  ): Promise<{ success: boolean; data?: FinancialCategory; error?: string }> {
    try {
      // Validate category data
      const validation = this.validateCategoryData(categoryData)
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error
        }
      }

      // Check if category already exists
      const existing = await this.getCategoryByName(categoryData.name, context.userId)
      if (existing) {
        return {
          success: false,
          error: `Categoria "${categoryData.name}" já existe`
        }
      }

      // Save to database
      const [category] = await db.insert(financialCategories).values({
        name: categoryData.name.toLowerCase(),
        description: categoryData.description,
        color: categoryData.color || this.generateRandomColor(),
        isDefault: false,
        isActive: true,
        userId: context.userId,
        companyId: context.companyId
      }).returning()

      // Update individual memory
      await this.updateIndividualMemory(context.conversationId, {
        lastCreatedCategory: category,
        totalCategories: await this.getTotalCategories(context.userId)
      })

      return {
        success: true,
        data: category as FinancialCategory
      }

    } catch (error) {
      console.error('Error creating category:', error)
      return {
        success: false,
        error: 'Erro interno ao criar categoria'
      }
    }
  }

  async deleteCategory(
    message: string,
    context: Record<string, any>,
    categoryName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if category exists
      const category = await this.getCategoryByName(categoryName, context.userId)
      if (!category) {
        return {
          success: false,
          error: `Categoria "${categoryName}" não encontrada`
        }
      }

      // Check if it's a default category
      if (category.isDefault) {
        return {
          success: false,
          error: 'Não é possível excluir categorias padrão'
        }
      }

      // Check if category is being used
      const isUsed = await this.isCategoryUsed(categoryName, context.userId)
      if (isUsed) {
        return {
          success: false,
          error: `Categoria "${categoryName}" está sendo usada e não pode ser excluída`
        }
      }

      // Delete from database
      await db.delete(financialCategories)
        .where(and(
          eq(financialCategories.name, categoryName.toLowerCase()),
          eq(financialCategories.userId, context.userId)
        ))

      // Update individual memory
      await this.updateIndividualMemory(context.conversationId, {
        lastDeletedCategory: categoryName,
        totalCategories: await this.getTotalCategories(context.userId)
      })

      return {
        success: true
      }

    } catch (error) {
      console.error('Error deleting category:', error)
      return {
        success: false,
        error: 'Erro interno ao excluir categoria'
      }
    }
  }

  async getCategories(
    userId: string,
    includeInactive: boolean = false
  ): Promise<FinancialCategory[]> {
    try {
      const conditions = [
        or(
          eq(financialCategories.userId, userId),
          isNull(financialCategories.userId) // Global categories
        )
      ]

      if (!includeInactive) {
        conditions.push(eq(financialCategories.isActive, true))
      }

      const categories = await db.select().from(financialCategories)
        .where(and(...conditions))
        .orderBy(desc(financialCategories.isDefault), financialCategories.name)

      return categories as FinancialCategory[]

    } catch (error) {
      console.error('Error getting categories:', error)
      return []
    }
  }

  async getCategoryByName(
    name: string,
    userId: string
  ): Promise<FinancialCategory | null> {
    try {
      const [category] = await db.select().from(financialCategories)
        .where(and(
          eq(financialCategories.name, name.toLowerCase()),
          or(
            eq(financialCategories.userId, userId),
            isNull(financialCategories.userId) // Global categories
          )
        ))
        .limit(1)

      return category as FinancialCategory || null

    } catch (error) {
      console.error('Error getting category by name:', error)
      return null
    }
  }

  async getCategoryStats(userId: string): Promise<CategoryStats> {
    try {
      const categories = await this.getCategories(userId, true)
      
      const stats: CategoryStats = {
        totalCategories: categories.length,
        activeCategories: categories.filter(c => c.isActive).length,
        defaultCategories: categories.filter(c => c.isDefault).length,
        userCategories: categories.filter(c => c.userId === userId).length,
        mostUsedCategories: [] // TODO: Implement usage tracking
      }

      return stats

    } catch (error) {
      console.error('Error getting category stats:', error)
      return {
        totalCategories: 0,
        activeCategories: 0,
        defaultCategories: 0,
        userCategories: 0,
        mostUsedCategories: []
      }
    }
  }

  async searchCategories(
    userId: string,
    searchTerm: string
  ): Promise<FinancialCategory[]> {
    try {
      const categories = await db.select().from(financialCategories)
        .where(and(
          or(
            eq(financialCategories.userId, userId),
            isNull(financialCategories.userId) // Global categories
          ),
          eq(financialCategories.isActive, true),
          ilike(financialCategories.name, `%${searchTerm.toLowerCase()}%`)
        ))
        .orderBy(desc(financialCategories.isDefault), financialCategories.name)

      return categories as FinancialCategory[]

    } catch (error) {
      console.error('Error searching categories:', error)
      return []
    }
  }

  private validateCategoryData(data: {
    name: string
    description?: string
    color?: string
  }): { isValid: boolean; error?: string } {
    if (!data.name || data.name.trim().length === 0) {
      return {
        isValid: false,
        error: 'Nome da categoria é obrigatório'
      }
    }

    if (data.name.length > 100) {
      return {
        isValid: false,
        error: 'Nome da categoria deve ter no máximo 100 caracteres'
      }
    }

    if (data.description && data.description.length > 500) {
      return {
        isValid: false,
        error: 'Descrição deve ter no máximo 500 caracteres'
      }
    }

    if (data.color && !/^#[0-9A-F]{6}$/i.test(data.color)) {
      return {
        isValid: false,
        error: 'Cor deve estar no formato hexadecimal (#RRGGBB)'
      }
    }

    return { isValid: true }
  }

  private async isCategoryUsed(categoryName: string, userId: string): Promise<boolean> {
    try {
      // TODO: Check if category is used in financial transactions
      // This would require querying the agentSquadFinancialData table
      return false
    } catch (error) {
      console.error('Error checking if category is used:', error)
      return false
    }
  }

  private async getTotalCategories(userId: string): Promise<number> {
    try {
      const categories = await this.getCategories(userId)
      return categories.length
    } catch (error) {
      console.error('Error getting total categories:', error)
      return 0
    }
  }

  private generateRandomColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#6C5CE7', '#A29BFE', '#FD79A8',
      '#636E72', '#74B9FF', '#00B894', '#FDCB6E', '#E17055'
    ]
    return colors[Math.floor(Math.random() * colors.length)]
  }

  private async updateIndividualMemory(
    conversationId: string,
    data: Record<string, any>
  ): Promise<void> {
    try {
      await this.memoryManager.updateIndividualMemory(conversationId, 'financial', 'category_manager', data)
    } catch (error) {
      console.error('Error updating individual memory:', error)
    }
  }
}

export default CategoryManager
