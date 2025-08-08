#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function logSection(title) {
  console.log('\n' + '='.repeat(50))
  log(title, 'cyan')
  console.log('='.repeat(50))
}

function runCommand(command, description) {
  log(`\n${description}...`, 'yellow')
  try {
    const result = execSync(command, { 
      stdio: 'inherit',
      cwd: process.cwd()
    })
    log(`✅ ${description} completed successfully`, 'green')
    return true
  } catch (error) {
    log(`❌ ${description} failed`, 'red')
    return false
  }
}

function checkTestFiles() {
  logSection('Checking Test Files')
  
  const testDirs = [
    'tests/__tests__',
    'app/__tests__',
    'components/__tests__',
    'lib/__tests__',
  ]
  
  let totalTests = 0
  const testFiles = []
  
  testDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir)
        .filter(file => file.endsWith('.test.ts') || file.endsWith('.test.tsx'))
      
      files.forEach(file => {
        testFiles.push(path.join(dir, file))
        totalTests++
      })
    }
  })
  
  log(`Found ${totalTests} test files:`, 'blue')
  testFiles.forEach(file => {
    log(`  📄 ${file}`, 'green')
  })
  
  return testFiles
}

function runUnitTests() {
  logSection('Running Unit Tests')
  
  const commands = [
    {
      command: 'npm run test -- --passWithNoTests --verbose',
      description: 'Unit tests with Jest'
    },
    {
      command: 'npm run test -- --coverage --passWithNoTests',
      description: 'Unit tests with coverage'
    }
  ]
  
  let success = true
  commands.forEach(({ command, description }) => {
    if (!runCommand(command, description)) {
      success = false
    }
  })
  
  return success
}

function runIntegrationTests() {
  logSection('Running Integration Tests')
  
  // Check if we have integration test files
  const integrationTestFiles = [
    'tests/__tests__/api-endpoints.test.ts',
    'tests/__tests__/auth.test.ts',
    'tests/__tests__/avatar-system.test.ts',
    'tests/__tests__/challenge-system.test.ts',
  ]
  
  const existingFiles = integrationTestFiles.filter(file => fs.existsSync(file))
  
  if (existingFiles.length === 0) {
    log('No integration test files found', 'yellow')
    return true
  }
  
  log(`Found ${existingFiles.length} integration test files`, 'blue')
  existingFiles.forEach(file => {
    log(`  📄 ${file}`, 'green')
  })
  
  const command = 'npm run test -- --testPathPattern="integration|api-endpoints|auth|avatar-system|challenge-system" --passWithNoTests'
  return runCommand(command, 'Integration tests')
}

function runComponentTests() {
  logSection('Running Component Tests')
  
  // Check for component test files
  const componentTestDirs = [
    'components/__tests__',
    'app/__tests__',
  ]
  
  let hasComponentTests = false
  componentTestDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      const files = fs.readdirSync(dir)
        .filter(file => file.endsWith('.test.tsx'))
      
      if (files.length > 0) {
        hasComponentTests = true
        log(`Found ${files.length} component test files in ${dir}:`, 'blue')
        files.forEach(file => {
          log(`  📄 ${file}`, 'green')
        })
      }
    }
  })
  
  if (!hasComponentTests) {
    log('No component test files found', 'yellow')
    return true
  }
  
  const command = 'npm run test -- --testPathPattern="components|app" --passWithNoTests'
  return runCommand(command, 'Component tests')
}

function runE2ETests() {
  logSection('Running End-to-End Tests')
  
  // Check if Playwright is configured
  if (!fs.existsSync('playwright.config.ts') && !fs.existsSync('playwright.config.js')) {
    log('Playwright not configured. Skipping E2E tests.', 'yellow')
    log('To set up E2E tests, install Playwright: npm install -D @playwright/test', 'blue')
    return true
  }
  
  const commands = [
    {
      command: 'npx playwright test',
      description: 'E2E tests with Playwright'
    },
    {
      command: 'npx playwright test --headed',
      description: 'E2E tests in headed mode'
    }
  ]
  
  let success = true
  commands.forEach(({ command, description }) => {
    if (!runCommand(command, description)) {
      success = false
    }
  })
  
  return success
}

function generateTestReport() {
  logSection('Generating Test Report')
  
  const reportDir = 'test-reports'
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }
  
  const commands = [
    {
      command: 'npm run test -- --coverage --json --outputFile=test-reports/coverage.json',
      description: 'Coverage report in JSON format'
    },
    {
      command: 'npm run test -- --coverage --reporter=html --outputFile=test-reports/coverage.html',
      description: 'Coverage report in HTML format'
    }
  ]
  
  let success = true
  commands.forEach(({ command, description }) => {
    if (!runCommand(command, description)) {
      success = false
    }
  })
  
  if (success) {
    log('📊 Test reports generated in test-reports/ directory', 'green')
  }
  
  return success
}

