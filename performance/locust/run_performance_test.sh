#!/bin/bash

# Script pour exécuter des tests de performance avec Locust
# Alternative à JMeter qui ne nécessite pas d'installation complexe

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

cd "$TESTS_DIR"

echo "⚡ Tests de performance avec Locust"
echo "===================================="

# Vérifier si Locust est installé
if ! python -c "import locust" 2>/dev/null && ! python3 -c "import locust" 2>/dev/null; then
    echo "⚠️  Locust n'est pas installé"
    echo "   Installation..."
    pip install locust 2>/dev/null || pip3 install locust 2>/dev/null
fi

# Charger la config pour obtenir l'URL
API_BASE=$(python3 -c "import json; print(json.load(open('tests/config/test-config.json'))['environments']['local']['api_base'])" 2>/dev/null || echo "http://localhost:8000/api")
BASE_URL=$(echo $API_BASE | sed 's|/api||')

echo "URL de base: $BASE_URL"
echo ""
echo "Démarrage du test de performance..."
echo "Ouvrez http://localhost:8089 dans votre navigateur pour voir les résultats"
echo ""

cd tests/performance/locust
locust -f locust_test.py --host="$BASE_URL" --users 10 --spawn-rate 2 --run-time 30s --headless --html ../../reports/performance/locust/report.html

