#!/usr/bin/env tsx

/**
 * Script de Teste de Conectividade CrewAI
 * 
 * Este script testa a conectividade com Redis e OpenAI
 * para validar se as configurações estão funcionais.
 * 
 * Execução: npm run test:crewai:connectivity
 */

import { createClient } from 'redis';
import OpenAI from 'openai';
import { config } from 'dotenv';

// Carregar variáveis de ambiente
config({ path: '.env.local' });
config({ path: '.env' });

interface ConnectivityTest {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
  duration?: number;
}

class CrewAIConnectivityTester {
  private results: ConnectivityTest[] = [];

  async testAll(): Promise<void> {
    console.log('🔍 Iniciando testes de conectividade CrewAI...\n');

    // Teste de conectividade Redis
    await this.testRedisConnection();
    
    // Teste de conectividade OpenAI
    await this.testOpenAIConnection();
    
    // Teste de configuração CrewAI
    await this.testCrewAIConfiguration();
    
    // Exibir resultados
    this.displayResults();
  }

  private async testRedisConnection(): Promise<void> {
    console.log('🔴 Testando conectividade Redis...');
    const startTime = Date.now();

    try {
      const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
      const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;

      if (!redisUrl || !redisToken) {
        this.results.push({
          name: 'Redis Connection',
          status: 'error',
          message: '❌ Configuração incompleta',
          details: 'UPSTASH_REDIS_REST_URL ou UPSTASH_REDIS_REST_TOKEN não configurados',
          duration: Date.now() - startTime
        });
        return;
      }

      // Teste básico de conectividade
      const response = await fetch(`${redisUrl}/ping`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${redisToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        this.results.push({
          name: 'Redis Connection',
          status: 'success',
          message: '✅ Conectividade Redis OK',
          details: `Resposta: ${response.status} ${response.statusText}`,
          duration: Date.now() - startTime
        });
      } else {
        this.results.push({
          name: 'Redis Connection',
          status: 'error',
          message: '❌ Erro na conectividade Redis',
          details: `Status: ${response.status} ${response.statusText}`,
          duration: Date.now() - startTime
        });
      }
    } catch (error) {
      this.results.push({
        name: 'Redis Connection',
        status: 'error',
        message: '❌ Erro na conexão Redis',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        duration: Date.now() - startTime
      });
    }
  }

  private async testOpenAIConnection(): Promise<void> {
    console.log('🤖 Testando conectividade OpenAI...');
    const startTime = Date.now();

    try {
      const apiKey = process.env.OPENAI_API_KEY;

      if (!apiKey) {
        this.results.push({
          name: 'OpenAI Connection',
          status: 'error',
          message: '❌ API Key não configurada',
          details: 'OPENAI_API_KEY não encontrada nas variáveis de ambiente',
          duration: Date.now() - startTime
        });
        return;
      }

      const openai = new OpenAI({
        apiKey: apiKey
      });

      // Teste básico de conectividade
      const response = await openai.models.list();
      
      this.results.push({
        name: 'OpenAI Connection',
        status: 'success',
        message: '✅ Conectividade OpenAI OK',
        details: `Modelos disponíveis: ${response.data.length}`,
        duration: Date.now() - startTime
      });
    } catch (error) {
      this.results.push({
        name: 'OpenAI Connection',
        status: 'error',
        message: '❌ Erro na conectividade OpenAI',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        duration: Date.now() - startTime
      });
    }
  }

  private async testCrewAIConfiguration(): Promise<void> {
    console.log('⚙️ Testando configuração CrewAI...');
    const startTime = Date.now();

    try {
      // Verificar se as variáveis de ambiente CrewAI estão configuradas
      const crewaiVars = {
        CREWAI_DEBUG: process.env.CREWAI_DEBUG,
        CREWAI_VERBOSE: process.env.CREWAI_VERBOSE,
        CREWAI_MAX_ITERATIONS: process.env.CREWAI_MAX_ITERATIONS,
        CREWAI_MEMORY_ENABLED: process.env.CREWAI_MEMORY_ENABLED,
        CREWAI_MEMORY_TYPE: process.env.CREWAI_MEMORY_TYPE,
        CREWAI_ORCHESTRATOR_TYPE: process.env.CREWAI_ORCHESTRATOR_TYPE
      };

      const configuredVars = Object.entries(crewaiVars).filter(([_, value]) => value !== undefined);
      const totalVars = Object.keys(crewaiVars).length;

      if (configuredVars.length === totalVars) {
        this.results.push({
          name: 'CrewAI Configuration',
          status: 'success',
          message: '✅ Configuração CrewAI completa',
          details: `Todas as ${totalVars} variáveis configuradas`,
          duration: Date.now() - startTime
        });
      } else {
        this.results.push({
          name: 'CrewAI Configuration',
          status: 'warning',
          message: '⚠️ Configuração CrewAI parcial',
          details: `${configuredVars.length}/${totalVars} variáveis configuradas`,
          duration: Date.now() - startTime
        });
      }

      // Teste de importação CrewAI
      try {
        const crewai = require('crewai');
        this.results.push({
          name: 'CrewAI Import',
          status: 'success',
          message: '✅ Importação CrewAI OK',
          details: 'Módulo crewai carregado com sucesso',
          duration: Date.now() - startTime
        });
      } catch (error) {
        this.results.push({
          name: 'CrewAI Import',
          status: 'error',
          message: '❌ Erro na importação CrewAI',
          details: error instanceof Error ? error.message : 'Erro desconhecido',
          duration: Date.now() - startTime
        });
      }

    } catch (error) {
      this.results.push({
        name: 'CrewAI Configuration',
        status: 'error',
        message: '❌ Erro na configuração CrewAI',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
        duration: Date.now() - startTime
      });
    }
  }

  private displayResults(): void {
    console.log('\n📊 RESULTADOS DOS TESTES DE CONECTIVIDADE\n');
    console.log('=' .repeat(60));

    const successCount = this.results.filter(r => r.status === 'success').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;

    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`⚠️ Avisos: ${warningCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log('=' .repeat(60));

    for (const result of this.results) {
      const duration = result.duration ? ` (${result.duration}ms)` : '';
      console.log(`\n${result.message} ${result.name}${duration}`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
    }

    console.log('\n' + '=' .repeat(60));
    
    if (errorCount === 0) {
      console.log('🎉 TESTES DE CONECTIVIDADE CONCLUÍDOS COM SUCESSO!');
      console.log('✅ Todas as conexões estão funcionais.');
    } else {
      console.log('⚠️ TESTES CONCLUÍDOS COM PROBLEMAS');
      console.log('❌ Algumas conexões precisam ser corrigidas.');
      process.exit(1);
    }
  }
}

// Executar testes
async function main() {
  const tester = new CrewAIConnectivityTester();
  await tester.testAll();
}

if (require.main === module) {
  main().catch(console.error);
}

export { CrewAIConnectivityTester };






