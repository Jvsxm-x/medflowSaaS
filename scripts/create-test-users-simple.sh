#!/bin/bash

# Script simplifié qui utilise directement le chemin Python Windows
# Usage: ./create-test-users-simple.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$TESTS_DIR"

echo "============================================================"
echo "🔧 Création des utilisateurs de test"
echo "============================================================"
echo ""

# Chemins Python courants sur Windows
PYTHON_PATHS=(
    "/c/Users/$USER/AppData/Local/Programs/Python/Python311/python.exe"
    "/c/Users/$USER/AppData/Local/Programs/Python/Python310/python.exe"
    "/c/Users/$USER/AppData/Local/Programs/Python/Python39/python.exe"
    "/c/Python311/python.exe"
    "/c/Python310/python.exe"
    "/usr/bin/python3"
    "/usr/bin/python"
)

PYTHON_CMD=""

# Chercher Python dans les chemins courants
for path in "${PYTHON_PATHS[@]}"; do
    if [ -f "$path" ] && "$path" --version &>/dev/null; then
        PYTHON_CMD="$path"
        echo "✅ Python trouvé : $PYTHON_CMD"
        break
    fi
done

# Si pas trouvé, essayer les commandes standard
if [ -z "$PYTHON_CMD" ]; then
    if command -v py.exe &>/dev/null && py.exe --version &>/dev/null 2>&1; then
        PYTHON_CMD="py.exe"
        echo "✅ Python trouvé : $PYTHON_CMD"
    elif command -v python.exe &>/dev/null && python.exe --version &>/dev/null 2>&1; then
        PYTHON_CMD="python.exe"
        echo "✅ Python trouvé : $PYTHON_CMD"
    fi
fi

# Si toujours pas trouvé
if [ -z "$PYTHON_CMD" ]; then
    echo "❌ Python non trouvé"
    echo ""
    echo "Solutions :"
    echo "1. Utilisez PowerShell : powershell.exe -File scripts/create-test-users.ps1"
    echo "2. Trouvez Python et utilisez le chemin complet"
    echo ""
    echo "Python est généralement installé dans :"
    echo "  C:\\Users\\$USER\\AppData\\Local\\Programs\\Python\\Python3XX\\python.exe"
    exit 1
fi

echo ""

# Vérifier/installer requests
if ! "$PYTHON_CMD" -c "import requests" 2>/dev/null; then
    echo "⚠️  Installation de 'requests'..."
    "$PYTHON_CMD" -m pip install requests --quiet
fi

# Exécuter le script
echo "Exécution du script..."
echo ""
"$PYTHON_CMD" "$TESTS_DIR/scripts/create-test-users.py"

