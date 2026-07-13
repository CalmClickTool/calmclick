# Sync updates/rules-latest.json → data/bundled-rules.js (and extension copy)
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$jsonPath = Join-Path $Root "updates\rules-latest.json"
$outPath = Join-Path $Root "data\bundled-rules.js"
$extOut = Join-Path $Root "extension\bundled-rules.js"

if (-not (Test-Path $jsonPath)) { throw "Missing $jsonPath" }
$raw = Get-Content -Raw -Path $jsonPath
$null = $raw | ConvertFrom-Json

$header = @"
/* Auto-generated from updates/rules-latest.json — do not edit by hand.
 * Rebuild: powershell -File scripts/sync-rules.ps1
 */
window.CALMCLICK_BUNDLED_RULES = 
"@

$js = $header + $raw.Trim() + ";`n"
Set-Content -Path $outPath -Value $js -Encoding UTF8
Copy-Item $outPath $extOut -Force
Write-Host "Synced rules → data/bundled-rules.js + extension/bundled-rules.js"
$ver = ($raw | ConvertFrom-Json).rulesVersion
Write-Host "rulesVersion=$ver"
