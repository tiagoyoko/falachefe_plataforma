#!/usr/bin/env tsx

/**
 * Script para criar dados de teste de perfil de usuário diretamente no banco
 */

import { config } from 'dotenv'
import postgres from 'postgres'

// Carregar variáveis de ambiente
config({ path: '.env.local' })

async function createTestUserProfile() {
  console.log('🧪 Criando dados de teste de perfil de usuário...\n')

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL não encontrada!')
    return
  }

  console.log('✅ Conectando ao banco de dados...')

  // Criar conexão direta com postgres
  const sql = postgres(connectionString, {
    ssl: false // Desabilitar SSL para evitar problemas de certificado
  })

  try {
    // Dados de teste
    const testUserId = 'test-user-123'
    const testData = {
      personalInfo: {
        name: 'João Silva',
        company: 'TechCorp Ltda',
        position: 'Gerente de Projetos',
        industry: 'Tecnologia',
        companySize: '11-50'
      },
      businessContext: {
        goals: ['Aumentar produtividade', 'Reduzir custos'],
        priorities: ['Automação', 'Gestão financeira']
      },
      preferences: {
        communicationStyle: 'mixed',
        language: 'pt-BR'
      }
    }

    console.log('📝 Inserindo dados de teste...')
    console.log('👤 Usuário:', testUserId)
    console.log('📊 Dados:', JSON.stringify(testData, null, 2))

    // Inserir dados na tabela de perfil de usuário
    await sql`
      INSERT INTO user_memory_profiles (user_id, profile_data, preferences, business_context, last_updated, created_at)
      VALUES (${testUserId}, ${JSON.stringify(testData)}, ${JSON.stringify(testData.preferences)}, ${JSON.stringify(testData.businessContext)}, NOW(), NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        profile_data = ${JSON.stringify(testData)},
        preferences = ${JSON.stringify(testData.preferences)},
        business_context = ${JSON.stringify(testData.businessContext)},
        last_updated = NOW()
    `

    console.log('✅ Dados de teste criados com sucesso!')

    // Verificar se os dados foram inseridos
    const result = await sql`
      SELECT * FROM user_memory_profiles WHERE user_id = ${testUserId}
    `

    if (result.length > 0) {
      console.log('📊 Dados verificados no banco:')
      console.log(JSON.stringify(result[0], null, 2))
    } else {
      console.log('❌ Dados não encontrados no banco')
    }

  } catch (error) {
    console.error('❌ Erro ao criar dados de teste:', error)
  } finally {
    await sql.end()
  }

  console.log('\n🎉 Script de criação de dados de teste concluído!')
}

// Executar script
createTestUserProfile().catch(console.error)
