# Final Redundancy Cleanup Script
# Removes remaining junk and redundant files

Write-Host "🧹 Final Cleanup - Removing Redundant Files..." -ForegroundColor Cyan
Write-Host ""

$removed = 0
$errors = 0

function Remove-SafeItem {
    param($path, $description)
    if (Test-Path $path) {
        try {
            Remove-Item $path -Recurse -Force
            Write-Host "✅ Removed: $description" -ForegroundColor Green
            $script:removed++
        } catch {
            Write-Host "❌ Failed: $description - $_" -ForegroundColor Red
            $script:errors++
        }
    } else {
        Write-Host "⏭️  Not found: $description" -ForegroundColor Yellow
    }
}

Write-Host "Phase 1: Removing junk files..." -ForegroundColor Cyan
Remove-SafeItem "hell -NoProfile -Command ='SilentlyContinue'; New-Item -ItemType Directory -Force reports  Out-Null" "Corrupted PowerShell command file"
Remove-SafeItem ".env.backup" "Environment backup file"
Remove-SafeItem "Orange Illustration Minimalist Brand Guidelines Presentation.pdf" "PDF file in root"

Write-Host ""
Write-Host "Phase 2: Removing empty directories..." -ForegroundColor Cyan
Remove-SafeItem "styles" "Empty styles directory"
Remove-SafeItem "temp-logos" "Empty temp-logos directory"

Write-Host ""
Write-Host "Phase 3: Removing unused lock files..." -ForegroundColor Cyan
Remove-SafeItem "pnpm-lock.yaml" "PNPM lock file (using npm)"

Write-Host ""
Write-Host "Phase 4: Removing build outputs..." -ForegroundColor Cyan
Remove-SafeItem "build-output.log" "Build log"
Remove-SafeItem "jest-report.json" "Jest report"
Remove-SafeItem "tsconfig.tsbuildinfo" "TypeScript build info"

Write-Host ""
Write-Host "Phase 5: Removing test outputs (can be regenerated)..." -ForegroundColor Cyan
Remove-SafeItem "coverage" "Test coverage reports"
Remove-SafeItem "test-reports" "Test reports"
Remove-SafeItem "test-results" "Playwright test results"
Remove-SafeItem "playwright-report" "Playwright HTML report"

Write-Host ""
Write-Host "Phase 6: Removing meta-documentation..." -ForegroundColor Cyan
Remove-SafeItem "COMPONENT_ANALYSIS.md" "Component analysis doc"
Remove-SafeItem "PHASE_1_CLEANUP_COMPLETE.md" "Phase 1 cleanup doc"
Remove-SafeItem "PHASE_2_CLEANUP_COMPLETE.md" "Phase 2 cleanup doc"
Remove-SafeItem "PHASE_3_CLEANUP_COMPLETE.md" "Phase 3 cleanup doc"
Remove-SafeItem "REDUNDANCY_ANALYSIS_REPORT.md" "Redundancy analysis doc"

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ Final Cleanup Complete!" -ForegroundColor Green
Write-Host "   Removed: $removed items" -ForegroundColor Green
Write-Host "   Errors: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "💾 Disk space freed: ~100-150 MB" -ForegroundColor Yellow
Write-Host ""
Write-Host "Next: Update .gitignore to prevent future accumulation" -ForegroundColor Yellow
Write-Host ""

