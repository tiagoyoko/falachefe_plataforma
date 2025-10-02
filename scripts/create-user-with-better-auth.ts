import { config } from "dotenv";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import * as betterAuthSchema from "../src/lib/better-auth-schema";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

async function createUserWithBetterAuth() {
  console.log("👤 Criando usuário usando Better Auth...\n");

  try {
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
      console.log("❌ Nenhuma conexão com banco de dados configurada");
      return;
    }

    const client = postgres(connectionString);
    const db = drizzle(client, { schema: betterAuthSchema });

    // Configurar Better Auth
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
        level: "debug",
      },
    });

    console.log("✅ Better Auth configurado");

    // Remover usuário existente se houver
    console.log("1. Removendo usuário existente...");
    const existingUsers = await db.select().from(betterAuthSchema.user).where(
      eq(betterAuthSchema.user.email, "tiago@agenciavibecode.com")
    );

    if (existingUsers.length > 0) {
      const userId = existingUsers[0].id;
      
      // Remover contas associadas
      await db.delete(betterAuthSchema.account).where(
        eq(betterAuthSchema.account.userId, userId)
      );
      
      // Remover sessões
      await db.delete(betterAuthSchema.session).where(
        eq(betterAuthSchema.session.userId, userId)
      );
      
      // Remover usuário
      await db.delete(betterAuthSchema.user).where(
        eq(betterAuthSchema.user.id, userId)
      );
      
      console.log("✅ Usuário existente removido");
    }

    // Criar usuário usando Better Auth
    console.log("2. Criando usuário com Better Auth...");
    
    // Simular requisição de signup
    const signupRequest = new Request("http://localhost:3000/api/auth/sign-up/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "tiago@agenciavibecode.com",
        password: "#Acesso000",
        name: "Tiago Yokoyama",
        callbackURL: "/dashboard"
      }),
    });

    console.log("📤 Enviando requisição de signup...");
    
    try {
      const response = await auth.handler(signupRequest);
      console.log(`📊 Status: ${response.status}`);
      
      const responseText = await response.text();
      console.log(`📄 Resposta: ${responseText}`);
      
      if (response.ok) {
        console.log("✅ Usuário criado com sucesso!");
        
        // Verificar se foi criado
        const newUsers = await db.select().from(betterAuthSchema.user).where(
          eq(betterAuthSchema.user.email, "tiago@agenciavibecode.com")
        );
        
        if (newUsers.length > 0) {
          console.log(`✅ Usuário verificado: ${newUsers[0].name} (ID: ${newUsers[0].id})`);
          
          // Verificar conta
          const accounts = await db.select().from(betterAuthSchema.account).where(
            eq(betterAuthSchema.account.userId, newUsers[0].id)
          );
          
          const passwordAccount = accounts.find(acc => acc.providerId === "credential");
          if (passwordAccount) {
            console.log(`✅ Conta com senha criada: ${passwordAccount.id}`);
            console.log(`   Hash length: ${passwordAccount.password?.length || 0} caracteres`);
          }
        }
      } else {
        console.log("❌ Erro ao criar usuário!");
      }
    } catch (error) {
      console.error("❌ Erro no signup:", error);
    }

    await client.end();

  } catch (error) {
    console.error("❌ Erro durante criação:", error);
    console.error("Stack trace:", error.stack);
  }
}

createUserWithBetterAuth().then(() => {
  console.log("\n🏁 Script finalizado!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});
