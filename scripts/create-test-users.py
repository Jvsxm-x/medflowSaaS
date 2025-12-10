#!/usr/bin/env python3
"""
Script pour créer les utilisateurs de test nécessaires pour les tests
Compatible Windows/Linux/macOS
"""
import os
import sys
import json

# Essayer d'importer requests, afficher un message utile si absent
try:
    import requests
except ImportError:
    print("❌ Le module 'requests' n'est pas installé")
    print("   Installez-le avec: pip install requests")
    print("   Ou: python -m pip install requests")
    sys.exit(1)

# Ajouter le chemin du backend au PYTHONPATH
backend_path = os.path.join(os.path.dirname(__file__), '../../medflowSaaS-front/medflowSaaS-main/backend')
if os.path.exists(backend_path):
    sys.path.insert(0, backend_path)

# Charger la configuration
CONFIG_PATH = os.path.join(os.path.dirname(__file__), '../config/test-config.json')
with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
    CONFIG = json.load(f)

API_BASE = os.getenv('API_BASE_URL', CONFIG['environments']['local']['api_base'])


def create_test_user(username, email, password, first_name, last_name, role):
    """Créer un utilisateur de test via l'API"""
    print(f"🔧 Création de l'utilisateur: {username} ({role})...")
    
    # Essayer les deux formats
    payloads = [
        {
            "username": username,
            "email": email,
            "password": password,
            "firstName": first_name,
            "lastName": last_name,
            "role": role
        },
        {
            "username": username,
            "email": email,
            "password": password,
            "first_name": first_name,
            "last_name": last_name,
            "role": role
        }
    ]
    
    for payload in payloads:
        try:
            response = requests.post(
                f"{API_BASE}/auth/register/",
                json=payload,
                timeout=10
            )
            
            if response.status_code in [200, 201]:
                print(f"  ✅ Utilisateur {username} créé avec succès")
                return True
            elif response.status_code == 400:
                data = response.json()
                if "déjà" in str(data).lower() or "already" in str(data).lower() or "exists" in str(data).lower():
                    print(f"  ⚠️  Utilisateur {username} existe déjà")
                    return True  # Considéré comme succès
                else:
                    print(f"  ❌ Erreur: {data}")
            else:
                print(f"  ❌ Erreur HTTP {response.status_code}: {response.text}")
        except requests.exceptions.ConnectionError:
            print(f"  ❌ Impossible de se connecter à l'API ({API_BASE})")
            print(f"     Assurez-vous que le backend est démarré")
            return False
        except Exception as e:
            print(f"  ❌ Erreur: {e}")
            continue
    
    return False


def test_login(username, password):
    """Tester la connexion d'un utilisateur"""
    try:
        response = requests.post(
            f"{API_BASE}/auth/login/",
            json={"username": username, "password": password},
            timeout=10
        )
        return response.status_code == 200
    except:
        return False


def main():
    print("=" * 60)
    print("🔧 Création des utilisateurs de test")
    print("=" * 60)
    print(f"API Base URL: {API_BASE}")
    print("")
    
    # Vérifier que l'API est accessible
    try:
        response = requests.get(f"{API_BASE}/clinics/", timeout=5)
        print("✅ Connexion à l'API réussie")
    except requests.exceptions.ConnectionError:
        print("❌ Impossible de se connecter à l'API")
        print(f"   URL: {API_BASE}")
        print("   Assurez-vous que le backend est démarré")
        print("   Commande: python manage.py runserver")
        sys.exit(1)
    except Exception as e:
        print(f"⚠️  Vérification de connexion échouée: {e}")
        print("   Continuons quand même...")
    
    print("")
    
    test_users = CONFIG['test_data']['test_users']
    
    # Créer les utilisateurs de test
    users_created = 0
    users_failed = 0
    
    for role, user_data in test_users.items():
        success = create_test_user(
            username=user_data['username'],
            email=user_data['email'],
            password=user_data['password'],
            first_name=user_data.get('firstName', user_data.get('first_name', 'Test')),
            last_name=user_data.get('lastName', user_data.get('last_name', 'User')),
            role=user_data['role']
        )
        
        if success:
            users_created += 1
            # Tester la connexion
            if test_login(user_data['username'], user_data['password']):
                print(f"  ✅ Login test réussi pour {user_data['username']}")
            else:
                print(f"  ⚠️  Login test échoué pour {user_data['username']}")
        else:
            users_failed += 1
        
        print("")
    
    print("=" * 60)
    print(f"📊 Résumé: {users_created} créés/vérifiés, {users_failed} échecs")
    print("=" * 60)
    
    if users_failed > 0:
        print("\n⚠️  Certains utilisateurs n'ont pas pu être créés.")
        print("   Vérifiez que:")
        print("   1. Le backend est démarré")
        print("   2. L'API est accessible")
        print("   3. La base de données est configurée")
        sys.exit(1)
    else:
        print("\n✅ Tous les utilisateurs de test sont prêts!")
        sys.exit(0)


if __name__ == '__main__':
    main()

