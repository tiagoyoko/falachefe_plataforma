import { config } from "dotenv";

// Carregar variáveis de ambiente ANTES de importar qualquer coisa
config({ path: ".env.local" });

// Agora importar as dependências
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { user, account } from "../src/lib/better-auth-schema";
import { eq } from "drizzle-orm";

async function checkUsers() {
  console.log("🔍 Verificando usuários no banco de dados...\n");

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error("❌ DATABASE_URL não encontrada!");
    return;
  }

  console.log("✅ Conectando ao banco de dados...");
  const client = postgres(connectionString);
  const db = drizzle(client, { schema: { user, account } });

  try {
    // Verificar se há usuários no banco
    console.log("1. Verificando usuários:");
    const users = await db.select().from(user);
    console.log(`   Total de usuários: ${users.length}`);
    
    if (users.length > 0) {
      users.forEach((u, index) => {
        console.log(`   Usuário ${index + 1}:`);
        console.log(`     ID: ${u.id}`);
        console.log(`     Nome: ${u.name}`);
        console.log(`     Email: ${u.email}`);
        console.log(`     Role: ${u.role}`);
        console.log(`     Ativo: ${u.isActive}`);
        console.log(`     Criado em: ${u.createdAt}`);
        console.log("");
      });
    }

    // Verificar contas (senhas)
    console.log("2. Verificando contas (senhas):");
    const accounts = await db.select().from(account);
    console.log(`   Total de contas: ${accounts.length}`);
    
    if (accounts.length > 0) {
      accounts.forEach((acc, index) => {
        console.log(`   Conta ${index + 1}:`);
        console.log(`     ID: ${acc.id}`);
        console.log(`     Provider: ${acc.providerId}`);
        console.log(`     User ID: ${acc.userId}`);
        console.log(`     Tem senha: ${acc.password ? 'Sim' : 'Não'}`);
        console.log(`     Criado em: ${acc.createdAt}`);
        console.log("");
      });
    }

    // Verificar se o email específico existe
    const testEmail = "tiago@agenciavibecode.com";
    console.log(`3. Verificando usuário específico: ${testEmail}`);
    
    const specificUser = await db.select().from(user).where(eq(user.email, testEmail));
    if (specificUser.length > 0) {
      console.log("   ✅ Usuário encontrado!");
      console.log(`   ID: ${specificUser[0].id}`);
      console.log(`   Nome: ${specificUser[0].name}`);
      console.log(`   Ativo: ${specificUser[0].isActive}`);
      
      // Verificar conta associada
      const userAccount = await db.select().from(account).where(eq(account.userId, specificUser[0].id));
      if (userAccount.length > 0) {
        console.log("   ✅ Conta (senha) encontrada!");
        console.log(`   Provider: ${userAccount[0].providerId}`);
        console.log(`   Tem senha: ${userAccount[0].password ? 'Sim' : 'Não'}`);
      } else {
        console.log("   ❌ Nenhuma conta (senha) encontrada para este usuário!");
      }
    } else {
      console.log("   ❌ Usuário não encontrado!");
    }

  } catch (error) {
    console.error("❌ Erro ao verificar usuários:", error);
  } finally {
    await client.end();
  }
}

checkUsers().then(() => {
  console.log("\n✅ Verificação concluída!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});
