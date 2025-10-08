/**
 * Gerenciador de Perfil do Usuário
 * Mantém perfil persistente e preferências do usuário para personalização
 */

import { getMemoryManager } from './memory-manager'
import { MemoryCategory, MemoryImportance } from './types'

// Lazy initialization do memory manager
const getManager = () => getMemoryManager()

export interface UserProfile {
  userId: string
  personalInfo: {
    name?: string
    email?: string
    phone?: string
    position?: string
    company?: string
    industry?: string
    companySize?: string
  }
  preferences: {
    communicationStyle?: 'formal' | 'informal' | 'mixed'
    language?: string
    timezone?: string
    notificationPreferences?: Record<string, boolean>
    dashboardPreferences?: Record<string, any>
  }
  businessContext: {
    businessType?: string
    mainChallenges?: string[]
    goals?: string[]
    priorities?: string[]
    currentProjects?: string[]
    teamSize?: number
    revenueRange?: string
  }
  interactionHistory: {
    totalInteractions: number
    lastInteraction: Date
    favoriteFeatures: string[]
    commonQuestions: string[]
    satisfactionScore?: number
  }
  learningProfile: {
    expertiseLevel: 'beginner' | 'intermediate' | 'advanced'
    learningGoals: string[]
    preferredLearningStyle: 'visual' | 'textual' | 'hands-on'
    completedTutorials: string[]
  }
}

export class UserProfileManager {
  private readonly PROFILE_TTL = 86400 * 30 // 30 dias

  /**
   * Obtém perfil completo do usuário
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const profile = await getManager().getUserProfile(userId)
      if (!profile) return null

      return this.buildUserProfile(profile)
    } catch (error) {
      console.error('❌ Erro ao obter perfil do usuário:', error)
      return null
    }
  }

  /**
   * Atualiza perfil do usuário
   */
  async updateUserProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const existingProfile = await this.getUserProfile(userId)
      
      const updatedProfile: UserProfile = {
        ...existingProfile,
        ...updates,
        userId,
        personalInfo: {
          ...existingProfile?.personalInfo,
          ...updates.personalInfo
        },
        preferences: {
          ...existingProfile?.preferences,
          ...updates.preferences
        },
        businessContext: {
          ...existingProfile?.businessContext,
          ...updates.businessContext
        },
        learningProfile: {
          expertiseLevel: existingProfile?.learningProfile?.expertiseLevel || "beginner",
          learningGoals: existingProfile?.learningProfile?.learningGoals || [],
          preferredLearningStyle: existingProfile?.learningProfile?.preferredLearningStyle || "textual",
          completedTutorials: existingProfile?.learningProfile?.completedTutorials || []
        },
        interactionHistory: {
          totalInteractions: existingProfile?.interactionHistory?.totalInteractions || 0,
          lastInteraction: new Date(),
          favoriteFeatures: existingProfile?.interactionHistory?.favoriteFeatures || [],
          commonQuestions: existingProfile?.interactionHistory?.commonQuestions || [],
          satisfactionScore: existingProfile?.interactionHistory?.satisfactionScore,
          ...updates.interactionHistory
        }
      }

      await getManager().updateUserProfile(userId, {
        profileData: {
          name: updatedProfile.personalInfo?.name,
          company: updatedProfile.personalInfo?.company,
          position: updatedProfile.personalInfo?.position,
          industry: updatedProfile.personalInfo?.industry,
          // companySize removido - não faz parte do schema
        },
        preferences: updatedProfile.preferences,
        businessContext: updatedProfile.businessContext
      })

      // Armazenar como memória para busca
      await this.storeProfileMemory(userId, updatedProfile)

