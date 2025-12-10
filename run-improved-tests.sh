#!/bin/bash

# 🔧 Script de Test Amélioré - MedflowSaaS
# Ce script exécute les tests avec les nouvelles optimisations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🎯 Tests Améliorés MedflowSaaS"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if frontend is running
check_frontend() {
    echo -n "🔍 Vérification du frontend sur localhost:3000... "
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}✓${NC}"
        return 0
    else
        echo -e "${RED}✗${NC}"
        echo ""
        echo -e "${YELLOW}⚠️  Le frontend n'est pas accessible sur http://localhost:3000${NC}"
        echo ""
        echo "Veuillez démarrer le frontend:"
        echo "  cd medflowSaaS-front/medflowSaaS-front"
        echo "  npm install"
        echo "  npm run dev"
        echo ""
        return 1
    fi
}

# Run unit tests
run_unit_tests() {
    echo ""
    echo "📋 1️⃣  Tests Unitaires (pytest)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cd "$PROJECT_ROOT/tests/unit/pytest"
    pytest -v --tb=short --maxfail=5
    echo -e "${GREEN}✅ Tests unitaires terminés${NC}"
}

# Run API tests
run_api_tests() {
    echo ""
    echo "📋 2️⃣  Tests API (pytest)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    cd "$PROJECT_ROOT/tests/api/pytest"
    pytest -v --tb=short --maxfail=5
    echo -e "${GREEN}✅ Tests API terminés${NC}"
}

# Run Playwright tests with improvements
run_playwright_tests() {
    echo ""
    echo "📋 3️⃣  Tests Fonctionnels Playwright (AMÉLIORÉS)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    if ! check_frontend; then
        echo -e "${RED}❌ Tests Playwright annulés - frontend requis${NC}"
        return 1
    fi
    
    cd "$PROJECT_ROOT/tests/functional/playwright"
    
    echo ""
    echo "Configuration des tests améliorés:"
    echo "  • Timeout: 120 secondes par test"
    echo "  • Retries: 1 réessai automatique"
    echo "  • Workers: 2 parallèles max"
    echo "  • SlowMo: 100ms entre actions"
    echo ""
    
    # Run with improved settings
    npx playwright test \
        --reporter=html,list \
        --output=../../reports/functional/playwright
    
    PLAYWRIGHT_EXIT_CODE=$?
    
    echo ""
    if [ $PLAYWRIGHT_EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✅ Tous les tests Playwright ont réussi!${NC}"
    else
        echo -e "${YELLOW}⚠️  Certains tests Playwright ont échoué${NC}"
        echo ""
        echo "Pour analyser les échecs:"
        echo "  • Rapport HTML: npx playwright show-report ../../reports/functional/playwright"
        echo "  • Vidéos: tests/functional/playwright/test-results/"
        echo "  • Screenshots: dans les dossiers test-results/"
    fi
    
    return $PLAYWRIGHT_EXIT_CODE
}

# Generate summary report
generate_summary() {
    echo ""
    echo "📊 Résumé de l'Exécution"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    
    if [ -f "$PROJECT_ROOT/tests/reports/functional/playwright/index.html" ]; then
        echo -e "${GREEN}✓${NC} Rapport HTML généré"
        echo "  Ouvrir: file://$PROJECT_ROOT/tests/reports/functional/playwright/index.html"
    fi
    
    echo ""
    echo "📁 Emplacements des rapports:"
    echo "  • Unitaire: tests/reports/unit/"
    echo "  • API: tests/reports/api/"
    echo "  • Playwright: tests/reports/functional/playwright/"
    echo ""
}

# Main execution
main() {
    # Parse arguments
    RUN_ALL=true
    RUN_UNIT=false
    RUN_API=false
    RUN_PLAYWRIGHT=false
    
    if [ $# -gt 0 ]; then
        RUN_ALL=false
        for arg in "$@"; do
            case $arg in
                --unit) RUN_UNIT=true ;;
                --api) RUN_API=true ;;
                --playwright) RUN_PLAYWRIGHT=true ;;
                --help)
                    echo "Usage: $0 [OPTIONS]"
                    echo ""
                    echo "Options:"
                    echo "  --unit        Exécuter uniquement les tests unitaires"
                    echo "  --api         Exécuter uniquement les tests API"
                    echo "  --playwright  Exécuter uniquement les tests Playwright"
                    echo "  --help        Afficher cette aide"
                    echo ""
                    echo "Sans option: exécute tous les tests"
                    exit 0
                    ;;
                *)
                    echo "Option inconnue: $arg"
                    echo "Utilisez --help pour voir les options disponibles"
                    exit 1
                    ;;
            esac
        done
    fi
    
    START_TIME=$(date +%s)
    
    # Run selected tests
    EXIT_CODE=0
    
    if [ "$RUN_ALL" = true ] || [ "$RUN_UNIT" = true ]; then
        run_unit_tests || EXIT_CODE=$?
    fi
    
    if [ "$RUN_ALL" = true ] || [ "$RUN_API" = true ]; then
        run_api_tests || EXIT_CODE=$?
    fi
    
    if [ "$RUN_ALL" = true ] || [ "$RUN_PLAYWRIGHT" = true ]; then
        run_playwright_tests || EXIT_CODE=$?
    fi
    
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    generate_summary
    
    echo ""
    echo "⏱️  Temps total: ${DURATION}s"
    echo ""
    
    if [ $EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}🎉 Tous les tests ont réussi!${NC}"
    else
        echo -e "${YELLOW}⚠️  Certains tests ont échoué (code: $EXIT_CODE)${NC}"
    fi
    
    exit $EXIT_CODE
}

main "$@"
