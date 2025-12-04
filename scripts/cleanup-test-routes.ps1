# Stakr Test/Debug API Routes Cleanup Script
# Removes development-only API routes that shouldn't be in production

Write-Host "🧹 Cleaning up test and debug API routes..." -ForegroundColor Cyan
Write-Host ""

$removed = 0
$errors = 0

function Remove-SafeDir {
    param($path)
    if (Test-Path $path) {
        try {
            Remove-Item $path -Recurse -Force
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

Write-Host "Phase 1: Removing test API routes..." -ForegroundColor Cyan
Remove-SafeDir "app\api\test-auth-unified"
Remove-SafeDir "app\api\test-avatar-moderation"
Remove-SafeDir "app\api\test-avatar-persistence"
Remove-SafeDir "app\api\test-avatar-system"
Remove-SafeDir "app\api\test-dashboard-simple"
Remove-SafeDir "app\api\test-db"
Remove-SafeDir "app\api\test-db-update"
Remove-SafeDir "app\api\test-deployment"
Remove-SafeDir "app\api\test-email"
Remove-SafeDir "app\api\test-env"
Remove-SafeDir "app\api\test-file-validation"
Remove-SafeDir "app\api\test-google-oauth"
Remove-SafeDir "app\api\test-onboarding"
Remove-SafeDir "app\api\test-reward-calculation"
Remove-SafeDir "app\api\test-tables"
Remove-SafeDir "app\api\test-upload"
Remove-SafeDir "app\api\test"

Write-Host ""
Write-Host "Phase 2: Removing debug API routes..." -ForegroundColor Cyan
Remove-SafeDir "app\api\debug-all-user-apis"
Remove-SafeDir "app\api\debug-auth"
Remove-SafeDir "app\api\debug-auth-env"
Remove-SafeDir "app\api\debug-challenges-simple"
Remove-SafeDir "app\api\debug-dashboard"
Remove-SafeDir "app\api\debug-moderation"
Remove-SafeDir "app\api\debug-oauth-session"
Remove-SafeDir "app\api\debug-production"
Remove-SafeDir "app\api\debug-profile-simple"
Remove-SafeDir "app\api\debug-session"
Remove-SafeDir "app\api\debug-user-apis"
Remove-SafeDir "app\api\debug-user-lookup"
Remove-SafeDir "app\api\debug"
Remove-SafeDir "app\api\auth-debug"

Write-Host ""
Write-Host "Phase 3: Removing one-off fix routes..." -ForegroundColor Cyan
Remove-SafeDir "app\api\fix-current-session"
Remove-SafeDir "app\api\fix-oauth-account"
Remove-SafeDir "app\api\force-link-oauth"
Remove-SafeDir "app\api\force-oauth-fix"
Remove-SafeDir "app\api\dev-bypass-verification"
Remove-SafeDir "app\api\simple-test"
Remove-SafeDir "app\api\set-alpha-access"
Remove-SafeDir "app\api\create-schema"
Remove-SafeDir "app\api\dev"

Write-Host ""
Write-Host "Phase 4: Removing unused auth routes..." -ForegroundColor Cyan
Remove-SafeDir "app\api\auth\auto-signin"
Remove-SafeDir "app\api\auth\mobile-login"
Remove-SafeDir "app\api\auth\verify-and-signin"

Write-Host ""
Write-Host "Phase 5: Removing admin fix routes..." -ForegroundColor Cyan
Remove-SafeDir "app\api\admin\fix-verification-schema"
Remove-SafeDir "app\api\admin\run-migration"

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ API Cleanup Complete!" -ForegroundColor Green
Write-Host "   Removed: $removed route directories" -ForegroundColor Green
Write-Host "   Errors: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  Note: Kept these debug routes (protected by admin checks):" -ForegroundColor Yellow
Write-Host "   - /api/dev-bypass (development only)" -ForegroundColor White
Write-Host "   - /api/grant-dev-access (admin only)" -ForegroundColor White
Write-Host ""

