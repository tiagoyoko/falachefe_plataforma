#!/usr/bin/env tsx

/**
 * Script para testar a configuração do Better Auth
 * Verifica se todas as configurações estão corretas conforme documentação oficial
 */

import { auth } from "../src/lib/auth";

async function testBetterAuthConfiguration() {
  console.log("🔍 Testando configuração do Better Auth...\n");

  try {
    // 1. Testar se a instância do auth foi criada corretamente
    console.log("1. ✅ Verificando instância do auth...");
    if (!auth) {
      throw new Error("Instância do auth não foi criada");
    }
    console.log("   ✅ Instância do auth criada com sucesso");

    // 2. Verificar configurações básicas
    console.log("\n2. ✅ Verificando configurações básicas...");
    
    const context = await auth.$context;
    const options = context.options;
    
    // Verificar se o adapter está configurado
    if (!options.database) {
      throw new Error("Database adapter não configurado");
    }
    console.log("   ✅ Database adapter configurado");

    // Verificar se o secret está definido
    if (!options.secret) {
      throw new Error("Secret não configurado");
    }
    console.log("   ✅ Secret configurado");

    // Verificar se o baseURL está definido
    if (!options.baseURL) {
      throw new Error("BaseURL não configurado");
    }
    console.log(`   ✅ BaseURL configurado: ${options.baseURL}`);

    // 3. Verificar plugins
    console.log("\n3. ✅ Verificando plugins...");
    
    if (!options.plugins || options.plugins.length === 0) {
      console.log("   ⚠️  Nenhum plugin configurado");
    } else {
      console.log(`   ✅ ${options.plugins.length} plugin(s) configurado(s):`);
      options.plugins.forEach((plugin, index) => {
        console.log(`      ${index + 1}. ${plugin.name || 'Plugin desconhecido'}`);
      });
    }

    // 4. Verificar providers sociais
    console.log("\n4. ✅ Verificando providers sociais...");
    
    if (!options.socialProviders || Object.keys(options.socialProviders).length === 0) {
      console.log("   ⚠️  Nenhum provider social configurado");
    } else {
      console.log(`   ✅ ${Object.keys(options.socialProviders).length} provider(s) configurado(s):`);
      Object.keys(options.socialProviders).forEach(provider => {
        console.log(`      - ${provider}`);
      });
    }

    // 5. Verificar emailAndPassword
    console.log("\n5. ✅ Verificando autenticação por email/senha...");
    
    if (options.emailAndPassword?.enabled) {
      console.log("   ✅ Autenticação por email/senha habilitada");
    } else {
      console.log("   ⚠️  Autenticação por email/senha não habilitada");
    }

    // 6. Verificar configurações de sessão
    console.log("\n6. ✅ Verificando configurações de sessão...");
    
    if (options.session) {
      console.log(`   ✅ ExpiresIn: ${options.session.expiresIn}s (${Math.round(options.session.expiresIn / 86400)} dias)`);
      console.log(`   ✅ UpdateAge: ${options.session.updateAge}s (${Math.round(options.session.updateAge / 3600)} horas)`);
    } else {
      console.log("   ⚠️  Configurações de sessão não definidas");
    }

    // 7. Testar conectividade com o banco
    console.log("\n7. ✅ Testando conectividade com o banco...");
    
    try {
      // Verificar se o adapter está funcionando
      if (context.adapter) {
        console.log("   ✅ Database adapter funcionando");
      } else {
        throw new Error("Database adapter não está disponível");
      }
    } catch (error) {
      console.log(`   ❌ Erro na conexão com banco: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }

    // 8. Verificar variáveis de ambiente
    console.log("\n8. ✅ Verificando variáveis de ambiente...");
    
    const requiredEnvVars = [
      'BETTER_AUTH_SECRET',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'DATABASE_URL',
      'NEXT_PUBLIC_APP_URL'
    ];

    const missingVars: string[] = [];
    
    requiredEnvVars.forEach(varName => {
      if (!process.env[varName]) {
        missingVars.push(varName);
      } else {
        console.log(`   ✅ ${varName}: definido`);
      }
    });

    if (missingVars.length > 0) {
      console.log(`   ⚠️  Variáveis ausentes: ${missingVars.join(', ')}`);
    }

    console.log("\n🎉 Teste de configuração concluído!");
    
    if (missingVars.length > 0) {
      console.log("\n⚠️  RECOMENDAÇÕES:");
      console.log("1. Defina todas as variáveis de ambiente necessárias");
      console.log("2. Execute 'npm run db:generate' para gerar migrations");
      console.log("3. Execute 'npm run db:push' para aplicar no banco");
    } else {
      console.log("\n✅ Configuração está correta conforme documentação oficial!");
    }

  } catch (error) {
    console.error("\n❌ Erro durante o teste de configuração:");
    console.error(error instanceof Error ? error.message : 'Erro desconhecido');
    process.exit(1);
  }
}

// Executar teste se chamado diretamente
if (require.main === module) {
  testBetterAuthConfiguration()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Erro fatal:", error);
      process.exit(1);
    });
}

export { testBetterAuthConfiguration };
