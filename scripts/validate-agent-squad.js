#!/usr/bin/env node

/**
 * Validation script for Agent Squad Framework integration
 * Tests the integration between Agent Squad and the chat API
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

console.log('🚀 Starting Agent Squad Framework validation...\n')

// Check if required environment variables are set
function checkEnvironmentVariables() {
  console.log('📋 Checking environment variables...')
  
  const requiredVars = [
    'OPENAI_API_KEY',
    'DATABASE_URL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN'
  ]
  
  const missing = []
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      missing.push(varName)
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:')
    missing.forEach(varName => console.error(`   - ${varName}`))
    console.error('\nPlease set these variables in your .env.local file')
    return false
  }
  
  console.log('✅ All required environment variables are set')
  return true
}

// Check if required files exist
function checkRequiredFiles() {
  console.log('\n📁 Checking required files...')
  
  const requiredFiles = [
    'src/agents/core/agent-squad-setup.ts',
    'src/agents/config/agent-squad-config.ts',
    'src/app/api/chat/route.ts',
    'src/agents/tests/agent-squad-integration.test.ts'
  ]
  
  const missing = []
  
  for (const filePath of requiredFiles) {
    if (!fs.existsSync(filePath)) {
      missing.push(filePath)
    }
  }
  
  if (missing.length > 0) {
    console.error('❌ Missing required files:')
    missing.forEach(filePath => console.error(`   - ${filePath}`))
    return false
  }
  
  console.log('✅ All required files exist')
  return true
}

// Run linting
function runLinting() {
  console.log('\n🔍 Running linting...')
  
  try {
    execSync('npm run lint', { stdio: 'inherit' })
    console.log('✅ Linting passed')
    return true
  } catch (error) {
    console.error('❌ Linting failed')
    return false
  }
}

// Run type checking
function runTypeChecking() {
  console.log('\n🔍 Running type checking...')
  
  try {
    execSync('npm run typecheck', { stdio: 'inherit' })
    console.log('✅ Type checking passed')
    return true
  } catch (error) {
    console.error('❌ Type checking failed')
    return false
  }
}

// Test API endpoint
async function testAPIEndpoint() {
  console.log('\n🌐 Testing API endpoint...')
  
  try {
    // Start the development server in the background
    console.log('Starting development server...')
    const serverProcess = execSync('npm run dev &', { stdio: 'pipe' })
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 5000))
    
    // Test the health check endpoint
    const response = await fetch('http://localhost:3000/api/chat', {
      method: 'GET'
    })
    
    if (response.ok) {
      const data = await response.json()
      console.log('✅ API endpoint is responding')
      console.log(`   Status: ${data.status}`)
      return true
    } else {
      console.error('❌ API endpoint returned error:', response.status)
      return false
    }
  } catch (error) {
    console.error('❌ API endpoint test failed:', error.message)
    return false
  }
}

// Main validation function
async function validateAgentSquad() {
  console.log('🎯 Agent Squad Framework Validation\n')
  console.log('=' .repeat(50))
  
  let allPassed = true
  
  // Run all validation checks
  allPassed &= checkEnvironmentVariables()
  allPassed &= checkRequiredFiles()
  allPassed &= runLinting()
  allPassed &= runTypeChecking()
  
  // Only test API if other checks pass
  if (allPassed) {
    allPassed &= await testAPIEndpoint()
  }
  
  console.log('\n' + '=' .repeat(50))
  
  if (allPassed) {
    console.log('🎉 All validation checks passed!')
    console.log('✅ Agent Squad Framework is ready for use')
  } else {
    console.log('❌ Some validation checks failed')
    console.log('Please fix the issues above before proceeding')
    process.exit(1)
  }
}

// Run validation
validateAgentSquad().catch(error => {
  console.error('❌ Validation failed with error:', error)
  process.exit(1)
})
