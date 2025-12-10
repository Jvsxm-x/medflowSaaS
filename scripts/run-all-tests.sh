#!/bin/bash

# Script pour exécuter tous les tests
# Usage: ./run-all-tests.sh
# 
# Ce script doit être exécuté depuis le répertoire tests/

# Obtenir le répertoire du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Changer vers le répertoire tests
cd "$TESTS_DIR" || exit 1

echo "🧪 Démarrage de l'exécution complète des tests MedflowSaaS"
echo "============================================================"
echo "Répertoire de travail: $TESTS_DIR"
echo ""

# Couleurs pour la sortie
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables pour le résumé
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Créer les répertoires de rapports (chemins relatifs depuis tests/)
mkdir -p reports/functional/playwright
mkdir -p reports/functional/selenium
mkdir -p reports/api/pytest
mkdir -p reports/performance/jmeter
mkdir -p reports/performance/locust
mkdir -p reports/performance/simple
mkdir -p reports/security/owasp-zap
mkdir -p reports/security/basic
mkdir -p reports/unit/pytest
mkdir -p reports/coverage

# Fonction pour afficher le résultat
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
        ((PASSED_TESTS++))
    else
        echo -e "${RED}❌ $2${NC}"
        ((FAILED_TESTS++))
    fi
    ((TOTAL_TESTS++))
}

