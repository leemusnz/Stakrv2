# Simple Junk File Cleanup
Write-Host "Cleaning junk files..." -ForegroundColor Cyan

$removed = 0

# Remove corrupted PowerShell file
$junkFile = "hell -NoProfile -Command ='SilentlyContinue'; New-Item -ItemType Directory -Force reports  Out-Null"
if (Test-Path $junkFile) {
    Remove-Item $junkFile -Force
    Write-Host "Removed: Corrupted PowerShell file" -ForegroundColor Green
    $removed++
}

# Remove pnpm lock if using npm
if ((Test-Path "package-lock.json") -and (Test-Path "pnpm-lock.yaml")) {
    Remove-Item "pnpm-lock.yaml" -Force
    Write-Host "Removed: pnpm-lock.yaml" -ForegroundColor Green
    $removed++
}

# Remove debug files
if (Test-Path "debug-env.js") {
    Remove-Item "debug-env.js" -Force
    Write-Host "Removed: debug-env.js" -ForegroundColor Green
    $removed++
}

if (Test-Path "build-output.log") {
    Remove-Item "build-output.log" -Force
    Write-Host "Removed: build-output.log" -ForegroundColor Green
    $removed++
}

# Remove cleanup docs
$cleanupDocs = @(
    "FINAL_REDUNDANCY_CLEANUP.md",
    "PHASE_2_CLEANUP_COMPLETE.md", 
    "PHASE_3_CLEANUP_COMPLETE.md",
    "REDUNDANCY_ANALYSIS_REPORT.md",
    "COMPONENT_ANALYSIS.md"
)

foreach ($doc in $cleanupDocs) {
    if (Test-Path $doc) {
        Remove-Item $doc -Force
        Write-Host "Removed: $doc" -ForegroundColor Green
        $removed++
    }
}

Write-Host ""
Write-Host "Complete! Removed $removed files" -ForegroundColor Green