function runPerformanceTests() {
  logSection('Running Performance Tests')
  
  // Check if we have performance test files
  const perfTestFiles = [
    'tests/__tests__/performance.test.ts',
    'tests/performance/',
  ]
  
  const existingFiles = perfTestFiles.filter(file => fs.existsSync(file))
  
  if (existingFiles.length === 0) {
    log('No performance test files found', 'yellow')
    log('To add performance tests, create tests in tests/performance/', 'blue')
    return true
  }
  
  const command = 'npm run test -- --testPathPattern="performance" --passWithNoTests'
  return runCommand(command, 'Performance tests')
}

function runSecurityTests() {
  logSection('Running Security Tests')
  
  // Check if we have security test files
  const securityTestFiles = [
    'tests/__tests__/security.test.ts',
    'tests/security/',
  ]
  
  const existingFiles = securityTestFiles.filter(file => fs.existsSync(file))
  
  if (existingFiles.length === 0) {
    log('No security test files found', 'yellow')
    log('To add security tests, create tests in tests/security/', 'blue')
    return true
  }
  
  const command = 'npm run test -- --testPathPattern="security" --passWithNoTests'
  return runCommand(command, 'Security tests')
}

function main() {
  log('🚀 Stakr Test Suite Runner', 'magenta')
  log('Starting comprehensive test execution...', 'blue')
  
  const startTime = Date.now()
  let allTestsPassed = true
  
  // Check test files
  const testFiles = checkTestFiles()
  
  if (testFiles.length === 0) {
    log('❌ No test files found!', 'red')
    log('Please create test files in the following directories:', 'yellow')
    log('  - tests/__tests__/', 'blue')
    log('  - components/__tests__/', 'blue')
    log('  - app/__tests__/', 'blue')
    log('  - lib/__tests__/', 'blue')
    process.exit(1)
  }
  
  // Run different types of tests
  const testTypes = [
    { name: 'Unit Tests', runner: runUnitTests },
    { name: 'Integration Tests', runner: runIntegrationTests },
    { name: 'Component Tests', runner: runComponentTests },
    { name: 'Performance Tests', runner: runPerformanceTests },
    { name: 'Security Tests', runner: runSecurityTests },
    { name: 'E2E Tests', runner: runE2ETests },
  ]
  
  testTypes.forEach(({ name, runner }) => {
    if (!runner()) {
      allTestsPassed = false
    }
  })
  
  // Generate reports
  generateTestReport()
  
  const endTime = Date.now()
  const duration = ((endTime - startTime) / 1000).toFixed(2)
  
  logSection('Test Suite Summary')
  
  if (allTestsPassed) {
    log(`✅ All tests passed! Total duration: ${duration}s`, 'green')
    log('🎉 Your code is ready for production!', 'green')
  } else {
    log(`❌ Some tests failed. Total duration: ${duration}s`, 'red')
    log('🔧 Please fix the failing tests before proceeding.', 'yellow')
    process.exit(1)
  }
  
  log('\n📋 Test Coverage Summary:', 'cyan')
  log('  - Unit Tests: Core functionality and business logic', 'blue')
  log('  - Integration Tests: API endpoints and data flow', 'blue')
  log('  - Component Tests: UI components and user interactions', 'blue')
  log('  - Performance Tests: Load times and resource usage', 'blue')
  log('  - Security Tests: Authentication and authorization', 'blue')
  log('  - E2E Tests: Complete user journeys', 'blue')
  
  log('\n📊 Reports available in:', 'cyan')
  log('  - test-reports/coverage.json', 'blue')
  log('  - test-reports/coverage.html', 'blue')
  log('  - coverage/lcov-report/index.html', 'blue')
}

// Handle command line arguments
const args = process.argv.slice(2)
const command = args[0]

if (command === '--help' || command === '-h') {
  log('Stakr Test Suite Runner', 'magenta')
  log('\nUsage:', 'cyan')
  log('  node scripts/run-tests.js [command]', 'blue')
  log('\nCommands:', 'cyan')
  log('  --unit        Run only unit tests', 'blue')
  log('  --integration Run only integration tests', 'blue')
  log('  --components  Run only component tests', 'blue')
  log('  --e2e         Run only E2E tests', 'blue')
  log('  --performance Run only performance tests', 'blue')
  log('  --security    Run only security tests', 'blue')
  log('  --coverage    Generate coverage reports', 'blue')
  log('  --help        Show this help message', 'blue')
  process.exit(0)
}

if (command === '--unit') {
  runUnitTests()
} else if (command === '--integration') {
  runIntegrationTests()
} else if (command === '--components') {
  runComponentTests()
} else if (command === '--e2e') {
  runE2ETests()
} else if (command === '--performance') {
  runPerformanceTests()
} else if (command === '--security') {
  runSecurityTests()
} else if (command === '--coverage') {
  generateTestReport()
} else {
  main()
}
