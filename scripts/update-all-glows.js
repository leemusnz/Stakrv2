const fs = require('fs')

const pages = [
  'app/auth/signin/page.tsx',
  'app/my-active/page.tsx',
  'app/my-challenges/page.tsx',
  'app/pricing/page.tsx',
  'app/social/page.tsx',
  'app/notifications/page.tsx',
  'app/wallet/page.tsx',
  'app/alpha-gate/page.tsx',
  'app/profile/page.tsx'
]

const oldGlows = `      {/* Ambient Glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-[#F46036] rounded-full mix-blend-screen filter blur-[120px] opacity-10 dark:opacity-15 animate-pulse"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-[#D74E25] rounded-full mix-blend-screen filter blur-[100px] opacity-[0.07] dark:opacity-10 animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>`

const newGlows = `      {/* Ambient Glows */}
      <FloatingAmbientGlows />`

pages.forEach(page => {
  try {
    let content = fs.readFileSync(page, 'utf8')
    
    // Add import if not present
    if (!content.includes('FloatingAmbientGlows')) {
      // Find the last import line
      const importMatch = content.match(/import.*from.*\n/g)
      if (importMatch) {
        const lastImport = importMatch[importMatch.length - 1]
        content = content.replace(
          lastImport,
          lastImport + `import { FloatingAmbientGlows } from '@/components/floating-ambient-glows'\n`
        )
      }
    }
    
    // Replace old glows with new
    if (content.includes(oldGlows)) {
      content = content.replace(oldGlows, newGlows)
      fs.writeFileSync(page, content, 'utf8')
      console.log(`✅ Updated: ${page}`)
    } else {
      console.log(`⚠️  Skipped: ${page} (pattern not found)`)
    }
  } catch (error) {
    console.error(`❌ Error updating ${page}:`, error.message)
  }
})

console.log('\n🎉 All pages updated! Hard refresh your browser.')

