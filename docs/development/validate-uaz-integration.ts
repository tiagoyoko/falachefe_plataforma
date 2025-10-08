#!/usr/bin/env tsx

/**
 * Script de validação da integração UAZ + Redis + Supabase
 * 
 * Executa testes de integração para verificar se todos os serviços
 * estão funcionando corretamente.
 * 
 * Uso:
 *   npm run validate:uaz
 *   ou
 *   tsx scripts/validate-uaz-integration.ts
 */

import { validateIntegration } from '../../src/lib/uaz-api/validation-test';

async function main() {
  console.log('🚀 Iniciando validação da integração UAZ...\n');
  
  try {
    const result = await validateIntegration();
    
    console.log('\n📊 Resultado da Validação:');
    console.log('========================');
    console.log(`UAZ API: ${result.results.uaz ? '✅' : '❌'}`);
    console.log(`Redis: ${result.results.redis ? '✅' : '❌'}`);
    console.log(`Supabase: ${result.results.supabase ? '✅' : '❌'}`);
    console.log(`Templates: ${result.results.templates ? '✅' : '❌'}`);
    console.log(`Webhook: ${result.results.webhook ? '✅' : '❌'}`);
    console.log(`Overall: ${result.results.overall ? '✅' : '❌'}`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Erros encontrados:');
      result.errors.forEach((error: any, index: number) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    if (result.success) {
      console.log('\n🎉 Integração validada com sucesso!');
      console.log('✅ Fase 1: Fundação e Estrutura - CONCLUÍDA');
      process.exit(0);
    } else {
      console.log('\n⚠️ Integração parcial - alguns serviços falharam');
      console.log('❌ Fase 1: Fundação e Estrutura - PENDENTE');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Erro fatal na validação:', error);
    process.exit(1);
  }
}

main();
