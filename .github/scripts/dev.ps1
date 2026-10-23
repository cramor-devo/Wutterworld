<#
.SYNOPSIS
  Stack-agnostic dev helper used by .github/github-app.yml (Setup / Run / Checks / Archive cleanup).
  Detects which stack exists in the repo and acts on it; otherwise prints a hint and exits 0.
.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .github/scripts/dev.ps1 setup
#>
param(
    [Parameter(Mandatory)][ValidateSet('setup', 'run', 'checks', 'clean')][string]$Action
)

# 'Continue' so native-tool stderr (pip warnings etc.) is not fatal in Windows PowerShell; exit codes are checked explicitly.
$ErrorActionPreference = 'Continue'
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
Set-Location $root

$venvPython = Join-Path $root '.venv\Scripts\python.exe'
$reqFiles = @(Get-ChildItem -Path $root -Filter 'requirements*.txt' -File -ErrorAction SilentlyContinue)
$hasPyproject = Test-Path (Join-Path $root 'pyproject.toml')
$hasPython = $hasPyproject -or $reqFiles.Count -gt 0 -or (Test-Path (Join-Path $root 'main.py'))
$hasNode = Test-Path (Join-Path $root 'package.json')

function Invoke-Checked([string]$exe, [string[]]$argList) {
    Write-Host "> $exe $($argList -join ' ')"
    & $exe @argList
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

function Get-NpmScripts {
    $pkg = Get-Content (Join-Path $root 'package.json') -Raw | ConvertFrom-Json
    if ($pkg.scripts) { return @($pkg.scripts.PSObject.Properties.Name) } else { return @() }
}

function Test-PyModule([string]$name) {
    & $venvPython -c "import $name" 2>$null
    return $LASTEXITCODE -eq 0
}

$noStack = 'No tech stack detected yet (no pyproject.toml/requirements*.txt/main.py or package.json). ' +
           'The PO chooses the stack; update .github/github-app.yml and .github/scripts/dev.ps1 when it is introduced.'

switch ($Action) {
    'setup' {
        if (-not ($hasPython -or $hasNode)) { Write-Host "Setup: $noStack"; exit 0 }
        if ($hasPython) {
            if (-not (Test-Path $venvPython)) {
                $py = if (Get-Command py -ErrorAction SilentlyContinue) { 'py' } else { 'python' }
                Invoke-Checked $py @('-m', 'venv', '.venv')
            }
            Invoke-Checked $venvPython @('-m', 'pip', 'install', '--upgrade', 'pip', '--quiet')
            foreach ($r in $reqFiles) { Invoke-Checked $venvPython @('-m', 'pip', 'install', '-r', $r.Name) }
            if ($hasPyproject) { Invoke-Checked $venvPython @('-m', 'pip', 'install', '-e', '.') }
        }
        if ($hasNode) {
            if (Test-Path (Join-Path $root 'package-lock.json')) { Invoke-Checked 'npm' @('ci') }
            else { Invoke-Checked 'npm' @('install') }
        }
        Write-Host 'Setup complete.'
    }
    'run' {
        if ($hasNode -and (Get-NpmScripts) -contains 'start') { Invoke-Checked 'npm' @('start'); exit 0 }
        if ($hasNode -and (Get-NpmScripts) -contains 'dev') { Invoke-Checked 'npm' @('run', 'dev'); exit 0 }
        if ($hasPython -and (Test-Path (Join-Path $root 'main.py'))) {
            $py = if (Test-Path $venvPython) { $venvPython } else { 'python' }
            Invoke-Checked $py @('main.py'); exit 0
        }
        Write-Host "Run: nothing runnable found (expected main.py or an npm 'start'/'dev' script). $noStack"
    }
    'checks' {
        if (-not ($hasPython -or $hasNode)) { Write-Host "Checks: $noStack"; exit 0 }
        $ran = $false
        if ($hasPython -and (Test-Path $venvPython)) {
            if (Test-PyModule 'ruff') { Invoke-Checked $venvPython @('-m', 'ruff', 'check', '.'); $ran = $true }
            if (Test-PyModule 'pytest') { Invoke-Checked $venvPython @('-m', 'pytest', '-q'); $ran = $true }
        } elseif ($hasPython) {
            Write-Host 'Checks: Python project found but no .venv; run the Setup script first.'
        }
        if ($hasNode) {
            $npmScripts = Get-NpmScripts
            if ($npmScripts -contains 'lint') { Invoke-Checked 'npm' @('run', 'lint'); $ran = $true }
            if ($npmScripts -contains 'test') { Invoke-Checked 'npm' @('test'); $ran = $true }
        }
        if ($ran) { Write-Host 'All checks passed.' }
        else { Write-Host 'Checks: no linters/tests configured yet (ruff/pytest or npm lint/test).' }
    }
    'clean' {
        $venv = Join-Path $root '.venv'
        if (Test-Path $venv) {
            Remove-Item -LiteralPath $venv -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host 'Removed .venv'
        } else {
            Write-Host 'Nothing to clean (.venv not present).'
        }
    }
}
exit 0
