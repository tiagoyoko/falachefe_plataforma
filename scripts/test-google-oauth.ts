#!/usr/bin/env tsx

/**
 * Script para testar configuração do Google OAuth
 */

import { auth } from "../src/lib/auth";

async function testGoogleOAuth() {
  console.log("🔍 Testando configuração do Google OAuth...\n");

  // Verificar variáveis de ambiente
  console.log("📋 Variáveis de Ambiente:");
  console.log(`GOOGLE_CLIENT_ID: ${process.env.GOOGLE_CLIENT_ID ? "✅ Configurado" : "❌ Não configurado"}`);
  console.log(`GOOGLE_CLIENT_SECRET: ${process.env.GOOGLE_CLIENT_SECRET ? "✅ Configurado" : "❌ Não configurado"}`);
  console.log(`NEXT_PUBLIC_APP_URL: ${process.env.NEXT_PUBLIC_APP_URL || "❌ Não configurado"}`);
  console.log(`BETTER_AUTH_SECRET: ${process.env.BETTER_AUTH_SECRET ? "✅ Configurado" : "❌ Não configurado"}\n`);

  // Verificar configuração do Better Auth
  console.log("🔧 Configuração do Better Auth:");
  try {
    const authConfig = auth;
    console.log("✅ Better Auth configurado corretamente");
    console.log(`Base URL: ${process.env.NEXT_PUBLIC_APP_URL}`);
    
    if (authConfig.socialProviders?.google) {
      console.log("✅ Google OAuth configurado no Better Auth");
      console.log(`Client ID: ${authConfig.socialProviders.google.clientId?.substring(0, 20)}...`);
    } else {
      console.log("❌ Google OAuth não configurado no Better Auth");
    }
  } catch (error) {
    console.log("❌ Erro na configuração do Better Auth:", error);
  }

  console.log("\n📝 Instruções para configurar Google OAuth:");
  console.log("1. Acesse: https://console.developers.google.com/");
  console.log("2. Selecione seu projeto ou crie um novo");
  console.log("3. Vá em 'APIs e Serviços' > 'Credenciais'");
  console.log("4. Clique no Client ID do OAuth 2.0");
  console.log("5. Em 'URIs de redirecionamento autorizados', adicione:");
  console.log(`   - ${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`);
  console.log("6. Em 'Origens JavaScript autorizadas', adicione:");
  console.log(`   - ${process.env.NEXT_PUBLIC_APP_URL}`);
  console.log("\n🔗 URLs que devem estar configuradas no Google Console:");
  console.log(`- Redirect URI: ${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback/google`);
  console.log(`- JavaScript Origins: ${process.env.NEXT_PUBLIC_APP_URL}`);
}

testGoogleOAuth().catch(console.error);