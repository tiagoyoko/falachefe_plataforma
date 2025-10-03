import { auth } from "../src/lib/auth";

console.log("🔧 Testando rotas do Better Auth...");

// Verificar se o auth está configurado
console.log("1. Configuração do Better Auth:");
console.log("   - Base URL:", auth.config.baseURL);
console.log("   - Social Providers:", Object.keys(auth.config.socialProviders || {}));
console.log("   - Email/Password:", auth.config.emailAndPassword?.enabled);

// Verificar se o Google está configurado
if (auth.config.socialProviders?.google) {
  console.log("   ✅ Google OAuth configurado");
  console.log("   - Client ID:", auth.config.socialProviders.google.clientId ? "***" : "❌ Não definido");
  console.log("   - Client Secret:", auth.config.socialProviders.google.clientSecret ? "***" : "❌ Não definido");
} else {
  console.log("   ❌ Google OAuth não configurado");
}

// Testar se conseguimos criar um handler
console.log("\n2. Testando criação de handler:");
try {
  const { toNextJsHandler } = require("better-auth/next-js");
  const handler = toNextJsHandler(auth);
  console.log("   ✅ Handler criado com sucesso");
  console.log("   - GET handler:", typeof handler.GET);
  console.log("   - POST handler:", typeof handler.POST);
} catch (error) {
  console.log("   ❌ Erro ao criar handler:", error);
}

console.log("\n🏁 Teste concluído!");
