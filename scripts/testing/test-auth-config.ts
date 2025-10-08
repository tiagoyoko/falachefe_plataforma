import { config } from "dotenv";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as betterAuthSchema from "../src/lib/better-auth-schema";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

async function testAuthConfig() {
  console.log("🔧 Testando configuração do Better Auth...\n");

  try {
    // 1. Verificar variáveis de ambiente
    console.log("1. Verificando variáveis de ambiente:");
    const requiredEnvVars = [
      'BETTER_AUTH_SECRET',
      'NEXT_PUBLIC_APP_URL',
      'DATABASE_URL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET'
    ];

    for (const envVar of requiredEnvVars) {
      const value = process.env[envVar];
      if (value) {
        console.log(`   ✅ ${envVar}: ${envVar.includes('SECRET') || envVar.includes('KEY') ? '***' : value}`);
      } else {
        console.log(`   ❌ ${envVar}: NÃO DEFINIDA`);
      }
    }

    // 2. Testar conexão com banco
    console.log("\n2. Testando conexão com banco de dados:");
    const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;
    
    if (!connectionString) {
      console.error("   ❌ DATABASE_URL não encontrada!");
      return;
    }

    const client = postgres(connectionString);
    const db = drizzle(client, { schema: betterAuthSchema });
    
    // Testar query simples
    const users = await db.select().from(betterAuthSchema.user).limit(1);
    console.log(`   ✅ Conexão com banco OK (${users.length} usuários encontrados)`);

    // 3. Testar configuração do Better Auth
    console.log("\n3. Testando configuração do Better Auth:");
    
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
        level: "debug", // Temporariamente debug para ver erros
      },
    });

    console.log("   ✅ Configuração do Better Auth criada com sucesso");

    // 4. Testar se as tabelas existem e têm a estrutura correta
    console.log("\n4. Verificando estrutura das tabelas:");
    
    const tableChecks = [
      { name: 'user', schema: betterAuthSchema.user },
      { name: 'session', schema: betterAuthSchema.session },
      { name: 'account', schema: betterAuthSchema.account },
      { name: 'verification', schema: betterAuthSchema.verification }
    ];

    for (const table of tableChecks) {
      try {
        const result = await db.select().from(table.schema).limit(1);
        console.log(`   ✅ Tabela ${table.name}: OK`);
      } catch (error) {
        console.log(`   ❌ Tabela ${table.name}: ERRO - ${error.message}`);
      }
    }

    console.log("\n✅ Teste de configuração concluído com sucesso!");

  } catch (error) {
    console.error("❌ Erro durante teste de configuração:", error);
    console.error("Stack trace:", error.stack);
  }
}

testAuthConfig().then(() => {
  console.log("\n🏁 Script finalizado!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});