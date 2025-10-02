import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { user, account } from "../src/lib/better-auth-schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

async function createPasswordAccount() {
  console.log("🔐 Criando conta com senha para tiago@agenciavibecode.com...\n");

  const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  
  if (!connectionString) {
    console.error("❌ DATABASE_URL não encontrada!");
    return;
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema: { user, account } });

  try {
    // Encontrar o usuário
    const targetEmail = "tiago@agenciavibecode.com";
    const targetPassword = "#Acesso000";
    
    console.log(`1. Procurando usuário: ${targetEmail}`);
    const users = await db.select().from(user).where(eq(user.email, targetEmail));
    
    if (users.length === 0) {
      console.error("❌ Usuário não encontrado!");
      return;
    }

    const targetUser = users[0];
    console.log(`   ✅ Usuário encontrado: ${targetUser.name} (ID: ${targetUser.id})`);

    // Verificar se já existe conta com senha
    console.log("2. Verificando se já existe conta com senha...");
    const existingAccounts = await db.select().from(account).where(eq(account.userId, targetUser.id));
    
    const hasPasswordAccount = existingAccounts.some(acc => acc.providerId === "credential");
    
    if (hasPasswordAccount) {
      console.log("   ⚠️  Usuário já possui conta com senha!");
      return;
    }

    // Hash da senha
    console.log("3. Criando hash da senha...");
    const hashedPassword = await hash(targetPassword, 12);
    console.log("   ✅ Senha hasheada com sucesso");

    // Criar conta com senha
    console.log("4. Criando conta com senha...");
    const newAccount = {
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      accountId: targetUser.id,
      providerId: "credential",
      userId: targetUser.id,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(account).values(newAccount);
    console.log("   ✅ Conta com senha criada com sucesso!");

    // Verificar se foi criada
    console.log("5. Verificando conta criada...");
    const createdAccounts = await db.select().from(account).where(eq(account.userId, targetUser.id));
    const passwordAccount = createdAccounts.find(acc => acc.providerId === "credential");
    
    if (passwordAccount) {
      console.log("   ✅ Conta verificada:");
      console.log(`     ID: ${passwordAccount.id}`);
      console.log(`     Provider: ${passwordAccount.providerId}`);
      console.log(`     User ID: ${passwordAccount.userId}`);
      console.log(`     Tem senha: ${passwordAccount.password ? 'Sim' : 'Não'}`);
    }

    console.log("\n🎉 Processo concluído! Agora você pode fazer login com:");
    console.log(`   Email: ${targetEmail}`);
    console.log(`   Senha: ${targetPassword}`);

  } catch (error) {
    console.error("❌ Erro ao criar conta com senha:", error);
  } finally {
    await client.end();
  }
}

createPasswordAccount().then(() => {
  console.log("\n✅ Script finalizado!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});
