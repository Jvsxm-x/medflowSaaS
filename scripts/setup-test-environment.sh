#!/bin/bash

# Script pour configurer l'environnement de test
# Usage: ./setup-test-environment.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$TESTS_DIR" || exit 1

echo "🔧 Configuration de l'environnement de test..."
echo ""

# Vérifier Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 n'est pas installé"
    exit 1
fi

echo "✅ Python 3 trouvé: $(python3 --version)"

# Vérifier pip
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 n'est pas installé"
    exit 1
fi

# Installer les dépendances Python
echo ""
echo "📦 Installation des dépendances Python..."
pip3 install -r requirements-test.txt

# Vérifier Node.js pour Playwright
if command -v node &> /dev/null; then
    echo ""
    echo "📦 Installation des dépendances Playwright..."
    cd functional/playwright
    if [ -f "package.json" ]; then
        npm install
        npx playwright install --with-deps
    fi
    cd "$TESTS_DIR"
fi

# Créer les utilisateurs de test
echo ""
echo "👤 Création des utilisateurs de test..."
python3 scripts/create-test-users.py

echo ""
echo "✅ Configuration terminée!"

