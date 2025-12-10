# Script PowerShell pour executer les tests de performance simples
# Alternative si Locust/JMeter ne sont pas disponibles

$ErrorActionPreference = "Continue"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TestsDir = Split-Path -Parent (Split-Path -Parent $ScriptDir)

# Detecter Python
$pythonCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    $pythonCmd = "python3"
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = "py"
} else {
    Write-Host "[ERREUR] Python non trouve" -ForegroundColor Red
    exit 1
}

Write-Host "Tests de Performance Simples" -ForegroundColor Cyan
Write-Host "Utilisation de: $pythonCmd"
Write-Host ""

# Le script est dans le meme dossier
$scriptPath = Join-Path $ScriptDir "performance_test.py"
if (Test-Path $scriptPath) {
    Set-Location $TestsDir
    & $pythonCmd $scriptPath 5 3
    exit $LASTEXITCODE
} else {
    Write-Host "[ERREUR] Script non trouve: $scriptPath" -ForegroundColor Red
    exit 1
}

