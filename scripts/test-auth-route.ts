#!/usr/bin/env tsx

import { config } from "dotenv";

// Carregar variáveis de ambiente
config({ path: ".env.local" });

async function testAuthRoute() {
  console.log("🔐 Testando rota de autenticação...");
  
  try {
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    
    console.log(`\n📡 Testando ${baseURL}/api/auth/signin`);
    
    const response = await fetch(`${baseURL}/api/auth/signin`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });
    
    console.log(`  Status: ${response.status} ${response.statusText}`);
    console.log(`  Headers:`, Object.fromEntries(response.headers.entries()));
    
    if (response.ok) {
      const data = await response.text();
      console.log(`  Response: ${data.substring(0, 200)}...`);
    }
    
  } catch (error) {
    console.error("❌ Erro ao testar rota de auth:");
    console.error(error);
  }
}

// Executar teste
testAuthRoute();
