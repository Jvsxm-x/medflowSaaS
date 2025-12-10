#!/bin/bash
# Script pour détecter automatiquement l'URL du frontend
# Essaie plusieurs ports courants

# Ports courants à tester
PORTS=(3000 5173 3001 8080 4200)

# Fonction pour vérifier si une URL est accessible
check_url() {
    local url=$1
    if curl -s -o /dev/null -w "%{http_code}" "$url" --max-time 3 2>/dev/null | grep -q "200\|404\|301\|302"; then
        return 0
    fi
    return 1
}

# Vérifier la variable d'environnement d'abord
if [ -n "$FRONTEND_URL" ]; then
    if check_url "$FRONTEND_URL"; then
        echo "$FRONTEND_URL"
        exit 0
    fi
fi

# Vérifier dans le fichier de configuration
if [ -f "config/test-config.json" ]; then
    CONFIG_URL=$(cat config/test-config.json | grep -o '"frontend_url": "[^"]*"' | head -1 | cut -d'"' -f4 2>/dev/null)
    if [ -n "$CONFIG_URL" ] && check_url "$CONFIG_URL"; then
        echo "$CONFIG_URL"
        exit 0
    fi
fi

# Essayer les ports courants
for port in "${PORTS[@]}"; do
    url="http://localhost:$port"
    if check_url "$url"; then
        echo "$url"
        exit 0
    fi
done

# Si rien n'est trouvé, retourner le port par défaut depuis la config ou 3000
if [ -f "config/test-config.json" ]; then
    DEFAULT_URL=$(cat config/test-config.json | grep -o '"frontend_url": "[^"]*"' | head -1 | cut -d'"' -f4 2>/dev/null || echo "http://localhost:3000")
    echo "$DEFAULT_URL"
else
    echo "http://localhost:3000"
fi

exit 1

