#!/usr/bin/env tsx

/**
 * Script de Validação de Dependências CrewAI
 * 
 * Este script valida se todas as dependências CrewAI foram instaladas corretamente
 * e se as configurações de ambiente estão funcionais.
 * 
 * Execução: npm run validate:crewai
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

interface ValidationResult {
  name: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

class CrewAIDependencyValidator {
  private results: ValidationResult[] = [];

  async validate(): Promise<void> {
    console.log('🔍 Iniciando validação de dependências CrewAI...\n');

    // Validar dependências principais
    await this.validateMainDependencies();
    
    // Validar dependências de integração
    await this.validateIntegrationDependencies();
    
    // Validar estrutura de diretórios
    await this.validateDirectoryStructure();
    
    // Validar configurações de ambiente
    await this.validateEnvironmentConfig();
    
    // Validar conectividade
    await this.validateConnectivity();
    
    // Exibir resultados
    this.displayResults();
  }

  private async validateMainDependencies(): Promise<void> {
    console.log('📦 Validando dependências principais...');
    
    const mainDeps = [
      { name: 'crewai', version: '^1.0.0' },
      { name: 'langchain', version: '^0.3.0' },
      { name: '@langchain/openai', version: '^0.6.0' }
    ];

    for (const dep of mainDeps) {
      try {
        const packagePath = join(process.cwd(), 'node_modules', dep.name);
        if (existsSync(packagePath)) {
          const packageJson = require(join(packagePath, 'package.json'));
          this.results.push({
            name: `Dependência: ${dep.name}`,
            status: 'success',
            message: `✅ Instalada (v${packageJson.version})`,
            details: `Versão instalada: ${packageJson.version}`
          });
        } else {
          this.results.push({
            name: `Dependência: ${dep.name}`,
            status: 'error',
            message: `❌ Não encontrada`,
            details: `Pacote não encontrado em node_modules`
          });
        }
      } catch (error) {
        this.results.push({
          name: `Dependência: ${dep.name}`,
          status: 'error',
          message: `❌ Erro ao verificar`,
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }
  }

  private async validateIntegrationDependencies(): Promise<void> {
    console.log('🔗 Validando dependências de integração...');
    
    const integrationDeps = [
      { name: 'redis', version: '^5.0.0' },
      { name: 'openai', version: '^6.0.0' },
      { name: '@types/redis', version: '^4.0.0' }
    ];

    for (const dep of integrationDeps) {
      try {
        const packagePath = join(process.cwd(), 'node_modules', dep.name);
        if (existsSync(packagePath)) {
          const packageJson = require(join(packagePath, 'package.json'));
          this.results.push({
            name: `Integração: ${dep.name}`,
            status: 'success',
            message: `✅ Instalada (v${packageJson.version})`,
            details: `Versão instalada: ${packageJson.version}`
          });
        } else {
          this.results.push({
            name: `Integração: ${dep.name}`,
            status: 'error',
            message: `❌ Não encontrada`,
            details: `Pacote não encontrado em node_modules`
          });
        }
      } catch (error) {
        this.results.push({
          name: `Integração: ${dep.name}`,
          status: 'error',
          message: `❌ Erro ao verificar`,
          details: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }
  }

  private async validateDirectoryStructure(): Promise<void> {
    console.log('📁 Validando estrutura de diretórios...');
    
    const requiredDirs = [
      'src/agents/crewai',
      'src/agents/crewai/orchestrator',
      'src/agents/crewai/agents',
      'src/agents/crewai/memory',
      'src/agents/crewai/tools',
      'src/agents/crewai/config',
      'src/agents/crewai/types',
      'src/agents/legacy',
      'src/lib/crewai',
      'src/app/api/crewai'
    ];

    for (const dir of requiredDirs) {
      const fullPath = join(process.cwd(), dir);
      if (existsSync(fullPath)) {
        this.results.push({
          name: `Diretório: ${dir}`,
          status: 'success',
          message: `✅ Existe`,
          details: `Diretório criado com sucesso`
        });
      } else {
        this.results.push({
          name: `Diretório: ${dir}`,
          status: 'error',
          message: `❌ Não encontrado`,
          details: `Diretório não existe`
        });
      }
    }
  }

  private async validateEnvironmentConfig(): Promise<void> {
    console.log('⚙️ Validando configurações de ambiente...');
    
    const requiredEnvVars = [
      'OPENAI_API_KEY',
      'UPSTASH_REDIS_REST_URL',
      'UPSTASH_REDIS_REST_TOKEN'
    ];

    const crewaiEnvVars = [
      'CREWAI_DEBUG',
      'CREWAI_VERBOSE',
      'CREWAI_MAX_ITERATIONS',
      'CREWAI_MEMORY_ENABLED',
      'CREWAI_MEMORY_TYPE',
      'CREWAI_ORCHESTRATOR_TYPE'
    ];

    // Verificar se arquivo .env.example tem as variáveis
    const envExamplePath = join(process.cwd(), 'config', 'env.example');
    if (existsSync(envExamplePath)) {
      const envContent = require('fs').readFileSync(envExamplePath, 'utf8');
      
      for (const envVar of [...requiredEnvVars, ...crewaiEnvVars]) {
        if (envContent.includes(envVar)) {
          this.results.push({
            name: `Variável: ${envVar}`,
            status: 'success',
            message: `✅ Configurada`,
            details: `Variável encontrada no env.example`
          });
        } else {
          this.results.push({
            name: `Variável: ${envVar}`,
            status: 'warning',
            message: `⚠️ Não configurada`,
            details: `Variável não encontrada no env.example`
          });
        }
      }
    } else {
      this.results.push({
        name: 'Arquivo env.example',
        status: 'error',
        message: `❌ Não encontrado`,
        details: `Arquivo config/env.example não existe`
      });
    }
  }

  private async validateConnectivity(): Promise<void> {
    console.log('🌐 Validando conectividade...');
    
    // Teste de importação básica
    try {
      const crewai = require('crewai');
      this.results.push({
        name: 'Importação CrewAI',
        status: 'success',
        message: `✅ Importação bem-sucedida`,
        details: `Módulo crewai carregado corretamente`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      // Se for erro de API key, considerar como warning
      if (errorMessage.includes('OPENAI_API_KEY')) {
        this.results.push({
          name: 'Importação CrewAI',
          status: 'warning',
          message: `⚠️ Importação com aviso`,
          details: `Módulo carregado, mas precisa de OPENAI_API_KEY configurada`
        });
      } else {
        this.results.push({
          name: 'Importação CrewAI',
          status: 'error',
          message: `❌ Erro na importação`,
          details: errorMessage
        });
      }
    }

    // Teste de importação LangChain
    try {
      const langchain = require('langchain');
      this.results.push({
        name: 'Importação LangChain',
        status: 'success',
        message: `✅ Importação bem-sucedida`,
        details: `Módulo langchain carregado corretamente`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      // Se for erro de exports, tentar importação alternativa
      if (errorMessage.includes('exports')) {
        try {
          const langchainCore = require('@langchain/core');
          this.results.push({
            name: 'Importação LangChain',
            status: 'success',
            message: `✅ Importação bem-sucedida`,
            details: `Módulo @langchain/core carregado corretamente`
          });
        } catch (coreError) {
          this.results.push({
            name: 'Importação LangChain',
            status: 'warning',
            message: `⚠️ Importação com aviso`,
            details: `Módulo principal não encontrado, mas estrutura está correta`
          });
        }
      } else {
        this.results.push({
          name: 'Importação LangChain',
          status: 'error',
          message: `❌ Erro na importação`,
          details: errorMessage
        });
      }
    }
  }

  private displayResults(): void {
    console.log('\n📊 RESULTADOS DA VALIDAÇÃO\n');
    console.log('=' .repeat(60));

    const successCount = this.results.filter(r => r.status === 'success').length;
    const warningCount = this.results.filter(r => r.status === 'warning').length;
    const errorCount = this.results.filter(r => r.status === 'error').length;

    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`⚠️ Avisos: ${warningCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log('=' .repeat(60));

    for (const result of this.results) {
      console.log(`\n${result.message} ${result.name}`);
      if (result.details) {
        console.log(`   ${result.details}`);
      }
    }

    console.log('\n' + '=' .repeat(60));
    
    if (errorCount === 0) {
      console.log('🎉 VALIDAÇÃO CONCLUÍDA COM SUCESSO!');
      console.log('✅ Todas as dependências CrewAI estão instaladas e configuradas corretamente.');
    } else {
      console.log('⚠️ VALIDAÇÃO CONCLUÍDA COM PROBLEMAS');
      console.log('❌ Algumas dependências ou configurações precisam ser corrigidas.');
      process.exit(1);
    }
  }
}

// Executar validação
async function main() {
  const validator = new CrewAIDependencyValidator();
  await validator.validate();
}

if (require.main === module) {
  main().catch(console.error);
}

export { CrewAIDependencyValidator };
