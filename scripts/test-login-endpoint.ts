import { config } from "dotenv";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as betterAuthSchema from "../src/lib/better-auth-schema";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

async function testLoginEndpoint() {
  console.log("🔐 Testando endpoint de login...\n");

  try {
    // Configurar Better Auth
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    const client = postgres(connectionString);
    const db = drizzle(client, { schema: betterAuthSchema });

    const auth = betterAuth({
      database: drizzleAdapter(db, {
        provider: "pg",
        schema: betterAuthSchema,
      }),
      socialProviders: {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID as string,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        },
      },
      emailAndPassword: {
        enabled: true,
      },
      secret: process.env.BETTER_AUTH_SECRET as string,
      baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      logger: {
        level: "debug", // Debug para ver erros
      },
    });

    console.log("✅ Better Auth configurado");

    // Simular requisição de login
    console.log("\n🔍 Testando login com credenciais:");
    console.log("   Email: tiago@agenciavibecode.com");
    console.log("   Senha: #Acesso000");

    // Verificar se o usuário existe
    const users = await db.select().from(betterAuthSchema.user).where(
      eq(betterAuthSchema.user.email, "tiago@agenciavibecode.com")
    );

    if (users.length === 0) {
      console.log("❌ Usuário não encontrado!");
      return;
    }

    console.log(`✅ Usuário encontrado: ${users[0].name}`);

    // Verificar se tem conta com senha
    const accounts = await db.select().from(betterAuthSchema.account).where(
      eq(betterAuthSchema.account.userId, users[0].id)
    );

    const passwordAccount = accounts.find(acc => acc.providerId === "credential");
    
    if (!passwordAccount) {
      console.log("❌ Conta com senha não encontrada!");
      return;
    }

    console.log("✅ Conta com senha encontrada");

    // Testar validação de senha
    console.log("\n🔐 Testando validação de senha...");
    
    try {
      // Simular o processo de login do Better Auth
      const bcrypt = await import("bcryptjs");
      const isValidPassword = await bcrypt.compare("#Acesso000", passwordAccount.password);
      
      if (isValidPassword) {
        console.log("✅ Senha válida!");
      } else {
        console.log("❌ Senha inválida!");
      }
    } catch (error) {
      console.log("❌ Erro ao validar senha:", error.message);
    }

    console.log("\n✅ Teste de endpoint concluído!");

  } catch (error) {
    console.error("❌ Erro durante teste:", error);
    console.error("Stack trace:", error.stack);
  }
}

testLoginEndpoint().then(() => {
  console.log("\n🏁 Script finalizado!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});
