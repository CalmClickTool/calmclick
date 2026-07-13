# Build downloadable zips for the website and Chrome Web Store upload
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot

# Keep bundled rules in sync with the public feed
& (Join-Path $PSScriptRoot "sync-rules.ps1")

$Downloads = Join-Path $Root "downloads"
New-Item -ItemType Directory -Force -Path $Downloads | Out-Null

$OfflineZip = Join-Path $Downloads "calmclick-offline.zip"
$ExtZip = Join-Path $Downloads "calmclick-extension.zip"

if (Test-Path $OfflineZip) { Remove-Item $OfflineZip -Force }
if (Test-Path $ExtZip) { Remove-Item $ExtZip -Force }

# --- Offline / local site zip ---
$stage = Join-Path $env:TEMP "calmclick-offline-stage"
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stage | Out-Null

$siteFiles = @(
  "index.html",
  "privacy.html",
  "styles.css",
  "app.js",
  "config.js",
  "OFFLINE-README.txt"
)
foreach ($f in $siteFiles) {
  Copy-Item (Join-Path $Root $f) (Join-Path $stage $f) -Force
}
Copy-Item (Join-Path $Root "data") (Join-Path $stage "data") -Recurse -Force
Copy-Item (Join-Path $Root "updates") (Join-Path $stage "updates") -Recurse -Force
# Include extension in local pack so family can load it too
Copy-Item (Join-Path $Root "extension") (Join-Path $stage "extension") -Recurse -Force

# Local config: still allows optional rules feed when online
$configLocal = @'
/* Bundled with offline zip */
window.CALMCLICK_CONFIG = {
  version: "1.1.0",
  chromeStoreUrl: "",
  localZipUrl: "#",
  extensionZipUrl: "#",
  githubUrl: "https://github.com/CalmClickTool/calmclick",
  rulesFeedUrl: "https://calmclicktool.github.io/calmclick/updates/rules-latest.json"
};
'@
Set-Content -Path (Join-Path $stage "config.js") -Value $configLocal -Encoding UTF8

Compress-Archive -Path (Join-Path $stage "*") -DestinationPath $OfflineZip -Force
Remove-Item $stage -Recurse -Force

# --- Extension zip (manifest at root of zip — required by CWS) ---
$extStage = Join-Path $env:TEMP "calmclick-ext-stage"
if (Test-Path $extStage) { Remove-Item $extStage -Recurse -Force }
New-Item -ItemType Directory -Force -Path $extStage | Out-Null
Copy-Item (Join-Path $Root "extension\*") $extStage -Recurse -Force
Compress-Archive -Path (Join-Path $extStage "*") -DestinationPath $ExtZip -Force
Remove-Item $extStage -Recurse -Force

Write-Host "Created:"
Write-Host "  $OfflineZip"
Write-Host "  $ExtZip"
Get-Item $OfflineZip, $ExtZip | Format-Table Name, Length, LastWriteTime
