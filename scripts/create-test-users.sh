#!/bin/bash

# Script bash pour créer les utilisateurs de test
# Usage: ./create-test-users.sh

set -e

# Obtenir le répertoire du script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$TESTS_DIR"

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "============================================================"
echo -e "${CYAN}🔧 Création des utilisateurs de test${NC}"
echo "============================================================"

# Fonction pour vérifier si Python fonctionne vraiment
check_python() {
    local cmd=$1
    # Vérifier que ce n'est pas l'alias Windows Store
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
        # Sur Windows, vérifier que ce n'est pas un alias vers le Microsoft Store
        local output=$(command -v "$cmd" 2>&1)
        if [[ "$output" == *"Microsoft Store"* ]] || [[ "$output" == *"WindowsApps"* ]]; then
            return 1
        fi
        # Tester si python fonctionne vraiment
        if "$cmd" --version 2>&1 | grep -q "Python [0-9]"; then
            return 0
        fi
        return 1
    else
        # Sur Linux/macOS, juste vérifier que la commande existe et fonctionne
        if command -v "$cmd" &> /dev/null && "$cmd" --version &> /dev/null; then
            return 0
        fi
        return 1
    fi
}

# Détecter la commande Python qui fonctionne vraiment
PYTHON_CMD=""

# Ordre de priorité : py (Windows), python3, python
if check_python "py"; then
    PYTHON_CMD="py"
elif check_python "python3"; then
    PYTHON_CMD="python3"
elif check_python "python"; then
    PYTHON_CMD="python"
fi

# Si aucune commande Python valide trouvée
if [ -z "$PYTHON_CMD" ]; then
    echo -e "${RED}❌ Python n'est pas trouvé ou ne fonctionne pas correctement${NC}"
    echo ""
    echo "Solutions possibles :"
    echo "1. Installez Python depuis https://www.python.org/downloads/"
    echo "   ⚠️  IMPORTANT : Cochez 'Add Python to PATH' lors de l'installation"
    echo ""
    echo "2. Utilisez PowerShell sur Windows :"
    echo "   powershell.exe -ExecutionPolicy Bypass -File scripts/create-test-users.ps1"
    echo ""
    echo "3. Trouvez Python manuellement et utilisez le chemin complet :"
    echo "   /c/Users/VotreNom/AppData/Local/Programs/Python/Python311/python.exe scripts/create-test-users.py"
    echo ""
    exit 1
fi

echo -e "${CYAN}Utilisation de: $PYTHON_CMD${NC}"
echo ""

# Charger la configuration
CONFIG_PATH="$TESTS_DIR/config/test-config.json"

if [ ! -f "$CONFIG_PATH" ]; then
    echo -e "${RED}❌ Fichier de configuration non trouvé: $CONFIG_PATH${NC}"
    exit 1
fi

# Vérifier si requests est installé
if ! $PYTHON_CMD -c "import requests" 2>/dev/null; then
    echo -e "${YELLOW}⚠️  Le module 'requests' n'est pas installé${NC}"
    echo "   Installation..."
    if $PYTHON_CMD -m pip install requests 2>/dev/null; then
        echo -e "${GREEN}✅ Module 'requests' installé avec succès${NC}"
    else
        echo -e "${RED}❌ Échec de l'installation de 'requests'${NC}"
        echo "   Installez manuellement : $PYTHON_CMD -m pip install requests"
        exit 1
    fi
fi

# Exécuter le script Python
echo -e "${CYAN}Exécution du script Python...${NC}"
echo ""

$PYTHON_CMD "$TESTS_DIR/scripts/create-test-users.py"

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Script exécuté avec succès${NC}"
else
    echo ""
    echo -e "${RED}❌ Erreur lors de l'exécution (code: $EXIT_CODE)${NC}"
    exit $EXIT_CODE
fi

