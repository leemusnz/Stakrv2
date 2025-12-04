# Stakr Junk Files Cleanup Script
# Removes obvious redundant and corrupted files

Write-Host "🗑️  Starting Junk File Cleanup..." -ForegroundColor Cyan
Write-Host ""

$removed = 0
$errors = 0
$skipped = 0

function Remove-SafeFile {
    param($path, $description)
    Write-Host "Checking: $description" -ForegroundColor Yellow
    if (Test-Path $path) {
        try {
            $size = (Get-Item $path).Length
            Remove-Item $path -Force
            Write-Host "  ✅ Removed: $path ($([math]::Round($size/1KB, 2)) KB)" -ForegroundColor Green
            $script:removed++
        } catch {
            Write-Host "  ❌ Failed: $path - $_" -ForegroundColor Red
            $script:errors++
        }
    } else {
        Write-Host "  ⏭️  Not found (already clean)" -ForegroundColor Gray
        $script:skipped++
    }
}

Write-Host "Phase 1: Removing corrupted PowerShell command file..." -ForegroundColor Cyan
Remove-SafeFile "hell -NoProfile -Command ='SilentlyContinue'; New-Item -ItemType Directory -Force reports  Out-Null" "Corrupted PowerShell command"

Write-Host ""
Write-Host "Phase 2: Removing wrong package manager lock files..." -ForegroundColor Cyan
# Check which package manager is being used
$usingNpm = Test-Path "package-lock.json"
$usingPnpm = Test-Path "pnpm-lock.yaml"
$usingYarn = Test-Path "yarn.lock"

if ($usingNpm -and $usingPnpm) {
    Write-Host "  Using npm, removing pnpm lock file..." -ForegroundColor Yellow
    Remove-SafeFile "pnpm-lock.yaml" "pnpm lock file (using npm)"
}
if ($usingNpm -and $usingYarn) {
    Write-Host "  Using npm, removing yarn lock file..." -ForegroundColor Yellow
    Remove-SafeFile "yarn.lock" "yarn lock file (using npm)"
}

Write-Host ""
Write-Host "Phase 3: Removing debug files in root..." -ForegroundColor Cyan
Remove-SafeFile "debug-env.js" "Debug environment file"
Remove-SafeFile "build-output.log" "Old build output log"

Write-Host ""
Write-Host "Phase 4: Checking for duplicate hook files..." -ForegroundColor Cyan
if ((Test-Path "hooks/use-mobile.tsx") -and (Test-Path "hooks/use-enhanced-mobile.tsx")) {
    Write-Host "  Found both use-mobile.tsx and use-enhanced-mobile.tsx" -ForegroundColor Yellow
    
    # Check which one is actually used
    $enhancedUsages = (Get-ChildItem -Path "app","components" -Recurse -Include "*.tsx","*.ts" -ErrorAction SilentlyContinue | 
        Select-String -Pattern "use-enhanced-mobile" | Measure-Object).Count
    $basicUsages = (Get-ChildItem -Path "app","components" -Recurse -Include "*.tsx","*.ts" -ErrorAction SilentlyContinue | 
        Select-String -Pattern "from.*use-mobile" -NotMatch "enhanced" | Measure-Object).Count
    
    Write-Host "  Enhanced mobile hook usages: $enhancedUsages" -ForegroundColor White
    Write-Host "  Basic mobile hook usages: $basicUsages" -ForegroundColor White
    
    if ($enhancedUsages -gt 0 -and $basicUsages -eq 0) {
        Write-Host "  Enhanced version is used, basic version appears unused" -ForegroundColor Yellow
        Write-Host "  ⚠️  Manual review recommended before deleting use-mobile.tsx" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Phase 5: Removing duplicate cleanup documentation..." -ForegroundColor Cyan
Remove-SafeFile "FINAL_REDUNDANCY_CLEANUP.md" "Redundancy cleanup doc"
Remove-SafeFile "PHASE_2_CLEANUP_COMPLETE.md" "Phase 2 cleanup doc"
Remove-SafeFile "PHASE_3_CLEANUP_COMPLETE.md" "Phase 3 cleanup doc"
Remove-SafeFile "REDUNDANCY_ANALYSIS_REPORT.md" "Redundancy analysis (superseded)"
Remove-SafeFile "COMPONENT_ANALYSIS.md" "Component analysis doc"

Write-Host ""
Write-Host "Phase 6: Checking for empty example directories..." -ForegroundColor Cyan
if (Test-Path "components/examples") {
    $exampleFiles = Get-ChildItem "components/examples" -File -ErrorAction SilentlyContinue
    if ($exampleFiles.Count -eq 0) {
        try {
            Remove-Item "components/examples" -Recurse -Force
            Write-Host "  ✅ Removed empty examples directory" -ForegroundColor Green
            $script:removed++
        } catch {
            Write-Host "  ❌ Failed to remove examples directory: $_" -ForegroundColor Red
            $script:errors++
        }
    } else {
        Write-Host "  ⏭️  Examples directory has $($exampleFiles.Count) files, keeping" -ForegroundColor Gray
        $script:skipped++
    }
}

if (Test-Path "components/providers") {
    $providerFiles = Get-ChildItem "components/providers" -File -ErrorAction SilentlyContinue
    if ($providerFiles.Count -eq 0) {
        try {
            Remove-Item "components/providers" -Recurse -Force
            Write-Host "  ✅ Removed empty providers directory" -ForegroundColor Green
            $script:removed++
        } catch {
            Write-Host "  ❌ Failed to remove providers directory: $_" -ForegroundColor Red
            $script:errors++
        }
    } else {
        Write-Host "  ⏭️  Providers directory has $($providerFiles.Count) files, keeping" -ForegroundColor Gray
        $script:skipped++
    }
}

Write-Host ""
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ Junk Cleanup Complete!" -ForegroundColor Green
Write-Host "   Removed: $removed items" -ForegroundColor Green
Write-Host "   Skipped: $skipped items (already clean or safe)" -ForegroundColor Yellow
Write-Host "   Errors: $errors" -ForegroundColor $(if ($errors -gt 0) { "Red" } else { "Green" })
Write-Host "═══════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Recommendations for manual review:" -ForegroundColor Yellow
Write-Host "  1. Review test pages in app folder" -ForegroundColor White
Write-Host "  2. Consolidate docs folder" -ForegroundColor White
Write-Host "  3. Check duplicate mobile hooks" -ForegroundColor White
Write-Host "  4. Check duplicate avatar hooks" -ForegroundColor White
Write-Host ""

