import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

async function checkBetterAuthTables() {
  console.log("🔍 Verificando tabelas do Better Auth no banco...\n");

  try {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    const client = postgres(connectionString);

    // Verificar se as tabelas existem
    const tables = [
      'user',
      'session', 
      'account',
      'verification'
    ];

    console.log("1. Verificando existência das tabelas:");
    
    for (const table of tables) {
      try {
        const result = await client`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
          );
        `;
        
        const exists = result[0].exists;
        console.log(`   ${exists ? '✅' : '❌'} Tabela ${table}: ${exists ? 'EXISTE' : 'NÃO EXISTE'}`);
        
        if (exists) {
          // Verificar estrutura da tabela
          const columns = await client`
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = ${table}
            ORDER BY ordinal_position;
          `;
          
          console.log(`     Colunas (${columns.length}):`);
          columns.forEach(col => {
            console.log(`       - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'}`);
          });
        }
      } catch (error) {
        console.log(`   ❌ Erro ao verificar tabela ${table}: ${error.message}`);
      }
    }

    // Verificar se há dados nas tabelas
    console.log("\n2. Verificando dados nas tabelas:");
    
    for (const table of tables) {
      try {
        const count = await client`SELECT COUNT(*) as count FROM ${client(table)}`;
        console.log(`   ${table}: ${count[0].count} registros`);
      } catch (error) {
        console.log(`   ❌ Erro ao contar ${table}: ${error.message}`);
      }
    }

    // Verificar se há conflitos de nomes
    console.log("\n3. Verificando conflitos de nomes:");
    const allTables = await client`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('user', 'session', 'account', 'verification')
      ORDER BY table_name;
    `;
    
    console.log(`   Tabelas encontradas: ${allTables.map(t => t.table_name).join(', ')}`);

    await client.end();

  } catch (error) {
    console.error("❌ Erro durante verificação:", error);
  }
}

checkBetterAuthTables().then(() => {
  console.log("\n✅ Verificação concluída!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});
