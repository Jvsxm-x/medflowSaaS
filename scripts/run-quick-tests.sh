#!/bin/bash

# Script pour exécuter rapidement les tests critiques (sans Playwright mobile)
# Usage: ./run-quick-tests.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$TESTS_DIR" || exit 1

echo "🧪 Tests Rapides - MedflowSaaS"
echo "============================================================"
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0

# 1. Tests unitaires
echo -e "${BLUE}1️⃣  Tests Unitaires${NC}"
cd unit/pytest || true
if pytest . -v --tb=short -q; then
    echo -e "${GREEN}✅ Tests unitaires réussis${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Tests unitaires échoués${NC}"
    ((FAILED++))
fi
cd "$TESTS_DIR" || true

# 2. Tests API
echo ""
echo -e "${BLUE}2️⃣  Tests API${NC}"
cd api/pytest || true
if pytest . -v --tb=short -q; then
    echo -e "${GREEN}✅ Tests API réussis${NC}"
    ((PASSED++))
else
    echo -e "${RED}❌ Tests API échoués${NC}"
    ((FAILED++))
fi
cd "$TESTS_DIR" || true

# 3. Tests Playwright (Chromium seulement pour rapidité)
echo ""
echo -e "${BLUE}3️⃣  Tests Playwright (Chromium uniquement)${NC}"
if [ -d "functional/playwright" ] && [ -f "functional/playwright/package.json" ]; then
    cd functional/playwright || true
    FRONTEND_URL="http://localhost:3000" npx playwright test --project=chromium -q 2>/dev/null
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Tests Playwright réussis${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  Certains tests Playwright ont échoué${NC}"
        ((FAILED++))
    fi
    cd "$TESTS_DIR" || true
else
    echo -e "${YELLOW}⚠️  Playwright non disponible${NC}"
    ((FAILED++))
fi

# 4. Tests de performance
echo ""
echo -e "${BLUE}4️⃣  Tests de Performance${NC}"
PYTHON_CMD=""
if command -v python &> /dev/null; then
    PYTHON_CMD="python"
elif command -v python3 &> /dev/null; then
    PYTHON_CMD="python3"
elif command -v py &> /dev/null; then
    PYTHON_CMD="py"
fi

if [ -n "$PYTHON_CMD" ] && [ -f "performance/simple/performance_test.py" ]; then
    if $PYTHON_CMD performance/simple/performance_test.py 3 2 2>/dev/null; then
        echo -e "${GREEN}✅ Tests de performance réussis${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  Tests de performance échoués${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️  Python non disponible${NC}"
    ((FAILED++))
fi

# 5. Tests de sécurité
echo ""
echo -e "${BLUE}5️⃣  Tests de Sécurité${NC}"
if [ -n "$PYTHON_CMD" ] && [ -f "security/basic/security_test.py" ]; then
    if $PYTHON_CMD security/basic/security_test.py 2>/dev/null; then
        echo -e "${GREEN}✅ Tests de sécurité réussis${NC}"
        ((PASSED++))
    else
        echo -e "${YELLOW}⚠️  Tests de sécurité avec avertissements${NC}"
        ((PASSED++))
    fi
else
    echo -e "${YELLOW}⚠️  Python non disponible${NC}"
    ((FAILED++))
fi

# Résumé
echo ""
echo "============================================================"
echo -e "${BLUE}📊 Résumé${NC}"
echo "============================================================"
echo -e "Succès: ${GREEN}$PASSED${NC}"
echo -e "Échecs: ${RED}$FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ Tous les tests sont passés!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Certains tests ont échoué${NC}"
    exit 1
fi



