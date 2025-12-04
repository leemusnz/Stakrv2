# Add production guards to test/demo pages
Write-Host "Adding production guards to test pages..." -ForegroundColor Cyan

$testPages = @(
    "app\test-dashboard\page.tsx",
    "app\test-verification-system\page.tsx",
    "app\mobile-demo\page.tsx",
    "app\proof-demo\page.tsx",
    "app\verification-demo\page.tsx",
    "app\design-preview\page.tsx"
)

$guardCode = @"
import { notFound } from 'next/navigation'

// Production guard - only allow in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  notFound()
}

"@

$updated = 0

foreach ($page in $testPages) {
    if (Test-Path $page) {
        $content = Get-Content $page -Raw
        
        # Check if guard already exists
        if ($content -notmatch "Production guard") {
            # Find the first import statement
            if ($content -match '(?s)(import.*?from.*?\n)') {
                $firstImport = $matches[1]
                $newContent = $content -replace [regex]::Escape($firstImport), "$firstImport$guardCode"
                Set-Content $page -Value $newContent -NoNewline
                Write-Host "  Added guard to: $page" -ForegroundColor Green
                $updated++
            }
        } else {
            Write-Host "  Already protected: $page" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "Production guards added to $updated pages" -ForegroundColor Green

