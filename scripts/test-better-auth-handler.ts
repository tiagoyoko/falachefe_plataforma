import { config } from "dotenv";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as betterAuthSchema from "../src/lib/better-auth-schema";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

async function testBetterAuthHandler() {
  console.log("🔧 Testando handler do Better Auth...\n");

  try {
    // Configurar conexão com banco
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

    if (!connectionString) {
      console.log("❌ Nenhuma conexão com banco de dados configurada");
      return;
    }

    const client = postgres(connectionString);
    const db = drizzle(client, { schema: betterAuthSchema });

    console.log("✅ Conexão com banco configurada");

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
        level: "debug", // Debug para ver erros
      },
    });

    console.log("✅ Better Auth configurado");

    // Testar se o handler está funcionando
    console.log("\n🔍 Testando handler...");
    
    // Simular uma requisição de login
    const mockRequest = new Request("http://localhost:3000/api/auth/sign-in/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "tiago@agenciavibecode.com",
        password: "#Acesso000",
        callbackURL: "/dashboard"
      }),
    });

    console.log("📤 Simulando requisição de login...");

    try {
      // Tentar processar a requisição
      const response = await auth.handler(mockRequest);
      console.log(`📊 Status: ${response.status}`);
      
      const responseText = await response.text();
      console.log(`📄 Resposta: ${responseText}`);
      
      if (response.ok) {
        console.log("✅ Handler funcionando corretamente!");
      } else {
        console.log("❌ Handler retornou erro!");
      }
    } catch (error) {
      console.error("❌ Erro no handler:", error);
      console.error("Stack trace:", error.stack);
    }

    await client.end();

  } catch (error) {
    console.error("❌ Erro durante teste:", error);
    console.error("Stack trace:", error.stack);
  }
}

testBetterAuthHandler().then(() => {
  console.log("\n🏁 Script finalizado!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});
