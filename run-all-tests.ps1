# Script simple pour exécuter tous les tests sur Windows
# Usage: .\run-all-tests.ps1

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ScriptDir
& "$ScriptDir\scripts\run-all-tests.ps1"

