#!/usr/bin/env node

/**
 * Script para executar testes dos agentes
 */

const { execSync } = require('child_process')
const path = require('path')

console.log('🧪 Executando testes dos agentes...\n')

try {
  // Executar testes unitários
  console.log('📋 Executando testes unitários...')
  execSync('npx jest --config jest.config.agents.js --testPathPattern=".*\\.test\\.ts$" --testPathIgnorePatterns=".*\\.performance\\.test\\.ts$"', {
    stdio: 'inherit',
    cwd: process.cwd()
  })

  console.log('\n✅ Testes unitários concluídos com sucesso!')

  // Executar testes de performance (opcional)
  const runPerformanceTests = process.argv.includes('--performance')
  
  if (runPerformanceTests) {
    console.log('\n⚡ Executando testes de performance...')
    execSync('npx jest --config jest.config.agents.js --testPathPattern=".*\\.performance\\.test\\.ts$"', {
      stdio: 'inherit',
      cwd: process.cwd()
    })
    console.log('\n✅ Testes de performance concluídos!')
  }

  // Executar testes de integração
  console.log('\n🔗 Executando testes de integração...')
  execSync('npx jest --config jest.config.agents.js --testPathPattern=".*integration.*\\.test\\.ts$"', {
    stdio: 'inherit',
    cwd: process.cwd()
  })

  console.log('\n✅ Testes de integração concluídos!')

  // Gerar relatório de cobertura
  console.log('\n📊 Gerando relatório de cobertura...')
  execSync('npx jest --config jest.config.agents.js --coverage --coverageReporters=text --coverageReporters=html', {
    stdio: 'inherit',
    cwd: process.cwd()
  })

  console.log('\n🎉 Todos os testes dos agentes foram executados com sucesso!')
  console.log('\n📁 Relatórios gerados em:')
  console.log('   - coverage/agents/lcov-report/index.html')
  console.log('   - coverage/agents/coverage-final.json')

} catch (error) {
  console.error('\n❌ Erro ao executar testes dos agentes:')
  console.error(error.message)
  process.exit(1)
}