      return updatedProfile
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil do usuário:', error)
      throw new Error('Falha ao atualizar perfil do usuário')
    }
  }

  /**
   * Atualiza informações pessoais
   */
  async updatePersonalInfo(userId: string, personalInfo: Partial<UserProfile['personalInfo']>): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId)
      if (!profile) {
        // Criar perfil básico se não existir
        await this.createBasicProfile(userId)
      }

      const updatedProfile = await this.updateUserProfile(userId, {
        personalInfo: {
          ...profile?.personalInfo,
          ...personalInfo
        }
      })

      // Armazenar informações importantes como memórias
      if (personalInfo.name) {
        await getManager().store({
          userId,
          category: MemoryCategory.USER_PROFILE,
          key: 'user_name',
          value: personalInfo.name,
          importance: MemoryImportance.HIGH,
          ttl: this.PROFILE_TTL
        })
      }

      if (personalInfo.company) {
        await getManager().store({
          userId,
          category: MemoryCategory.BUSINESS_CONTEXT,
          key: 'company_name',
          value: personalInfo.company,
          importance: MemoryImportance.HIGH,
          ttl: this.PROFILE_TTL
        })
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar informações pessoais:', error)
    }
  }

  /**
   * Atualiza preferências do usuário
   */
  async updatePreferences(userId: string, preferences: Partial<UserProfile['preferences']>): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId)
      if (!profile) {
        await this.createBasicProfile(userId)
      }

      await this.updateUserProfile(userId, {
        preferences: {
          ...profile?.preferences,
          ...preferences
        }
      })
    } catch (error) {
      console.error('❌ Erro ao atualizar preferências:', error)
    }
  }

  /**
   * Atualiza contexto empresarial
   */
  async updateBusinessContext(userId: string, businessContext: Partial<UserProfile['businessContext']>): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId)
      if (!profile) {
        await this.createBasicProfile(userId)
      }

      await this.updateUserProfile(userId, {
        businessContext: {
          ...profile?.businessContext,
          ...businessContext
        }
      })

      // Armazenar metas e prioridades como memórias
      if (businessContext.goals) {
        await getManager().store({
          userId,
          category: MemoryCategory.GOALS,
          key: 'business_goals',
          value: businessContext.goals,
          importance: MemoryImportance.HIGH,
          ttl: this.PROFILE_TTL
        })
      }

      if (businessContext.priorities) {
        await getManager().store({
          userId,
          category: MemoryCategory.PREFERENCES,
          key: 'business_priorities',
          value: businessContext.priorities,
          importance: MemoryImportance.HIGH,
          ttl: this.PROFILE_TTL
        })
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar contexto empresarial:', error)
    }
  }

  /**
   * Registra interação do usuário
   */
  async recordInteraction(userId: string, interactionType: string, metadata?: any): Promise<void> {
    try {
      const profile = await this.getUserProfile(userId)
      if (!profile) {
        await this.createBasicProfile(userId)
      }

      const updatedProfile = await this.updateUserProfile(userId, {
        interactionHistory: {
          totalInteractions: (profile?.interactionHistory?.totalInteractions || 0) + 1,
          lastInteraction: new Date(),
          favoriteFeatures: profile?.interactionHistory?.favoriteFeatures || [],
          commonQuestions: profile?.interactionHistory?.commonQuestions || [],
          satisfactionScore: profile?.interactionHistory?.satisfactionScore
        }
      })

      // Armazenar interação como memória
      await memoryManager.store({
        userId,
        category: MemoryCategory.LEARNING,
        key: `interaction_${Date.now()}`,
        value: {
          type: interactionType,
          timestamp: new Date().toISOString(),
          metadata
        },
        importance: MemoryImportance.LOW,
        ttl: 86400 // 1 dia
      })
    } catch (error) {
      console.error('❌ Erro ao registrar interação:', error)
    }
  }

  /**
   * Obtém resumo do perfil para o agente
   */
  async getProfileSummary(userId: string): Promise<string> {
    try {
      const profile = await this.getUserProfile(userId)
      if (!profile) return 'Usuário não identificado'

      const summary = []
      
      if (profile.personalInfo.name) {
        summary.push(`Nome: ${profile.personalInfo.name}`)
      }
      
      if (profile.personalInfo.company) {
        summary.push(`Empresa: ${profile.personalInfo.company}`)
      }
      
      if (profile.personalInfo.position) {
        summary.push(`Cargo: ${profile.personalInfo.position}`)
      }

      if (profile.businessContext.goals && profile.businessContext.goals.length > 0) {
        summary.push(`Objetivos: ${profile.businessContext.goals.join(', ')}`)
      }

      if (profile.businessContext.priorities && profile.businessContext.priorities.length > 0) {
        summary.push(`Prioridades: ${profile.businessContext.priorities.join(', ')}`)
      }

      if (profile.preferences.communicationStyle) {
        summary.push(`Estilo: ${profile.preferences.communicationStyle}`)
      }

      return summary.join(' | ')
    } catch (error) {
      console.error('❌ Erro ao obter resumo do perfil:', error)
      return 'Erro ao obter perfil'
    }
  }

  /**
   * Obtém preferências de comunicação
   */
  async getCommunicationPreferences(userId: string): Promise<{
    style: 'formal' | 'informal' | 'mixed'
    language: string
    useEmojis: boolean
    detailLevel: 'brief' | 'detailed' | 'comprehensive'
  }> {
    try {
      const profile = await this.getUserProfile(userId)
      
      return {
        style: profile?.preferences.communicationStyle || 'mixed',
        language: profile?.preferences.language || 'pt-BR',
        useEmojis: profile?.preferences.notificationPreferences?.useEmojis ?? true,
        detailLevel: profile?.preferences.dashboardPreferences?.detailLevel || 'detailed'
      }
    } catch (error) {
      console.error('❌ Erro ao obter preferências de comunicação:', error)
      return {
        style: 'mixed',
        language: 'pt-BR',
        useEmojis: true,
        detailLevel: 'detailed'
      }
    }
  }

  /**
   * Cria perfil básico para novo usuário
   */
  private async createBasicProfile(userId: string): Promise<UserProfile> {
    const basicProfile: UserProfile = {
      userId,
      personalInfo: {},
      preferences: {
        communicationStyle: 'mixed',
        language: 'pt-BR',
        notificationPreferences: {
          useEmojis: true,
          sendReminders: true
        },
        dashboardPreferences: {
          detailLevel: 'detailed'
        }
      },
      businessContext: {},
      interactionHistory: {
        totalInteractions: 0,
        lastInteraction: new Date(),
        favoriteFeatures: [],
        commonQuestions: []
      },
      learningProfile: {
        expertiseLevel: 'beginner',
        learningGoals: [],
        preferredLearningStyle: 'hands-on',
        completedTutorials: []
      }
    }

    return await this.updateUserProfile(userId, basicProfile)
  }

  /**
   * Armazena perfil como memória para busca
   */
  private async storeProfileMemory(userId: string, profile: UserProfile): Promise<void> {
    try {
      // Armazenar informações principais como memórias separadas
      if (profile.personalInfo.name) {
        await getManager().store({
          userId,
          category: MemoryCategory.USER_PROFILE,
          key: 'user_name',
          value: profile.personalInfo.name,
          importance: MemoryImportance.CRITICAL,
          ttl: this.PROFILE_TTL
        })
      }

      if (profile.businessContext.goals) {
        await getManager().store({
          userId,
          category: MemoryCategory.GOALS,
          key: 'user_goals',
          value: profile.businessContext.goals,
          importance: MemoryImportance.HIGH,
          ttl: this.PROFILE_TTL
        })
      }

      if (profile.preferences.communicationStyle) {
        await getManager().store({
          userId,
          category: MemoryCategory.PREFERENCES,
          key: 'communication_style',
          value: profile.preferences.communicationStyle,
          importance: MemoryImportance.MEDIUM,
          ttl: this.PROFILE_TTL
        })
      }
    } catch (error) {
      console.error('❌ Erro ao armazenar memória do perfil:', error)
    }
  }

  /**
   * Constrói perfil do usuário a partir dos dados do banco
   */
  private buildUserProfile(profile: any): UserProfile {
    return {
      userId: profile.userId,
      personalInfo: profile.profileData.personalInfo || {},
      preferences: profile.preferences || {},
      businessContext: profile.businessContext || {},
      interactionHistory: profile.profileData.interactionHistory || {
        totalInteractions: 0,
        lastInteraction: new Date(),
        favoriteFeatures: [],
        commonQuestions: []
      },
      learningProfile: profile.profileData.learningProfile || {
        expertiseLevel: 'beginner',
        learningGoals: [],
        preferredLearningStyle: 'hands-on',
        completedTutorials: []
      }
    }
  }
}

// Exportar instância singleton
export const userProfileManager = new UserProfileManager()
