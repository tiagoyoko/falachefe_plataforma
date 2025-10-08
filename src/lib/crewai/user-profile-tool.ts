/**
 * User Profile Tool for Agents
 * 
 * Esta tool permite que os agentes consultem e atualizem dados do perfil do usuário
 * sem que o usuário precise repetir informações constantemente.
 */

import { userProfileManager, UserProfile } from './memory/user-profile'
import { BaseAgent } from './types'

export interface UserProfileToolResult {
  success: boolean
  data?: any
  error?: string
  profile?: UserProfile
  summary?: string
}

export interface UserProfileQuery {
  userId: string
  fields?: string[]
  includeSummary?: boolean
}

export interface UserProfileUpdate {
  userId: string
  personalInfo?: Partial<UserProfile['personalInfo']>
  preferences?: Partial<UserProfile['preferences']>
  businessContext?: Partial<UserProfile['businessContext']>
}

/**
 * Tool para consulta de dados do usuário
 */
export class UserProfileTool {
  private static instance: UserProfileTool

  public static getInstance(): UserProfileTool {
    if (!UserProfileTool.instance) {
      UserProfileTool.instance = new UserProfileTool()
    }
    return UserProfileTool.instance
  }

  /**
   * Consulta dados completos do perfil do usuário
   */
  async getUserProfile(query: UserProfileQuery): Promise<UserProfileToolResult> {
    try {
      console.log(`🔍 Consultando perfil do usuário: ${query.userId}`)
      
      const profile = await userProfileManager.getUserProfile(query.userId)
      
      if (!profile) {
        return {
          success: false,
          error: 'Perfil do usuário não encontrado'
        }
      }

      // Filtrar campos se especificado
      let filteredProfile = profile
      if (query.fields && query.fields.length > 0) {
        filteredProfile = this.filterProfileFields(profile, query.fields)
      }

      // Gerar resumo se solicitado
      let summary: string | undefined
      if (query.includeSummary) {
        summary = await userProfileManager.getProfileSummary(query.userId)
      }

      return {
        success: true,
        profile: filteredProfile,
        summary,
        data: filteredProfile
      }
    } catch (error) {
      console.error('❌ Erro ao consultar perfil do usuário:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      }
    }
  }

  /**
   * Consulta informações pessoais específicas
   */
  async getPersonalInfo(userId: string): Promise<UserProfileToolResult> {
    try {
      const profile = await userProfileManager.getUserProfile(userId)
      
      if (!profile) {
        return {
          success: false,
          error: 'Perfil do usuário não encontrado'
        }
      }

      return {
        success: true,
        data: profile.personalInfo,
        profile
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter informações pessoais'
      }
    }
  }

  /**
   * Consulta contexto empresarial
   */
  async getBusinessContext(userId: string): Promise<UserProfileToolResult> {
    try {
      const profile = await userProfileManager.getUserProfile(userId)
      
      if (!profile) {
        return {
          success: false,
          error: 'Perfil do usuário não encontrado'
        }
      }

      return {
        success: true,
        data: profile.businessContext,
        profile
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter contexto empresarial'
      }
    }
  }

  /**
   * Consulta preferências do usuário
   */
  async getPreferences(userId: string): Promise<UserProfileToolResult> {
    try {
      const profile = await userProfileManager.getUserProfile(userId)
      
      if (!profile) {
        return {
          success: false,
          error: 'Perfil do usuário não encontrado'
        }
      }

      return {
        success: true,
        data: profile.preferences,
        profile
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter preferências'
      }
    }
  }

  /**
   * Atualiza dados do perfil do usuário
   */
  async updateUserProfile(update: UserProfileUpdate): Promise<UserProfileToolResult> {
    try {
      console.log(`📝 Atualizando perfil do usuário: ${update.userId}`)
      
      const updatedProfile = await userProfileManager.updateUserProfile(
        update.userId,
        {
          personalInfo: update.personalInfo,
          preferences: update.preferences,
          businessContext: update.businessContext
        }
      )

      return {
        success: true,
        profile: updatedProfile,
        data: updatedProfile
      }
    } catch (error) {
      console.error('❌ Erro ao atualizar perfil do usuário:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar perfil'
      }
    }
  }

  /**
   * Atualiza informações pessoais
   */
  async updatePersonalInfo(userId: string, personalInfo: Partial<UserProfile['personalInfo']>): Promise<UserProfileToolResult> {
    try {
      await userProfileManager.updatePersonalInfo(userId, personalInfo)
      
      return {
        success: true,
        data: { message: 'Informações pessoais atualizadas com sucesso' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar informações pessoais'
      }
    }
  }

  /**
   * Atualiza contexto empresarial
   */
  async updateBusinessContext(userId: string, businessContext: Partial<UserProfile['businessContext']>): Promise<UserProfileToolResult> {
    try {
      await userProfileManager.updateBusinessContext(userId, businessContext)
      
      return {
        success: true,
        data: { message: 'Contexto empresarial atualizado com sucesso' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar contexto empresarial'
      }
    }
  }

  /**
   * Registra interação do usuário
   */
  async recordInteraction(userId: string, interactionType: string, metadata?: any): Promise<UserProfileToolResult> {
    try {
      await userProfileManager.recordInteraction(userId, interactionType, metadata)
      
      return {
        success: true,
        data: { message: 'Interação registrada com sucesso' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao registrar interação'
      }
    }
  }

  /**
   * Obtém resumo do perfil para uso em prompts
   */
  async getProfileSummary(userId: string): Promise<UserProfileToolResult> {
    try {
      const summary = await userProfileManager.getProfileSummary(userId)
      
      return {
        success: true,
        summary,
        data: { summary }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter resumo do perfil'
      }
    }
  }

  /**
   * Obtém preferências de comunicação
   */
  async getCommunicationPreferences(userId: string): Promise<UserProfileToolResult> {
    try {
      const preferences = await userProfileManager.getCommunicationPreferences(userId)
      
      return {
        success: true,
        data: preferences
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter preferências de comunicação'
      }
    }
  }

  /**
   * Extrai e armazena informações do usuário de uma mensagem
   */
  async extractAndStoreUserInfo(userId: string, message: string): Promise<UserProfileToolResult> {
    try {
      const extractedInfo = this.extractUserInfoFromMessage(message)
      
      if (Object.keys(extractedInfo).length > 0) {
        await userProfileManager.updatePersonalInfo(userId, extractedInfo)
        
        return {
          success: true,
          data: {
            message: 'Informações extraídas e armazenadas',
            extracted: extractedInfo
          }
        }
      }

      return {
        success: true,
        data: { message: 'Nenhuma informação extraída da mensagem' }
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao extrair informações'
      }
    }
  }

  /**
   * Filtra campos específicos do perfil
   */
  private filterProfileFields(profile: UserProfile, fields: string[]): UserProfile {
    const filteredProfile: Partial<UserProfile> = { userId: profile.userId }

    for (const field of fields) {
      switch (field) {
        case 'personalInfo':
          filteredProfile.personalInfo = profile.personalInfo
          break
        case 'businessContext':
          filteredProfile.businessContext = profile.businessContext
          break
        case 'preferences':
          filteredProfile.preferences = profile.preferences
          break
        case 'interactionHistory':
          filteredProfile.interactionHistory = profile.interactionHistory
          break
        case 'learningProfile':
          filteredProfile.learningProfile = profile.learningProfile
          break
      }
    }

    return filteredProfile as UserProfile
  }

  /**
   * Extrai informações do usuário de uma mensagem
   */
  private extractUserInfoFromMessage(message: string): Partial<UserProfile['personalInfo']> {
    const extracted: Partial<UserProfile['personalInfo']> = {}
    const lowerMessage = message.toLowerCase()

    // Extrair nome
    const namePatterns = [
      /meu nome é (\w+)/i,
      /me chamo (\w+)/i,
      /sou o (\w+)/i,
      /sou a (\w+)/i,
      /my name is (\w+)/i,
      /i am (\w+)/i,
      /nome é (\w+)/i,
      /chamo (\w+)/i
    ]

    for (const pattern of namePatterns) {
      const match = message.match(pattern)
      if (match && match[1]) {
        extracted.name = match[1].charAt(0).toUpperCase() + match[1].slice(1)
        break
      }
    }

    // Extrair empresa
    const companyPatterns = [
      /trabalho na (.+?)(?:\s|$)/i,
      /sou da (.+?)(?:\s|$)/i,
      /empresa (.+?)(?:\s|$)/i,
      /company (.+?)(?:\s|$)/i
    ]

    for (const pattern of companyPatterns) {
      const match = message.match(pattern)
      if (match && match[1]) {
        extracted.company = match[1].trim()
        break
      }
    }

    // Extrair cargo
    const positionPatterns = [
      /sou (.+?)(?:\s|$)/i,
      /trabalho como (.+?)(?:\s|$)/i,
      /cargo (.+?)(?:\s|$)/i,
      /position (.+?)(?:\s|$)/i
    ]

    for (const pattern of positionPatterns) {
      const match = message.match(pattern)
      if (match && match[1] && !lowerMessage.includes('nome') && !lowerMessage.includes('chamo')) {
        extracted.position = match[1].trim()
        break
      }
    }

    return extracted
  }

  /**
   * Gera prompt personalizado com dados do usuário
   */
  async generatePersonalizedPrompt(userId: string, basePrompt: string): Promise<string> {
    try {
      const profileResult = await this.getProfileSummary(userId)
      const preferencesResult = await this.getCommunicationPreferences(userId)

      if (!profileResult.success || !preferencesResult.success) {
        return basePrompt
      }

      const profileSummary = profileResult.summary || ''
      const preferences = preferencesResult.data

      let personalizedPrompt = basePrompt

      if (profileSummary) {
        personalizedPrompt += `\n\nINFORMAÇÕES DO USUÁRIO:\n${profileSummary}`
      }

      if (preferences) {
        personalizedPrompt += `\n\nPREFERÊNCIAS DE COMUNICAÇÃO:\n`
        personalizedPrompt += `- Estilo: ${preferences.style}\n`
        personalizedPrompt += `- Idioma: ${preferences.language}\n`
        personalizedPrompt += `- Uso de emojis: ${preferences.useEmojis ? 'Sim' : 'Não'}\n`
        personalizedPrompt += `- Nível de detalhe: ${preferences.detailLevel}`
      }

      return personalizedPrompt
    } catch (error) {
      console.error('❌ Erro ao gerar prompt personalizado:', error)
      return basePrompt
    }
  }
}

// Exportar instância singleton
export const userProfileTool = UserProfileTool.getInstance()


