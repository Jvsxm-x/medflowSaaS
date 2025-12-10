# Script PowerShell pour exécuter tous les tests sur Windows
# Usage: .\run-all-tests.ps1

$ErrorActionPreference = "Continue"

Write-Host "🧪 Démarrage de l'exécution complète des tests MedflowSaaS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Obtenir le répertoire du script
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$TestsDir = Split-Path -Parent $ScriptDir

# Changer vers le répertoire tests
Set-Location $TestsDir

Write-Host "Répertoire de travail: $TestsDir" -ForegroundColor Gray
Write-Host ""

# Variables pour le résumé
$script:TotalTests = 0
$script:PassedTests = 0
$script:FailedTests = 0

# Créer les répertoires de rapports
$reportDirs = @(
    "reports\functional\playwright",
    "reports\functional\selenium",
    "reports\api\pytest",
    "reports\performance\jmeter",
    "reports\performance\locust",
    "reports\performance\simple",
    "reports\security\owasp-zap",
    "reports\security\basic",
    "reports\unit\pytest",
    "reports\coverage"
)

foreach ($dir in $reportDirs) {
    New-Item -ItemType Directory -Force -Path $dir | Out-Null
}

# Fonction pour afficher le résultat
function Print-Result {
    param(
        [bool]$Success,
        [string]$TestName
    )
    
    $script:TotalTests++
    if ($Success) {
        Write-Host "✅ $TestName" -ForegroundColor Green
        $script:PassedTests++
    } else {
        Write-Host "❌ $TestName" -ForegroundColor Red
        $script:FailedTests++
    }
}

# Fonction pour exécuter une suite de tests
function Run-TestSuite {
    param(
        [string]$TestName,
        [string]$TestDir,
        [string]$TestCommand
    )
    
    Write-Host ""
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    Write-Host "📋 $TestName" -ForegroundColor Blue
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Blue
    
    if (-not (Test-Path $TestDir)) {
        Write-Host "⚠️  Répertoire non trouvé: $TestDir" -ForegroundColor Yellow
        Print-Result $false "$TestName (skipped)"
        return $false
    }
    
    $originalLocation = Get-Location
    Set-Location $TestDir
    
    try {
        Invoke-Expression $TestCommand
        $success = $LASTEXITCODE -eq 0
        Print-Result $success $TestName
        return $success
    } catch {
        Write-Host "Erreur: $_" -ForegroundColor Red
        Print-Result $false $TestName
        return $false
    } finally {
        Set-Location $originalLocation
    }
}

# 1. Tests unitaires
Write-Host ""
Write-Host "1️⃣  Exécution des tests unitaires..." -ForegroundColor Cyan

if (Test-Path "unit\pytest") {
    $testFiles = Get-ChildItem -Path "unit\pytest" -Filter "test_*.py" -ErrorAction SilentlyContinue
    if ($testFiles) {
        # Vérifier si le backend existe pour la couverture
        $coverageArgs = ""
        if (Test-Path "..\medflowSaaS-front\medflowSaaS-main\backend\api") {
            $coverageArgs = "--cov=..\..\medflowSaaS-front\medflowSaaS-main\backend\api --cov-report=html:..\..\reports\coverage\htmlcov --cov-report=term"
        } elseif (Test-Path "..\medflowSaaS-main\backend\api") {
            $coverageArgs = "--cov=..\..\..\medflowSaaS-main\backend\api --cov-report=html:..\..\reports\coverage\htmlcov --cov-report=term"
        }
        
        Run-TestSuite "Tests unitaires" "unit\pytest" "pytest . -v $coverageArgs"
    } else {
        Write-Host "⚠️  Aucun test unitaire trouvé" -ForegroundColor Yellow
        Print-Result $false "Tests unitaires (skipped)"
    }
} else {
    Write-Host "⚠️  Répertoire unit\pytest non trouvé" -ForegroundColor Yellow
    Print-Result $false "Tests unitaires (skipped)"
}

# 2. Tests API
Write-Host ""
Write-Host "2️⃣  Exécution des tests API..." -ForegroundColor Cyan

if (Test-Path "api\pytest") {
    $testFiles = Get-ChildItem -Path "api\pytest" -Filter "test_*.py" -ErrorAction SilentlyContinue
    if ($testFiles) {
        Run-TestSuite "Tests API" "api\pytest" "pytest . -v --tb=short"
    } else {
        Write-Host "⚠️  Aucun test API trouvé" -ForegroundColor Yellow
        Print-Result $false "Tests API (skipped)"
    }
} else {
    Write-Host "⚠️  Répertoire api\pytest non trouvé" -ForegroundColor Yellow
    Print-Result $false "Tests API (skipped)"
}

