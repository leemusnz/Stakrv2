# Stakr Redundancy Cleanup Script
# This script removes duplicate and unused files safely

Write-Host "🧹 Starting Stakr Redundancy Cleanup..." -ForegroundColor Cyan
Write-Host ""

# Track what we're doing
$removed = 0
$errors = 0

# Function to safely remove file
function Remove-SafeFile {
    param($path)
    if (Test-Path $path) {
        try {
            Remove-Item $path -Force
            Write-Host "✅ Removed: $path" -ForegroundColor Green
            $script:removed++
        } catch {
            Write-Host "❌ Failed to remove: $path - $_" -ForegroundColor Red
            $script:errors++
        }
    } else {
        Write-Host "⏭️  Skipped (not found): $path" -ForegroundColor Yellow
    }
}

Write-Host "Phase 1: Removing junk files in root..." -ForegroundColor Cyan
Remove-SafeFile "hell -NoProfile -Command ='SilentlyContinue'; New-Item -ItemType Directory -Force reports  Out-Null"
Remove-SafeFile "tatus -s"
Remove-SafeFile "test-verification-fix.js"

Write-Host ""
Write-Host "Phase 2: Removing duplicate challenge cards..." -ForegroundColor Cyan
# Keep challenge-card.tsx as primary
Remove-SafeFile "components\challenge-card-new.tsx"
Remove-SafeFile "components\gamified-challenge-card.tsx"
Remove-SafeFile "components\youtube-style-challenge-card.tsx"

Write-Host ""
Write-Host "Phase 3: Removing backup files..." -ForegroundColor Cyan
Remove-SafeFile "lib\reward-calculation.ts.backup"

Write-Host ""
Write-Host "Phase 4: Removing old dev tool variants..." -ForegroundColor Cyan
Remove-SafeFile "components\dev-tools\ai-analyzer-controls-old.tsx"
Remove-SafeFile "components\dev-tools\ai-analyzer-controls-redesigned.tsx"

Write-Host ""
Write-Host "Phase 5: Removing test/demo components..." -ForegroundColor Cyan
Remove-SafeFile "components\avatar-test-panel.tsx"
Remove-SafeFile "components\dev-testing-panel.tsx"
Remove-SafeFile "components\mobile-swipe-example.tsx"

Write-Host ""
Write-Host "Phase 6: Removing duplicate schema file..." -ForegroundColor Cyan
Remove-SafeFile "stakr-schema.sql"

Write-Host ""
Write-Host "Phase 7: Removing example components..." -ForegroundColor Cyan
Remove-SafeFile "components\examples\api-usage-example.tsx"

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ Cleanup Complete!" -ForegroundColor Green
Write-Host "   Removed: $removed files" -ForegroundColor Green
Write-Host "   Errors: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm install" -ForegroundColor White
Write-Host "2. Run: npm run build" -ForegroundColor White
Write-Host "3. Test the app to ensure nothing broke" -ForegroundColor White
Write-Host ""

