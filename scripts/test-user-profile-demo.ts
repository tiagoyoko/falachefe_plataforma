/**
 * Demo do Sistema de Perfil do Usuário
 * 
 * Este script demonstra as funcionalidades principais do sistema
 * sem depender do banco de dados.
 */

// Simulação das interfaces e funcionalidades principais
interface UserProfile {
  userId: string
  personalInfo: {
    name?: string
    email?: string
    phone?: string
    position?: string
    company?: string
    industry?: string
  }
  preferences: {
    communicationStyle?: 'formal' | 'informal' | 'mixed'
    language?: string
    useEmojis?: boolean
  }
  businessContext: {
    businessType?: string
    mainChallenges?: string[]
    goals?: string[]
    priorities?: string[]
  }
}

class UserProfileToolDemo {
  private profiles: Map<string, UserProfile> = new Map()

  async getUserProfile(userId: string): Promise<UserProfile | null> {
    return this.profiles.get(userId) || null
  }

  async updatePersonalInfo(userId: string, personalInfo: any): Promise<boolean> {
    const existing = this.profiles.get(userId) || {
      userId,
      personalInfo: {},
      preferences: {},
      businessContext: {}
    }
    
    existing.personalInfo = { ...existing.personalInfo, ...personalInfo }
    this.profiles.set(userId, existing)
    return true
  }

  async updateBusinessContext(userId: string, businessContext: any): Promise<boolean> {
    const existing = this.profiles.get(userId) || {
      userId,
      personalInfo: {},
      preferences: {},
      businessContext: {}
    }
    
    existing.businessContext = { ...existing.businessContext, ...businessContext }
    this.profiles.set(userId, existing)
    return true
  }

  async updatePreferences(userId: string, preferences: any): Promise<boolean> {
    const existing = this.profiles.get(userId) || {
      userId,
      personalInfo: {},
      preferences: {},
      businessContext: {}
    }
    
    existing.preferences = { ...existing.preferences, ...preferences }
    this.profiles.set(userId, existing)
    return true
  }

  extractUserInfoFromMessage(message: string): Partial<UserProfile['personalInfo']> {
    const extracted: any = {}
    
    // Extrair nome
    const namePatterns = [
      /meu nome é (\w+)/i,
      /me chamo (\w+)/i,
      /sou o (\w+)/i,
      /sou a (\w+)/i,
      /my name is (\w+)/i,
      /i am (\w+)/i
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
      /empresa (.+?)(?:\s|$)/i
    ]

    for (const pattern of companyPatterns) {
      const match = message.match(pattern)
      if (match && match[1]) {
        extracted.company = match[1].trim()
        break
      }
    }

    return extracted
  }

  generatePersonalizedPrompt(userId: string, basePrompt: string): string {
    const profile = this.profiles.get(userId)
    if (!profile) return basePrompt

    let personalizedPrompt = basePrompt

    if (profile.personalInfo.name) {
      personalizedPrompt += `\n\nINFORMAÇÕES DO USUÁRIO:\nNome: ${profile.personalInfo.name}`
    }

    if (profile.personalInfo.company) {
      personalizedPrompt += `\nEmpresa: ${profile.personalInfo.company}`
    }

    if (profile.personalInfo.position) {
      personalizedPrompt += `\nCargo: ${profile.personalInfo.position}`
    }

    if (profile.businessContext.goals && profile.businessContext.goals.length > 0) {
      personalizedPrompt += `\nObjetivos: ${profile.businessContext.goals.join(', ')}`
    }

    if (profile.preferences.communicationStyle) {
      personalizedPrompt += `\n\nPREFERÊNCIAS DE COMUNICAÇÃO:\nEstilo: ${profile.preferences.communicationStyle}`
    }

    return personalizedPrompt
  }

  getProfileSummary(userId: string): string {
    const profile = this.profiles.get(userId)
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

    if (profile.preferences.communicationStyle) {
      summary.push(`Estilo: ${profile.preferences.communicationStyle}`)
    }

    return summary.join(' | ')
  }
}

async function runDemo() {
  console.log('🎭 Demo do Sistema de Perfil do Usuário\n')
  
  const tool = new UserProfileToolDemo()
  const testUserId = 'demo_user_123'
  
  // Simulação de mensagens do usuário
  const messages = [
    'Olá, meu nome é João Silva e trabalho na TechCorp como Gerente de Vendas',
    'Meus objetivos principais são aumentar as vendas em 30% e melhorar a satisfação dos clientes',
    'Preciso de ajuda com planejamento financeiro para o próximo trimestre',
    'Gostaria de uma análise de fluxo de caixa'
  ]

  console.log('📝 Simulando interações do usuário...\n')

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]
    console.log(`💬 Mensagem ${i + 1}: "${message}"`)
    
    // Extrair informações da mensagem
    const extractedInfo = tool.extractUserInfoFromMessage(message)
    if (Object.keys(extractedInfo).length > 0) {
      console.log('🔍 Informações extraídas:', extractedInfo)
      await tool.updatePersonalInfo(testUserId, extractedInfo)
    }

    // Simular extração de objetivos
    if (message.includes('objetivos')) {
      const goals = ['aumentar as vendas em 30%', 'melhorar a satisfação dos clientes']
      console.log('🎯 Objetivos identificados:', goals)
      await tool.updateBusinessContext(testUserId, { goals })
    }

    // Simular preferências de comunicação
    if (i === 2) {
      await tool.updatePreferences(testUserId, {
        communicationStyle: 'formal',
        language: 'pt-BR',
        useEmojis: false
      })
      console.log('⚙️ Preferências configuradas: formal, pt-BR, sem emojis')
    }

    // Gerar prompt personalizado
    const basePrompt = 'Você é a Secretária Virtual do Falachefe, especializada em gestão empresarial.'
    const personalizedPrompt = tool.generatePersonalizedPrompt(testUserId, basePrompt)
    
    console.log('🤖 Prompt personalizado gerado:')
    console.log('   Tamanho original:', basePrompt.length)
    console.log('   Tamanho personalizado:', personalizedPrompt.length)
    
    // Mostrar resumo do perfil
    const summary = tool.getProfileSummary(testUserId)
    console.log('📊 Resumo do perfil:', summary)
    
    console.log('─'.repeat(60))
  }

  // Mostrar perfil final
  console.log('\n📋 Perfil final do usuário:')
  const finalProfile = await tool.getUserProfile(testUserId)
  console.log(JSON.stringify(finalProfile, null, 2))

  console.log('\n✨ Demo concluída com sucesso!')
  console.log('\n🎯 Benefícios demonstrados:')
  console.log('✅ Extração automática de informações das mensagens')
  console.log('✅ Armazenamento persistente de dados do usuário')
  console.log('✅ Geração de prompts personalizados para agentes')
  console.log('✅ Contexto mantido entre interações')
  console.log('✅ Resumos automáticos do perfil')
  
  console.log('\n💡 Como isso melhora a experiência:')
  console.log('• O usuário não precisa repetir seu nome ou empresa')
  console.log('• Os agentes têm contexto completo do usuário')
  console.log('• Respostas são mais personalizadas e relevantes')
  console.log('• O sistema "lembra" das conversas anteriores')
}

// Executar demo
runDemo().catch(console.error)

