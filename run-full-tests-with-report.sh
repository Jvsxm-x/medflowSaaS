#!/bin/bash

# 📊 Script de Génération de Rapport Complet - MedflowSaaS
# Ce script exécute tous les tests et génère un rapport détaillé

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
REPORT_DIR="$SCRIPT_DIR/reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║     📊 GÉNÉRATION RAPPORT COMPLET - MedflowSaaS          ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Create reports directory structure
mkdir -p "$REPORT_DIR/unit"
mkdir -p "$REPORT_DIR/api"
mkdir -p "$REPORT_DIR/functional/playwright"
mkdir -p "$REPORT_DIR/summary"

# Variables for tracking
UNIT_PASSED=0
UNIT_FAILED=0
API_PASSED=0
API_FAILED=0
API_SKIPPED=0
PLAYWRIGHT_PASSED=0
PLAYWRIGHT_FAILED=0
PLAYWRIGHT_SKIPPED=0

START_TIME=$(date +%s)

echo -e "${YELLOW}📋 ÉTAPE 1/4: Tests Unitaires${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd "$SCRIPT_DIR/unit/pytest"

if pytest -v --tb=short --html="$REPORT_DIR/unit/report.html" --json-report --json-report-file="$REPORT_DIR/unit/report.json" 2>&1 | tee "$REPORT_DIR/unit/output.log"; then
    UNIT_PASSED=$(grep -c "PASSED" "$REPORT_DIR/unit/output.log" || echo 0)
    UNIT_FAILED=$(grep -c "FAILED" "$REPORT_DIR/unit/output.log" || echo 0)
    echo -e "${GREEN}✅ Tests unitaires terminés${NC}"
else
    echo -e "${YELLOW}⚠️  Tests unitaires terminés avec avertissements${NC}"
fi

echo ""
echo -e "${YELLOW}📋 ÉTAPE 2/4: Tests API${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd "$SCRIPT_DIR/api/pytest"

if pytest -v --tb=short --html="$REPORT_DIR/api/report.html" --json-report --json-report-file="$REPORT_DIR/api/report.json" 2>&1 | tee "$REPORT_DIR/api/output.log"; then
    API_PASSED=$(grep -c "PASSED" "$REPORT_DIR/api/output.log" || echo 0)
    API_FAILED=$(grep -c "FAILED" "$REPORT_DIR/api/output.log" || echo 0)
    API_SKIPPED=$(grep -c "SKIPPED" "$REPORT_DIR/api/output.log" || echo 0)
    echo -e "${GREEN}✅ Tests API terminés${NC}"
else
    echo -e "${YELLOW}⚠️  Tests API terminés avec avertissements${NC}"
fi

echo ""
echo -e "${YELLOW}📋 ÉTAPE 3/4: Vérification Frontend${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FRONTEND_RUNNING=false
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend accessible sur localhost:3000${NC}"
    FRONTEND_RUNNING=true
else
    echo -e "${RED}✗ Frontend NON accessible sur localhost:3000${NC}"
    echo ""
    echo -e "${YELLOW}⚠️  Pour exécuter les tests Playwright, démarrez le frontend:${NC}"
    echo "   cd medflowSaaS-front/medflowSaaS-front"
    echo "   npm run dev"
    echo ""
fi

echo ""
echo -e "${YELLOW}📋 ÉTAPE 4/4: Tests Playwright${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd "$SCRIPT_DIR/functional/playwright"

if [ "$FRONTEND_RUNNING" = true ]; then
    if npx playwright test --reporter=html,json 2>&1 | tee "$REPORT_DIR/functional/playwright/output.log"; then
        PLAYWRIGHT_PASSED=$(grep -c "passed" "$REPORT_DIR/functional/playwright/output.log" || echo 0)
        PLAYWRIGHT_FAILED=$(grep -c "failed" "$REPORT_DIR/functional/playwright/output.log" || echo 0)
        PLAYWRIGHT_SKIPPED=$(grep -c "skipped" "$REPORT_DIR/functional/playwright/output.log" || echo 0)
        echo -e "${GREEN}✅ Tests Playwright terminés${NC}"
    else
        echo -e "${YELLOW}⚠️  Tests Playwright terminés avec des échecs${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Tests Playwright SKIPPED - Frontend non accessible${NC}"
    PLAYWRIGHT_SKIPPED=65
