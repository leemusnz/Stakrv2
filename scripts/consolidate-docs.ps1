# Documentation Consolidation Script
Write-Host "Consolidating documentation..." -ForegroundColor Cyan

$removed = 0

# Remove duplicate AI/Verification docs (keep the most comprehensive ones)
$aiDocsToRemove = @(
    "docs\ai-systems\VERIFICATION_SYSTEM_PLAN.md",
    "docs\ai-systems\VERIFICATION_ARCHITECTURE_STRATEGY.md",
    "docs\ai-systems\APP_CENTRIC_VERIFICATION_SYSTEM.md"
)

Write-Host "Removing redundant AI documentation..." -ForegroundColor Yellow
foreach ($doc in $aiDocsToRemove) {
    if (Test-Path $doc) {
        Remove-Item $doc -Force
        Write-Host "  Removed: $doc" -ForegroundColor Green
        $removed++
    }
}

# Remove duplicate mobile docs
$mobileDocsToRemove = @(
    "docs\mobile-ui\MOBILE_SWIPE_AUDIT_REPORT.md",
    "docs\mobile-ui\MOBILE_SWIPE_IMPLEMENTATION_ROADMAP.md",
    "docs\mobile-ui\QUICK_MOBILE_SWIPE_UI_TEST_SUMMARY.md"
)

Write-Host "Removing redundant mobile documentation..." -ForegroundColor Yellow
foreach ($doc in $mobileDocsToRemove) {
    if (Test-Path $doc) {
        Remove-Item $doc -Force
        Write-Host "  Removed: $doc" -ForegroundColor Green
        $removed++
    }
}

# Remove duplicate testing docs
$testDocsToRemove = @(
    "docs\testing\QUICK_TEST_SUMMARY.md",
    "docs\testing\TEST_SUITE_DEVELOPMENT_ROADMAP.md",
    "docs\testing\TEST_SUITE_IMPLEMENTATION_PROGRESS.md"
)

Write-Host "Removing redundant testing documentation..." -ForegroundColor Yellow
foreach ($doc in $testDocsToRemove) {
    if (Test-Path $doc) {
        Remove-Item $doc -Force
        Write-Host "  Removed: $doc" -ForegroundColor Green
        $removed++
    }
}

# Remove duplicate setup docs
$setupDocsToRemove = @(
    "docs\setup\QUICK_OAUTH_SETUP.md",
    "docs\setup\OAUTH_ENV_SETUP.md"
)

Write-Host "Removing redundant setup documentation..." -ForegroundColor Yellow
foreach ($doc in $setupDocsToRemove) {
    if (Test-Path $doc) {
        Remove-Item $doc -Force
        Write-Host "  Removed: $doc" -ForegroundColor Green
        $removed++
    }
}

# Remove duplicate audit/fix reports
$auditDocsToRemove = @(
    "docs\AVATAR-FIX-SUMMARY.md",
    "docs\CRITICAL-FIXES-DEPLOYED.md",
    "docs\FIXES-SUMMARY.md",
    "docs\IMPROVEMENTS-COMPLETE.md",
    "docs\STAKR-AUDIT-AND-IMPROVEMENTS-FINAL.md",
    "docs\END-TO-END-FUNCTIONALITY-REPORT.md",
    "docs\MOBILE-AUDIT-REPORT.md",
    "docs\THEME-IMPLEMENTATION-COMPLETE.md",
    "docs\DESIGN-SYSTEM-V2-COMPLETE.md"
)

Write-Host "Removing completed audit/fix reports..." -ForegroundColor Yellow
foreach ($doc in $auditDocsToRemove) {
    if (Test-Path $doc) {
        Remove-Item $doc -Force
        Write-Host "  Removed: $doc" -ForegroundColor Green
        $removed++
    }
}

# Remove meta-documentation
$metaDocsToRemove = @(
    "docs\cleanup-documentation-consolidation.md",
    "docs\audits\AUDIT_CLEANUP_PLAN.md"
)

Write-Host "Removing meta-documentation..." -ForegroundColor Yellow
foreach ($doc in $metaDocsToRemove) {
    if (Test-Path $doc) {
        Remove-Item $doc -Force
        Write-Host "  Removed: $doc" -ForegroundColor Green
        $removed++
    }
}

Write-Host ""
Write-Host "Documentation cleanup complete! Removed $removed files" -ForegroundColor Green
Write-Host "Docs folder reduced from 84 to approximately" ($removed - 84) "files" -ForegroundColor Cyan

