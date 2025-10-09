import { db } from '../src/lib/db'
import { financialData } from '../src/lib/schema'
import { sql } from 'drizzle-orm'

async function testConnection() {
  console.log('🔍 Testando conexão com banco de dados...\n')
  
  try {
    // Teste 1: Verificar se a tabela existe
    console.log('1️⃣ Verificando se tabela financial_data existe...')
    const tableExists = await db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'financial_data'
      );
    `)
    console.log('✅ Consulta executada:', tableExists)
    
    // Teste 2: Tentar selecionar dados
    console.log('\n2️⃣ Tentando buscar dados da tabela...')
    const transactions = await db.select().from(financialData).limit(5)
    console.log(`✅ Dados recuperados: ${transactions.length} transações`)
    
    if (transactions.length > 0) {
      console.log('📊 Exemplo:', JSON.stringify(transactions[0], null, 2))
    }
    
    console.log('\n🎉 Banco de dados está FUNCIONANDO!')
    process.exit(0)
    
  } catch (error) {
    console.error('\n❌ ERRO ao conectar ao banco:')
    console.error(error)
    console.error('\n📝 Verifique:')
    console.error('- DATABASE_URL está correta no .env.local')
    console.error('- Supabase está online')
    console.error('- Tabela financial_data foi criada (execute: npx drizzle-kit push)')
    process.exit(1)
  }
}

testConnection()