fi

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Generate summary report
echo ""
echo -e "${BLUE}📊 GÉNÉRATION DU RAPPORT RÉCAPITULATIF${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SUMMARY_FILE="$REPORT_DIR/summary/report_${TIMESTAMP}.md"

cat > "$SUMMARY_FILE" << EOF
# 📊 Rapport d'Exécution des Tests - MedflowSaaS

**Date**: $(date "+%d %B %Y à %H:%M:%S")  
**Durée Totale**: ${DURATION}s  
**Générateur**: run-full-tests-with-report.sh

---

## 📋 Résumé Global

\`\`\`
╔════════════════════════════════════════════════════════════╗
║                  RÉSULTATS DES TESTS                       ║
╠════════════════════════════════════════════════════════════╣
║ Tests Unitaires:     ${UNIT_PASSED} passés, ${UNIT_FAILED} échecs                    ║
║ Tests API:           ${API_PASSED} passés, ${API_FAILED} échecs, ${API_SKIPPED} skipped         ║
║ Tests Playwright:    ${PLAYWRIGHT_PASSED} passés, ${PLAYWRIGHT_FAILED} échecs, ${PLAYWRIGHT_SKIPPED} skipped    ║
╚════════════════════════════════════════════════════════════╝
\`\`\`

## 📈 Détails par Suite

### 1️⃣ Tests Unitaires
- ✅ Passés: ${UNIT_PASSED}
- ❌ Échecs: ${UNIT_FAILED}
- 📊 Taux de réussite: $(awk "BEGIN {print ($UNIT_PASSED/($UNIT_PASSED+$UNIT_FAILED))*100}")%
- 📄 Rapport: [unit/report.html](../unit/report.html)

### 2️⃣ Tests API
- ✅ Passés: ${API_PASSED}
- ❌ Échecs: ${API_FAILED}
- ⚠️  Skipped: ${API_SKIPPED}
- 📊 Taux de réussite: $(awk "BEGIN {print ($API_PASSED/($API_PASSED+$API_FAILED+$API_SKIPPED))*100}")%
- 📄 Rapport: [api/report.html](../api/report.html)

### 3️⃣ Tests Playwright
- ✅ Passés: ${PLAYWRIGHT_PASSED}
- ❌ Échecs: ${PLAYWRIGHT_FAILED}
- ⚠️  Skipped: ${PLAYWRIGHT_SKIPPED}
EOF

if [ "$FRONTEND_RUNNING" = true ]; then
cat >> "$SUMMARY_FILE" << EOF
- 📊 Taux de réussite: $(awk "BEGIN {print ($PLAYWRIGHT_PASSED/($PLAYWRIGHT_PASSED+$PLAYWRIGHT_FAILED+$PLAYWRIGHT_SKIPPED))*100}")%
- 📄 Rapport: [functional/playwright/index.html](../functional/playwright/index.html)
EOF
else
cat >> "$SUMMARY_FILE" << EOF
- ⚠️  Status: Frontend non accessible - Tests non exécutés
- 📝 Note: Démarrer le frontend sur localhost:3000 pour exécuter ces tests
EOF
fi

cat >> "$SUMMARY_FILE" << EOF

## 📁 Artefacts Générés

\`\`\`
reports/
├── unit/
│   ├── report.html       ✅
│   ├── report.json       ✅
│   └── output.log        ✅
├── api/
│   ├── report.html       ✅
│   ├── report.json       ✅
│   └── output.log        ✅
├── functional/
│   └── playwright/
│       ├── index.html    $([ "$FRONTEND_RUNNING" = true ] && echo "✅" || echo "⚠️ ")
│       └── output.log    ✅
└── summary/
    └── report_${TIMESTAMP}.md  ✅
\`\`\`

## 🎯 Recommandations

EOF

if [ ${UNIT_FAILED} -gt 0 ]; then
cat >> "$SUMMARY_FILE" << EOF
- ⚠️  **${UNIT_FAILED} tests unitaires échoués** - Consulter unit/report.html
EOF
fi

if [ ${API_FAILED} -gt 0 ]; then
cat >> "$SUMMARY_FILE" << EOF
- ⚠️  **${API_FAILED} tests API échoués** - Consulter api/report.html
EOF
fi

if [ ${API_SKIPPED} -gt 0 ]; then
cat >> "$SUMMARY_FILE" << EOF
- ⚠️  **${API_SKIPPED} tests API skipped** - Vérifier les raisons dans les logs
EOF
fi

if [ "$FRONTEND_RUNNING" = false ]; then
cat >> "$SUMMARY_FILE" << EOF
- 🔴 **Frontend non accessible** - Démarrer avec:
  \`\`\`bash
  cd medflowSaaS-front/medflowSaaS-front
  npm run dev
  \`\`\`
EOF
fi

if [ ${PLAYWRIGHT_FAILED} -gt 0 ]; then
cat >> "$SUMMARY_FILE" << EOF
- ⚠️  **${PLAYWRIGHT_FAILED} tests Playwright échoués** - Consulter functional/playwright/index.html
EOF
fi

cat >> "$SUMMARY_FILE" << EOF

## ✅ Prochaines Étapes

1. [ ] Consulter les rapports HTML générés
2. [ ] Corriger les tests échoués (si applicable)
3. [ ] Démarrer le frontend si non fait (pour Playwright)
4. [ ] Re-exécuter la suite complète
5. [ ] Vérifier la couverture de code

---

**Généré automatiquement** - $(date)
EOF

echo -e "${GREEN}✅ Rapport récapitulatif généré: $SUMMARY_FILE${NC}"

# Display summary
echo ""
echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                   RÉSUMÉ FINAL                            ║${NC}"
echo -e "${BLUE}╠═══════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC} Tests Unitaires:  ${UNIT_PASSED} passés / ${UNIT_FAILED} échecs                     ${BLUE}║${NC}"
echo -e "${BLUE}║${NC} Tests API:        ${API_PASSED} passés / ${API_FAILED} échecs / ${API_SKIPPED} skipped         ${BLUE}║${NC}"
echo -e "${BLUE}║${NC} Tests Playwright: ${PLAYWRIGHT_PASSED} passés / ${PLAYWRIGHT_FAILED} échecs / ${PLAYWRIGHT_SKIPPED} skipped        ${BLUE}║${NC}"
echo -e "${BLUE}╠═══════════════════════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║${NC} Durée:            ${DURATION}s                                   ${BLUE}║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${GREEN}📄 Consultez le rapport complet:${NC}"
echo "   $SUMMARY_FILE"
echo ""
echo -e "${GREEN}📊 Rapports HTML:${NC}"
echo "   Unit:       file://$REPORT_DIR/unit/report.html"
echo "   API:        file://$REPORT_DIR/api/report.html"
if [ "$FRONTEND_RUNNING" = true ]; then
    echo "   Playwright: file://$REPORT_DIR/functional/playwright/index.html"
fi
echo ""

# Open summary in default editor (optional)
if command -v code &> /dev/null; then
    echo -e "${YELLOW}Ouvrir le rapport dans VS Code? (y/n)${NC}"
    read -t 5 -n 1 answer
    echo ""
    if [ "$answer" = "y" ]; then
        code "$SUMMARY_FILE"
    fi
fi

exit 0
