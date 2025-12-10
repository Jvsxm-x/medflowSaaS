#!/bin/bash

# Script wrapper pour créer les utilisateurs de test
# Fonctionne sur Windows (Git Bash) et Linux/macOS

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TESTS_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$TESTS_DIR"

# Détecter l'OS
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" || "$OSTYPE" == "cygwin" ]]; then
    # Windows - Git Bash
    echo "🪟 Détecté: Windows (Git Bash)"
    echo ""
    
    # Essayer PowerShell si disponible
    if command -v powershell.exe &> /dev/null; then
        echo "📝 Utilisation de PowerShell..."
        echo ""
        powershell.exe -ExecutionPolicy Bypass -File "$TESTS_DIR/scripts/create-test-users.ps1"
    else
        # Sinon utiliser le script bash
        echo "📝 Utilisation du script bash..."
        echo ""
        bash "$TESTS_DIR/scripts/create-test-users.sh"
    fi
else
    # Linux/macOS
    echo "🐧 Détecté: Linux/macOS"
    echo ""
    bash "$TESTS_DIR/scripts/create-test-users.sh"
fi

