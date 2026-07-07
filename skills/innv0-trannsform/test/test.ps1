<# 
  innv0-trannsform â€” Test Script
  ===============================
  Run: pwsh -ExecutionPolicy Bypass -File test.ps1
  Requires: Node.js 18+
#>

$ErrorActionPreference = "Stop"
$SKILL_DIR = Resolve-Path "$PSScriptRoot\.."
$TEST_DIR = "$env:TEMP\innv0-trannsform-test-$(Get-Random)"
$PASS = 0
$FAIL = 0

function Assert-Equal {
  param($Actual, $Expected, $Message)
  if ($Actual -ne $Expected) {
    Write-Host "  FAIL: $Message" -ForegroundColor Red
    Write-Host "    Expected: $Expected" -ForegroundColor Gray
    Write-Host "    Actual:   $Actual" -ForegroundColor Gray
    $script:FAIL++
  } else {
    Write-Host "  PASS: $Message" -ForegroundColor Green
    $script:PASS++
  }
}

function Assert-True {
  param($Condition, $Message)
  if (-not $Condition) {
    Write-Host "  FAIL: $Message" -ForegroundColor Red
    $script:FAIL++
  } else {
    Write-Host "  PASS: $Message" -ForegroundColor Green
    $script:PASS++
  }
}

Write-Host "+------------------------------------------+" -ForegroundColor Cyan
Write-Host "|  innv0-trannsform - Integration Test    |" -ForegroundColor Cyan
Write-Host "+------------------------------------------+" -ForegroundColor Cyan
Write-Host "Skill dir: $SKILL_DIR"
Write-Host "Test dir:  $TEST_DIR"
Write-Host ""

# â”€â”€â”€ Step 1: Directory structure â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host "-- Step 1: Directory structure --" -ForegroundColor Yellow
Assert-True (Test-Path "$SKILL_DIR\SKILL.md") "SKILL.md exists"
Assert-True (Test-Path "$SKILL_DIR\package.json") "package.json exists"
Assert-True (Test-Path "$SKILL_DIR\scripts\index.js") "scripts/index.js exists"
Assert-True (Test-Path "$SKILL_DIR\scripts\scanner.js") "scripts/scanner.js exists"
Assert-True (Test-Path "$SKILL_DIR\scripts\transformer.js") "scripts/transformer.js exists"
Assert-True (Test-Path "$SKILL_DIR\scripts\config.js") "scripts/config.js exists"
Write-Host ""

# â”€â”€â”€ Step 2: package.json validity â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host "â”€â”€ Step 2: package.json validity â”€â”€" -ForegroundColor Yellow
$pkg = Get-Content "$SKILL_DIR\package.json" | ConvertFrom-Json
Assert-Equal $pkg.private $true "package.json is private"
Assert-True ($pkg.dependencies.mammoth -ne $null) "dependencies.mammoth declared"
Assert-True ($pkg.dependencies.minimist -ne $null) "dependencies.minimist declared"
Assert-True ($pkg.dependencies.prompts -ne $null) "dependencies.prompts declared"
Assert-True ($pkg.bin -eq $null) "package.json has no bin entry"
Assert-True ($pkg.scripts -eq $null -or @($pkg.scripts.PSObject.Properties).Count -eq 0) "package.json has no scripts entry"
Write-Host ""

# â”€â”€â”€ Step 3: SKILL.md frontmatter â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host "â”€â”€ Step 3: SKILL.md frontmatter â”€â”€" -ForegroundColor Yellow
$skillContent = Get-Content "$SKILL_DIR\SKILL.md" -Raw
Assert-True ($skillContent -match '^---\nname: innv0-trannsform') "SKILL.md name matches directory"
Assert-True ($skillContent -match 'license: MIT') "SKILL.md has MIT license"
Write-Host ""

