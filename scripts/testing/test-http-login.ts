import { config } from "dotenv";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

async function testHttpLogin() {
  console.log("🌐 Testando login via HTTP...\n");

  try {
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const loginUrl = `${baseURL}/api/auth/sign-in/email`;

    console.log(`📡 URL do endpoint: ${loginUrl}`);

    const loginData = {
      email: "tiago@agenciavibecode.com",
      password: "#Acesso000",
      callbackURL: "/dashboard"
    };

    console.log("📤 Enviando requisição de login...");
    console.log("   Dados:", { ...loginData, password: "***" });

    const response = await fetch(loginUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(loginData),
    });

    console.log(`📊 Status da resposta: ${response.status} ${response.statusText}`);

    // Log dos headers
    console.log("\n📋 Headers da resposta:");
    for (const [key, value] of response.headers.entries()) {
      console.log(`   ${key}: ${value}`);
    }

    // Tentar ler o corpo da resposta
    const responseText = await response.text();
    console.log(`\n📄 Corpo da resposta (${responseText.length} caracteres):`);
    
    try {
      const responseJson = JSON.parse(responseText);
      console.log(JSON.stringify(responseJson, null, 2));
    } catch {
      console.log(responseText);
    }

    if (response.ok) {
      console.log("\n✅ Login realizado com sucesso!");
    } else {
      console.log("\n❌ Erro no login!");
    }

  } catch (error) {
    console.error("❌ Erro durante teste HTTP:", error);
    console.error("Stack trace:", error.stack);
  }
}

testHttpLogin().then(() => {
  console.log("\n🏁 Script finalizado!");
  process.exit(0);
}).catch((error) => {
  console.error("❌ Erro fatal:", error);
  process.exit(1);
});
