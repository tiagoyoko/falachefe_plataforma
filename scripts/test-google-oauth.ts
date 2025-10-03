import { auth } from "../src/lib/auth";

console.log("🔧 Testando configuração do Google OAuth...");

// Verificar se o auth está configurado corretamente
console.log("1. Verificando configuração do Better Auth:");
console.log("   - Base URL:", auth.config.baseURL);
console.log("   - Social Providers:", Object.keys(auth.config.socialProviders || {}));

// Verificar se o Google está configurado
if (auth.config.socialProviders?.google) {
  console.log("   ✅ Google OAuth configurado");
  console.log("   - Client ID:", auth.config.socialProviders.google.clientId ? "***" : "❌ Não definido");
  console.log("   - Client Secret:", auth.config.socialProviders.google.clientSecret ? "***" : "❌ Não definido");
} else {
  console.log("   ❌ Google OAuth não configurado");
}

// Verificar rotas disponíveis
console.log("\n2. Verificando rotas disponíveis:");
console.log("   - Email/Password:", auth.config.emailAndPassword?.enabled ? "✅ Habilitado" : "❌ Desabilitado");
console.log("   - Social Providers:", auth.config.socialProviders ? "✅ Configurado" : "❌ Não configurado");

// Testar se conseguimos criar um cliente de teste
console.log("\n3. Testando criação de cliente:");
try {
  const testClient = auth.api;
  console.log("   ✅ Cliente de API criado com sucesso");
} catch (error) {
  console.log("   ❌ Erro ao criar cliente:", error);
}

console.log("\n🏁 Teste concluído!");
