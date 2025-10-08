import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as betterAuthSchema from "../src/lib/better-auth-schema";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

async function fixPasswordHash() {
  console.log("🔧 Corrigindo hash da senha para Better Auth...\n");

  try {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
      console.log("❌ Nenhuma conexão com banco de dados configurada");
      return;
    }

    const client = postgres(connectionString);
    const db = drizzle(client, { schema: betterAuthSchema });

    // Encontrar o usuário
    const targetEmail = "tiago@agenciavibecode.com";
    console.log(`1. Procurando usuário: ${targetEmail}`);
    
    const users = await db.select().from(betterAuthSchema.user).where(
      eq(betterAuthSchema.user.email, targetEmail)
    );

    if (users.length === 0) {
      console.log("❌ Usuário não encontrado!");
      return;
    }

    const targetUser = users[0];
    console.log(`✅ Usuário encontrado: ${targetUser.name} (ID: ${targetUser.id})`);

    // Encontrar a conta com senha
    const accounts = await db.select().from(betterAuthSchema.account).where(
      eq(betterAuthSchema.account.userId, targetUser.id)
    );

    const passwordAccount = accounts.find(acc => acc.providerId === "credential");
    
    if (!passwordAccount) {
      console.log("❌ Conta com senha não encontrada!");
      return;
    }

    console.log(`✅ Conta com senha encontrada: ${passwordAccount.id}`);

    // O Better Auth usa scrypt para hash de senhas
    // Vou usar o mesmo algoritmo que o Better Auth usa
    const crypto = await import("crypto");
    
    // Gerar salt aleatório
    const salt = crypto.randomBytes(16);
    
    // Hash da senha com scrypt (mesmo algoritmo do Better Auth)
    const password = "#Acesso000";
    const hash = crypto.scryptSync(password, salt, 64);
    
    // Combinar salt + hash em formato hexadecimal
    const combined = Buffer.concat([salt, hash]);
    const hexHash = combined.toString('hex');
    
    console.log("2. Gerando hash correto para Better Auth...");
    console.log(`   Salt length: ${salt.length} bytes`);
    console.log(`   Hash length: ${hash.length} bytes`);
    console.log(`   Combined length: ${combined.length} bytes`);
    console.log(`   Hex hash length: ${hexHash.length} caracteres`);

    // Atualizar a senha no banco
    console.log("3. Atualizando senha no banco...");
    
    await db.update(betterAuthSchema.account)
      .set({ 
        password: hexHash,
        updatedAt: new Date()
      })
      .where(eq(betterAuthSchema.account.id, passwordAccount.id));

    console.log("✅ Senha atualizada com sucesso!");

    // Verificar se foi atualizada
    const updatedAccount = await db.select().from(betterAuthSchema.account).where(
      eq(betterAuthSchema.account.id, passwordAccount.id)
    );

    if (updatedAccount.length > 0) {
      console.log("✅ Verificação:");
      console.log(`   ID: ${updatedAccount[0].id}`);
      console.log(`   Provider: ${updatedAccount[0].providerId}`);
      console.log(`   Tem senha: ${updatedAccount[0].password ? 'Sim' : 'Não'}`);
      console.log(`   Tamanho do hash: ${updatedAccount[0].password?.length || 0} caracteres`);
    }

    console.log("\n🎉 Senha corrigida! Agora você pode fazer login com:");
    console.log(`   Email: ${targetEmail}`);
    console.log(`   Senha: ${password}`);

    await client.end();

  } catch (error) {
    console.error("❌ Erro ao corrigir hash:", error);
    console.error("Stack trace:", error.stack);
  }
}

fixPasswordHash().then(() => {
  console.log("\n✅ Script finalizado!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});
