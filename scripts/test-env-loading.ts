#!/usr/bin/env tsx

/**
 * Script para testar se as variáveis de ambiente estão sendo carregadas corretamente
 */

import { config } from 'dotenv'

console.log('🔍 Testando carregamento de variáveis de ambiente...')

// Carregar variáveis de ambiente
const result = config({ path: '.env.local' })

console.log('📊 Resultado do config:', result)

console.log('🔑 DATABASE_URL:', process.env.DATABASE_URL ? 'Definida' : 'Não definida')
console.log('🔑 POSTGRES_URL:', process.env.POSTGRES_URL ? 'Definida' : 'Não definida')

if (process.env.DATABASE_URL) {
  console.log('✅ DATABASE_URL encontrada:', process.env.DATABASE_URL.substring(0, 50) + '...')
} else {
  console.log('❌ DATABASE_URL não encontrada')
}

console.log('\n🎉 Teste de carregamento de variáveis concluído!')