# 3. Tests fonctionnels Playwright
Write-Host ""
Write-Host "3️⃣  Exécution des tests fonctionnels Playwright..." -ForegroundColor Cyan

if (Test-Path "functional\playwright") {
    if (Test-Path "functional\playwright\package.json") {
        Run-TestSuite "Tests Playwright" "functional\playwright" "npm test"
    } else {
        Write-Host "⚠️  package.json non trouvé, tentative d'installation..." -ForegroundColor Yellow
        Set-Location "functional\playwright"
        try {
            npm install 2>&1 | Out-Null
            npx playwright install --with-deps 2>&1 | Out-Null
            Run-TestSuite "Tests Playwright" "functional\playwright" "npm test"
        } catch {
            Write-Host "❌ Échec de l'installation des dépendances Playwright" -ForegroundColor Red
            Print-Result $false "Tests Playwright (installation failed)"
        }
        Set-Location $TestsDir
    }
} else {
    Write-Host "⚠️  Répertoire Playwright non trouvé" -ForegroundColor Yellow
    Print-Result $false "Tests Playwright (skipped)"
}

# 4. Tests fonctionnels Selenium
Write-Host ""
Write-Host "4️⃣  Exécution des tests fonctionnels Selenium..." -ForegroundColor Cyan

if (Test-Path "functional\selenium") {
    $testFiles = Get-ChildItem -Path "functional\selenium" -Filter "test_*.py" -ErrorAction SilentlyContinue
    if ($testFiles) {
        Run-TestSuite "Tests Selenium" "functional\selenium" "pytest . -v --tb=short"
    } else {
        Write-Host "⚠️  Aucun test Selenium trouvé" -ForegroundColor Yellow
        Print-Result $false "Tests Selenium (skipped)"
    }
} else {
    Write-Host "⚠️  Répertoire functional\selenium non trouvé" -ForegroundColor Yellow
    Print-Result $false "Tests Selenium (skipped)"
}

# 5. Tests de performance
Write-Host ""
Write-Host "5️⃣  Tests de performance..." -ForegroundColor Cyan

# Détecter Python
$pythonCmd = $null
if (Get-Command python -ErrorAction SilentlyContinue) {
    $pythonCmd = "python"
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
    $pythonCmd = "python3"
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
    $pythonCmd = "py"
}

$performanceExecuted = $false

# Essayer Locust d'abord
if ($pythonCmd) {
    try {
        $locustCheck = & $pythonCmd -c "import locust" 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Utilisation de Locust pour les tests de performance" -ForegroundColor Blue
            Set-Location "performance\locust"
            $configPath = Join-Path $TestsDir "config\test-config.json"
            $apiBase = (Get-Content $configPath | ConvertFrom-Json).environments.local.api_base
            $baseUrl = $apiBase -replace '/api', ''
            $locustCmd = "locust -f locust_test.py --host=$baseUrl --users 5 --spawn-rate 1 --run-time 10s --headless --html ..\..\reports\performance\locust\report.html"
            Invoke-Expression $locustCmd 2>&1 | Out-Null
            Print-Result ($LASTEXITCODE -eq 0) "Tests de performance (Locust)"
            $performanceExecuted = $true
            Set-Location $TestsDir
        }
    } catch {
        # Locust non disponible, continuer
    }
}

# Essayer JMeter si disponible
if (-not $performanceExecuted) {
    $jmeterPath = Get-Command jmeter -ErrorAction SilentlyContinue
    if ($jmeterPath) {
        if (Test-Path "performance\jmeter\medflow-load-test.jmx") {
            Write-Host "Utilisation de JMeter" -ForegroundColor Blue
            Set-Location "performance\jmeter"
            try {
                jmeter -n -t medflow-load-test.jmx -l results.jtl -e -o ..\..\reports\performance\jmeter\html-report 2>&1 | Out-Null
                Print-Result ($LASTEXITCODE -eq 0) "Tests de performance (JMeter)"
                $performanceExecuted = $true
            } catch {
                Print-Result $false "Tests de performance (JMeter)"
            }
            Set-Location $TestsDir
        }
    }
}