# Fonction pour exécuter une commande et gérer les erreurs
run_test_suite() {
    local test_name="$1"
    local test_dir="$2"
    local test_command="$3"
    
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📋 $test_name${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    if [ ! -d "$test_dir" ]; then
        echo -e "${YELLOW}⚠️  Répertoire non trouvé: $test_dir${NC}"
        print_result 1 "$test_name"
        return 1
    fi
    
    cd "$test_dir" || return 1
    
    if eval "$test_command"; then
        print_result 0 "$test_name"
        cd "$TESTS_DIR" || return 1
        return 0
    else
        print_result 1 "$test_name"
        cd "$TESTS_DIR" || return 1
        return 1
    fi
}

# 1. Tests unitaires
echo ""
echo "1️⃣  Exécution des tests unitaires..."
if [ -d "unit/pytest" ] && [ -n "$(find unit/pytest -name 'test_*.py' 2>/dev/null)" ]; then
    # Vérifier si le backend existe pour la couverture
    BACKEND_PATH=""
    if [ -d "../medflowSaaS-front/medflowSaaS-main/backend/api" ]; then
        BACKEND_PATH="--cov=../../medflowSaaS-front/medflowSaaS-main/backend/api --cov-report=html:../../reports/coverage/htmlcov --cov-report=term"
    elif [ -d "../medflowSaaS-main/backend/api" ]; then
        BACKEND_PATH="--cov=../../../medflowSaaS-main/backend/api --cov-report=html:../../reports/coverage/htmlcov --cov-report=term"
    fi
    
    run_test_suite "Tests unitaires" "unit/pytest" "pytest . -v $BACKEND_PATH" || true
else
    echo -e "${YELLOW}⚠️  Aucun test unitaire trouvé${NC}"
    print_result 1 "Tests unitaires (skipped)"
fi

# 2. Tests API
echo ""
echo "2️⃣  Exécution des tests API..."
if [ -d "api/pytest" ] && [ -n "$(find api/pytest -name 'test_*.py' 2>/dev/null)" ]; then
    run_test_suite "Tests API" "api/pytest" "pytest . -v --tb=short" || true
else
    echo -e "${YELLOW}⚠️  Aucun test API trouvé${NC}"
    print_result 1 "Tests API (skipped)"
fi

# 3. Tests fonctionnels Playwright
echo ""
echo "3️⃣  Exécution des tests fonctionnels Playwright..."
if [ -d "functional/playwright" ]; then
    if [ -f "functional/playwright/package.json" ]; then
        # Vérifier si Playwright est installé
        if [ -d "functional/playwright/node_modules/@playwright" ]; then
            # Détecter l'URL du frontend (essaie plusieurs ports)
            FRONTEND_URL=""
            
            # Vérifier la variable d'environnement d'abord
            if [ -n "$FRONTEND_URL_ENV" ]; then
                FRONTEND_URL="$FRONTEND_URL_ENV"
            else
                # Essayer de lire depuis la config
                FRONTEND_URL=$(cat config/test-config.json 2>/dev/null | grep -o '"frontend_url": "[^"]*"' | head -1 | cut -d'"' -f4 2>/dev/null || echo "")
                
                # Si pas dans la config, essayer les ports courants
                if [ -z "$FRONTEND_URL" ]; then
                    for port in 3000 5173 3001 8080 4200; do
                        test_url="http://localhost:$port"
                        if curl -s -o /dev/null -w "%{http_code}" "$test_url" --max-time 2 2>/dev/null | grep -q "200\|404\|301\|302"; then
                            FRONTEND_URL="$test_url"
                            echo -e "${BLUE}ℹ️  Frontend détecté sur $FRONTEND_URL${NC}"
                            break
                        fi
                    done
                fi
                
                # Par défaut utiliser 3000
                if [ -z "$FRONTEND_URL" ]; then
                    FRONTEND_URL="http://localhost:3000"
                fi
            fi
            
            # Vérifier si le frontend est accessible
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" --max-time 3 2>/dev/null || echo "000")
            if echo "$HTTP_CODE" | grep -q "200\|404\|301\|302"; then
                echo -e "${BLUE}ℹ️  Frontend accessible à $FRONTEND_URL${NC}"
                export FRONTEND_URL="$FRONTEND_URL"
                cd functional/playwright || true
                FRONTEND_URL="$FRONTEND_URL" npm test
                TEST_EXIT=$?
                cd "$TESTS_DIR" || true
                if [ $TEST_EXIT -eq 0 ]; then
                    print_result 0 "Tests Playwright"
                else
                    print_result 1 "Tests Playwright"
                fi
            else
                echo -e "${YELLOW}⚠️  Frontend non accessible à $FRONTEND_URL (code: $HTTP_CODE)${NC}"
                echo -e "${YELLOW}   Démarrez le frontend avant d'exécuter les tests Playwright${NC}"
                echo -e "${YELLOW}   Ports testés: 3000, 5173, 3001, 8080, 4200${NC}"
                echo -e "${YELLOW}   Ou définissez FRONTEND_URL_ENV=http://localhost:PORT${NC}"
                print_result 1 "Tests Playwright (frontend required)"
            fi
        else
            echo -e "${YELLOW}⚠️  Playwright non installé${NC}"
            echo -e "${YELLOW}   Installation: cd functional/playwright && npm install && npm run install-browsers${NC}"
            print_result 1 "Tests Playwright (installation required)"
        fi
    else
        echo -e "${YELLOW}⚠️  package.json non trouvé${NC}"
        print_result 1 "Tests Playwright (skipped)"
    fi
else
    echo -e "${YELLOW}⚠️  Répertoire Playwright non trouvé${NC}"
    print_result 1 "Tests Playwright (skipped)"
fi

# 4. Tests fonctionnels Selenium
echo ""
echo "4️⃣  Exécution des tests fonctionnels Selenium..."
if [ -d "functional/selenium" ] && [ -n "$(find functional/selenium -name 'test_*.py' 2>/dev/null)" ]; then
    run_test_suite "Tests Selenium" "functional/selenium" "pytest . -v --tb=short" || true
else
    echo -e "${YELLOW}⚠️  Aucun test Selenium trouvé${NC}"
    print_result 1 "Tests Selenium (skipped)"
fi

# 5. Tests de performance
echo ""
echo "5️⃣  Tests de performance..."

# Détecter Python
PYTHON_CMD=""
if command -v python &> /dev/null && python --version &> /dev/null; then
    PYTHON_CMD="python"
elif command -v python3 &> /dev/null && python3 --version &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v py &> /dev/null && py --version &> /dev/null; then
    PYTHON_CMD="py"
fi

PERFORMANCE_EXECUTED=false

# Essayer Locust d'abord (plus facile)
if [ -n "$PYTHON_CMD" ] && $PYTHON_CMD -c "import locust" 2>/dev/null; then
    echo -e "${BLUE}Utilisation de Locust pour les tests de performance${NC}"
    cd performance/locust || true
    API_BASE=$($PYTHON_CMD -c "import json; print(json.load(open('../../config/test-config.json'))['environments']['local']['api_base'])" 2>/dev/null || echo "http://localhost:8000/api")
    BASE_URL=$(echo $API_BASE | sed 's|/api||')
    if locust -f locust_test.py --host="$BASE_URL" --users 5 --spawn-rate 1 --run-time 10s --headless --html ../../reports/performance/locust/report.html 2>/dev/null; then
        print_result 0 "Tests de performance (Locust)"
        PERFORMANCE_EXECUTED=true
    else
        print_result 1 "Tests de performance (Locust)"
    fi
    cd "$TESTS_DIR" || true
fi

# Essayer JMeter si disponible et Locust n'a pas été exécuté
if [ "$PERFORMANCE_EXECUTED" = false ] && command -v jmeter &> /dev/null; then
    echo -e "${BLUE}Utilisation de JMeter${NC}"
    if [ -f "performance/jmeter/medflow-load-test.jmx" ]; then
        cd performance/jmeter || true
        if jmeter -n -t medflow-load-test.jmx -l results.jtl -e -o ../../reports/performance/jmeter/html-report 2>/dev/null; then
            print_result 0 "Tests de performance (JMeter)"
            PERFORMANCE_EXECUTED=true
        else
            print_result 1 "Tests de performance (JMeter)"
        fi
        cd "$TESTS_DIR" || true
    fi
fi

# Test simple Python (fallback si Locust/JMeter n'ont pas été exécutés ou ont échoué)
if [ "$PERFORMANCE_EXECUTED" = false ]; then
    if [ -n "$PYTHON_CMD" ] && [ -f "performance/simple/performance_test.py" ]; then
        echo -e "${BLUE}Utilisation de tests de performance simples (Python)${NC}"
        if $PYTHON_CMD performance/simple/performance_test.py 5 3 2>/dev/null; then
            print_result 0 "Tests de performance (Simple)"
            PERFORMANCE_EXECUTED=true
        else
            echo -e "${YELLOW}⚠️  Pour des tests plus complets, installez Locust: pip install locust${NC}"
            print_result 1 "Tests de performance (skipped)"
        fi
    elif [ -z "$PYTHON_CMD" ] && command -v powershell.exe &> /dev/null && [ -f "performance/simple/run_performance_test.ps1" ]; then
        # Essayer PowerShell sur Windows si Python n'est pas disponible
        echo -e "${BLUE}Utilisation de tests de performance simples (PowerShell)${NC}"
        if powershell.exe -ExecutionPolicy Bypass -File "performance/simple/run_performance_test.ps1" 2>/dev/null; then
            print_result 0 "Tests de performance (Simple)"
            PERFORMANCE_EXECUTED=true
        else
            print_result 1 "Tests de performance (skipped)"
        fi
    else
        echo -e "${YELLOW}⚠️  Scripts de performance non trouvés${NC}"
        print_result 1 "Tests de performance (skipped)"
    fi
fi

# 6. Tests de sécurité
echo ""
echo "6️⃣  Tests de sécurité..."

# Détecter Python (réutiliser depuis la section précédente si défini)
if [ -z "$PYTHON_CMD" ]; then
    if command -v python &> /dev/null && python --version &> /dev/null; then
        PYTHON_CMD="python"
    elif command -v python3 &> /dev/null && python3 --version &> /dev/null; then
        PYTHON_CMD="python3"
    elif command -v py &> /dev/null && py --version &> /dev/null; then
        PYTHON_CMD="py"
    fi
fi

SECURITY_EXECUTED=false

# Essayer OWASP ZAP d'abord si disponible
if [ "$SECURITY_EXECUTED" = false ] && (command -v zap-cli &> /dev/null || command -v zap.sh &> /dev/null || [ -f "/Applications/OWASP ZAP.app/Contents/Java/zap.sh" ] 2>/dev/null); then
    if [ -n "$PYTHON_CMD" ] && [ -f "security/owasp-zap/zap_scan.py" ]; then
        echo -e "${BLUE}Utilisation d'OWASP ZAP${NC}"
        if $PYTHON_CMD security/owasp-zap/zap_scan.py 2>/dev/null; then
            print_result 0 "Tests de sécurité (OWASP ZAP)"
            SECURITY_EXECUTED=true
            cd "$TESTS_DIR" || true
        fi
    fi
fi

# Utiliser les tests de sécurité basiques (fonctionnent toujours) si ZAP n'a pas été exécuté
if [ "$SECURITY_EXECUTED" = false ]; then
    if [ -n "$PYTHON_CMD" ] && [ -f "security/basic/security_test.py" ]; then
        echo -e "${BLUE}Utilisation de tests de sécurité basiques (Python)${NC}"
        if $PYTHON_CMD security/basic/security_test.py 2>/dev/null; then
            print_result 0 "Tests de sécurité (Basic)"
            SECURITY_EXECUTED=true
        else
            # Essayer PowerShell sur Windows
            if command -v powershell.exe &> /dev/null && [ -f "security/basic/run_security_test.ps1" ]; then
                echo -e "${BLUE}Utilisation de tests de sécurité basiques (PowerShell)${NC}"
                if powershell.exe -ExecutionPolicy Bypass -File "security/basic/run_security_test.ps1" 2>/dev/null; then
                    print_result 0 "Tests de sécurité (Basic)"
                    SECURITY_EXECUTED=true
                else
                    echo -e "${YELLOW}⚠️  Tests de sécurité non disponibles${NC}"
                    print_result 1 "Tests de sécurité (skipped)"
                fi
            else
                echo -e "${YELLOW}⚠️  Python non disponible pour les tests de sécurité${NC}"
                print_result 1 "Tests de sécurité (skipped)"
            fi
        fi
    elif command -v powershell.exe &> /dev/null && [ -f "security/basic/run_security_test.ps1" ]; then
        echo -e "${BLUE}Utilisation de tests de sécurité basiques (PowerShell)${NC}"
        if powershell.exe -ExecutionPolicy Bypass -File "security/basic/run_security_test.ps1" 2>/dev/null; then
            print_result 0 "Tests de sécurité (Basic)"
            SECURITY_EXECUTED=true
        else
            echo -e "${YELLOW}⚠️  Tests de sécurité non disponibles${NC}"
            print_result 1 "Tests de sécurité (skipped)"
        fi
    else
        echo -e "${YELLOW}⚠️  Scripts de sécurité non trouvés${NC}"
        print_result 1 "Tests de sécurité (skipped)"
    fi
fi

# Résumé final
echo ""
echo "============================================================"
echo "📊 Résumé de l'exécution"
echo "============================================================"
echo -e "Total: ${BLUE}$TOTAL_TESTS${NC} suites de tests"
echo -e "Succès: ${GREEN}$PASSED_TESTS${NC}"
echo -e "Échecs: ${RED}$FAILED_TESTS${NC}"
echo ""
echo "Rapports générés dans: reports/"
echo ""
echo "Pour visualiser les rapports:"
echo "  - Playwright: reports/functional/playwright/index.html"
echo "  - Coverage: reports/coverage/htmlcov/index.html"
echo "  - Performance: reports/performance/simple/report.txt ou reports/performance/locust/report.html"
echo "  - Sécurité: reports/security/basic/report.txt"
echo "  - API/Selenium: reports/api/pytest/ ou reports/functional/selenium/"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les tests sont passés!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Certains tests ont échoué ou ont été ignorés${NC}"
    echo -e "${YELLOW}   Vérifiez les rapports pour plus de détails${NC}"
    exit 1
fi

