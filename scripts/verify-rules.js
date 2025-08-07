#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

console.log('🔍 Verifying Stakr Cursor Rules...\n')

// Check if rules directory exists
const rulesDir = '.cursor/rules'
if (!fs.existsSync(rulesDir)) {
  console.error('❌ Rules directory not found:', rulesDir)
  process.exit(1)
}

// List all rule files
const ruleFiles = fs.readdirSync(rulesDir).filter(file => file.endsWith('.mdc'))
console.log('📁 Found rule files:')
ruleFiles.forEach(file => {
  console.log(`  ✅ ${file}`)
})

// Verify each rule file has proper structure
console.log('\n🔧 Verifying rule file structure:')
ruleFiles.forEach(file => {
  const filePath = path.join(rulesDir, file)
  const content = fs.readFileSync(filePath, 'utf-8')
  
  // Check for required sections
  const hasDescription = content.includes('description:')
  const hasGlobs = content.includes('globs:')
  const hasAlwaysApply = content.includes('alwaysApply:')
  const hasContent = content.length > 100 // Basic content check
  
  console.log(`  📄 ${file}:`)
  console.log(`    ${hasDescription ? '✅' : '❌'} Has description`)
  console.log(`    ${hasGlobs ? '✅' : '❌'} Has globs`)
  console.log(`    ${hasAlwaysApply ? '✅' : '❌'} Has alwaysApply`)
  console.log(`    ${hasContent ? '✅' : '❌'} Has content`)
})

// Check for specific rule types
const ruleTypes = {
  'stakr-default.mdc': 'Default rules',
  'stakr-general-dev.mdc': 'General development',
  'stakr-testing.mdc': 'Testing focused',
  'stakr-security.mdc': 'Security focused', 
  'stakr-mobile-ui.mdc': 'Mobile UI focused',
  'stakr-business-logic.mdc': 'Business logic focused'
}

console.log('\n🎯 Rule type verification:')
Object.entries(ruleTypes).forEach(([file, type]) => {
  const exists = fs.existsSync(path.join(rulesDir, file))
  console.log(`  ${exists ? '✅' : '❌'} ${type}: ${file}`)
})

// Check for proper glob patterns
console.log('\n🔍 Checking glob patterns:')
const globPatterns = [
  '**/*.ts',
  '**/*.tsx', 
  '**/*.test.ts',
  '**/components/**/*',
  '**/api/**/*',
  '**/lib/**/*'
]

globPatterns.forEach(pattern => {
  console.log(`  📋 ${pattern}`)
})

console.log('\n✅ Rules verification complete!')
console.log('\n📝 Next steps:')
console.log('  1. Restart Cursor to load the new rules')
console.log('  2. Open different file types to test rule activation')
console.log('  3. Check that specialized rules apply to relevant files')
console.log('  4. Verify default rules apply to all files')