# Utiliser les tests simples Python (fallback ou toujours exécuter)
if (-not $performanceExecuted) {
    if ($pythonCmd -and (Test-Path "performance\simple\performance_test.py")) {
        Write-Host "Utilisation de tests de performance simples (Python)" -ForegroundColor Blue
        & $pythonCmd "performance\simple\performance_test.py" 5 3 2>&1 | Out-Null
        Print-Result ($LASTEXITCODE -eq 0) "Tests de performance (Simple)"
        $performanceExecuted = $true
    } elseif (Test-Path "performance\simple\run_performance_test.ps1") {
        Write-Host "Utilisation de tests de performance simples (PowerShell)" -ForegroundColor Blue
        & powershell.exe -ExecutionPolicy Bypass -File "performance\simple\run_performance_test.ps1" 2>&1 | Out-Null
        Print-Result ($LASTEXITCODE -eq 0) "Tests de performance (Simple)"
        $performanceExecuted = $true
    }
}

if (-not $performanceExecuted) {
    Write-Host "⚠️  Scripts de performance non trouvés" -ForegroundColor Yellow
    Print-Result $false "Tests de performance (skipped)"
}

# 6. Tests de sécurité
Write-Host ""
Write-Host "6️⃣  Tests de sécurité..." -ForegroundColor Cyan

# Détecter Python (réutiliser depuis la section précédente si défini)
if (-not $pythonCmd) {
    if (Get-Command python -ErrorAction SilentlyContinue) {
        $pythonCmd = "python"
    } elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
        $pythonCmd = "python3"
    } elseif (Get-Command py -ErrorAction SilentlyContinue) {
        $pythonCmd = "py"
    }
}

$securityExecuted = $false

# Essayer OWASP ZAP d'abord si disponible
$zapPath = Get-Command zap-cli -ErrorAction SilentlyContinue
if (-not $zapPath) {
    $zapPath = Get-Command zap.bat -ErrorAction SilentlyContinue
}

if ($zapPath -or (Test-Path "C:\Program Files\OWASP\Zed Attack Proxy\zap.bat")) {
    if ($pythonCmd -and (Test-Path "security\owasp-zap\zap_scan.py")) {
        Write-Host "Utilisation d'OWASP ZAP" -ForegroundColor Blue
        & $pythonCmd "security\owasp-zap\zap_scan.py" 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Print-Result $true "Tests de sécurité (OWASP ZAP)"
            $securityExecuted = $true
        }
    }
}

# Utiliser les tests de sécurité basiques (fonctionnent toujours)
if (-not $securityExecuted) {
    if ($pythonCmd -and (Test-Path "security\basic\security_test.py")) {
        Write-Host "Utilisation de tests de sécurité basiques (Python)" -ForegroundColor Blue
        & $pythonCmd "security\basic\security_test.py" 2>&1 | Out-Null
        Print-Result ($LASTEXITCODE -eq 0) "Tests de sécurité (Basic)"
        $securityExecuted = $true
    } elseif (Test-Path "security\basic\run_security_test.ps1") {
        Write-Host "Utilisation de tests de sécurité basiques (PowerShell)" -ForegroundColor Blue
        & powershell.exe -ExecutionPolicy Bypass -File "security\basic\run_security_test.ps1" 2>&1 | Out-Null
        Print-Result ($LASTEXITCODE -eq 0) "Tests de sécurité (Basic)"
        $securityExecuted = $true
    }
}

if (-not $securityExecuted) {
    Write-Host "⚠️  Scripts de sécurité non trouvés" -ForegroundColor Yellow
    Print-Result $false "Tests de sécurité (skipped)"
}

# Résumé final
Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "📊 Résumé de l'exécution" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "Total: $script:TotalTests suites de tests" -ForegroundColor Blue
Write-Host "Succès: $script:PassedTests" -ForegroundColor Green
Write-Host "Échecs: $script:FailedTests" -ForegroundColor Red
Write-Host ""
Write-Host "Rapports générés dans: reports\" -ForegroundColor Gray
Write-Host ""
Write-Host "Pour visualiser les rapports:" -ForegroundColor Gray
Write-Host "  - Playwright: reports\functional\playwright\index.html" -ForegroundColor Gray
Write-Host "  - Coverage: reports\coverage\htmlcov\index.html" -ForegroundColor Gray
Write-Host "  - Performance: reports\performance\simple\report.txt ou reports\performance\locust\report.html" -ForegroundColor Gray
Write-Host "  - Sécurité: reports\security\basic\report.txt" -ForegroundColor Gray
Write-Host "  - API/Selenium: reports\api\pytest\ ou reports\functional\selenium\" -ForegroundColor Gray
Write-Host ""

if ($script:FailedTests -eq 0) {
    Write-Host "✅ Tous les tests sont passés!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "⚠️  Certains tests ont échoué ou ont été ignorés" -ForegroundColor Yellow
    Write-Host "   Vérifiez les rapports pour plus de détails" -ForegroundColor Yellow
    exit 1
}