# â”€â”€â”€ Step 4: npm install â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host "â”€â”€ Step 4: npm install â”€â”€" -ForegroundColor Yellow
if (Test-Path "$SKILL_DIR\node_modules") {
  Write-Host "  SKIP: node_modules already exists (clean first if you want to retest)" -ForegroundColor DarkYellow
} else {
  Push-Location $SKILL_DIR
  try {
    npm install --loglevel=error 2>&1 | Out-Null
    Assert-True (Test-Path "$SKILL_DIR\node_modules") "node_modules created after npm install"
    Assert-True (Test-Path "$SKILL_DIR\node_modules\mammoth") "mammoth installed"
    Assert-True (Test-Path "$SKILL_DIR\node_modules\minimist") "minimist installed"
    Assert-True (Test-Path "$SKILL_DIR\node_modules\prompts") "prompts installed"
  } finally {
    Pop-Location
  }
}
Write-Host ""

# â”€â”€â”€ Step 5: Bootstrap a test project â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host "â”€â”€ Step 5: Bootstrap test project â”€â”€" -ForegroundColor Yellow
New-Item -ItemType Directory -Path "$TEST_DIR\source" -Force | Out-Null
@"
# Test Document
Hello world. This is a test.
"@ | Out-File -FilePath "$TEST_DIR\source\hello.txt" -Encoding utf8

Push-Location $SKILL_DIR
try {
  node scripts/index.js --src "$TEST_DIR\source" --dest "$TEST_DIR" --name "test-project" 2>&1 | Out-Null
  Assert-True (Test-Path "$TEST_DIR\test-project") "Project directory created"
  Assert-True (Test-Path "$TEST_DIR\test-project\raw") "raw/ directory created"
  Assert-True (Test-Path "$TEST_DIR\test-project\md") "md/ directory created"
  Assert-True (Test-Path "$TEST_DIR\test-project\traNNsformations") "traNNsformations/ directory created"
  Assert-True (Test-Path "$TEST_DIR\test-project\output") "output/ directory created"
  Assert-True (Test-Path "$TEST_DIR\test-project\raw\hello.txt") "Source file copied to raw/"
} finally {
  Pop-Location
}
Write-Host ""

# â”€â”€â”€ Step 6: Run scan â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host "â”€â”€ Step 6: Run scan â”€â”€" -ForegroundColor Yellow
Push-Location $SKILL_DIR
try {
  node scripts/index.js --scan --src "$TEST_DIR\test-project" 2>&1 | Out-Null
  Assert-True (Test-Path "$TEST_DIR\test-project\index.md") "index.md created"
  Assert-True (Test-Path "$TEST_DIR\test-project\md\hello.md") "hello.md created in md/"
  Assert-True (Test-Path "$TEST_DIR\test-project\md\_all.md") "_all.md created"

  $allContent = Get-Content "$TEST_DIR\test-project\md\_all.md" -Raw
  Assert-True ($allContent -match 'Hello world') "_all.md contains 'Hello world'"
} finally {
  Pop-Location
}
Write-Host ""

# â”€â”€â”€ Step 7: Cleanup â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host "â”€â”€ Step 7: Cleanup â”€â”€" -ForegroundColor Yellow
Remove-Item -Path $TEST_DIR -Recurse -Force -ErrorAction SilentlyContinue
Assert-True (-not (Test-Path $TEST_DIR)) "Test directory cleaned up"
Write-Host ""

# â”€â”€â”€ Results â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
Write-Host "+------------------------------------------+" -ForegroundColor Cyan
Write-Host "|  Results                                 |" -ForegroundColor Cyan
Write-Host "+------------------------------------------+" -ForegroundColor Cyan
Write-Host "|  Passed: $($PASS.ToString().PadLeft(3))                           |" -ForegroundColor Green
Write-Host "|  Failed: $($FAIL.ToString().PadLeft(3))                           |" -ForegroundColor $(if ($FAIL -gt 0) { "Red" } else { "Green" })
Write-Host "+------------------------------------------+" -ForegroundColor Cyan

if ($FAIL -gt 0) { exit 1 }
