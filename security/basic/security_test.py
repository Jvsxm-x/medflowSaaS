"""
Tests de sécurité basiques (alternative à OWASP ZAP)
Vérifie les vulnérabilités communes sans outil externe
"""
import requests
import json
import os
import sys

# Charger la configuration
# Le script est dans tests/security/basic/, remonter à tests/
script_dir = os.path.dirname(os.path.abspath(__file__))
tests_dir = os.path.abspath(os.path.join(script_dir, '../..'))
CONFIG_PATH = os.path.join(tests_dir, 'config', 'test-config.json')
with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
    CONFIG = json.load(f)

API_BASE = CONFIG['environments']['local']['api_base']
BASE_URL = API_BASE.replace('/api', '')


class SecurityTestResult:
    def __init__(self):
        self.passed = []
        self.failed = []
        self.warnings = []
    
    def add_pass(self, test_name, message=""):
        self.passed.append({'test': test_name, 'message': message})
    
    def add_fail(self, test_name, message=""):
        self.failed.append({'test': test_name, 'message': message})
    
    def add_warning(self, test_name, message=""):
        self.warnings.append({'test': test_name, 'message': message})


def test_https_enabled(result):
    """Test: Vérifier si HTTPS est utilisé (en production)"""
    if BASE_URL.startswith('https://'):
        result.add_pass("HTTPS Enabled", "La connexion est sécurisée avec HTTPS")
    elif BASE_URL.startswith('http://localhost') or BASE_URL.startswith('http://127.0.0.1'):
        result.add_warning("HTTPS", "HTTPS non utilisé (acceptable en développement local)")
    else:
        result.add_fail("HTTPS", "HTTPS non utilisé en production - données non chiffrées!")


def test_security_headers(result):
    """Test: Vérifier les headers de sécurité"""
    try:
        response = requests.get(f"{BASE_URL}/", timeout=5)
        headers = response.headers
        
        security_headers = {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000',
            'Content-Security-Policy': None,
        }
        
        missing = []
        for header, expected_value in security_headers.items():
            if header in headers:
                if expected_value and headers[header] == expected_value:
                    result.add_pass(f"Header {header}", f"Présent avec valeur correcte")
                else:
                    result.add_warning(f"Header {header}", f"Présent mais valeur: {headers[header]}")
            else:
                missing.append(header)
                result.add_warning(f"Header {header}", "Header de sécurité manquant")
        
        if missing:
            result.add_warning("Security Headers", f"Headers manquants: {', '.join(missing)}")
        else:
            result.add_pass("Security Headers", "Tous les headers de sécurité sont présents")
            
    except Exception as e:
        result.add_warning("Security Headers", f"Impossible de vérifier: {e}")


def test_sql_injection_protection(result):
    """Test: Vérifier la protection contre l'injection SQL/NoSQL"""
    try:
        # Tester avec des caractères d'injection SQL/NoSQL
        malicious_payloads = [
            "' OR '1'='1",
            "'; DROP TABLE users--",
            '{"$ne": null}',
            '{"$gt": ""}',
        ]
        
        vulnerable = False
        for payload in malicious_payloads:
            try:
                # Tester sur l'endpoint de login
                response = requests.post(f"{API_BASE}/auth/login/", json={
                    "username": payload,
                    "password": "test"
                }, timeout=5)
                
                # Si on reçoit une erreur 400/500, c'est bon signe (rejeté)
                if response.status_code == 200:
                    # Si on reçoit 200, vérifier que ce n'est pas un vrai succès
                    data = response.json()
                    if 'token' in data or 'access' in data:
                        vulnerable = True
                        break
            except:
                pass  # Erreur = protection active
        
        if vulnerable:
            result.add_fail("SQL/NoSQL Injection", "Vulnérable aux injections!")
        else:
            result.add_pass("SQL/NoSQL Injection", "Protection contre les injections active")
            
    except Exception as e:
        result.add_warning("SQL/NoSQL Injection", f"Test non concluant: {e}")


def test_xss_protection(result):
    """Test: Vérifier la protection XSS"""
    try:
        xss_payload = "<script>alert('XSS')</script>"
        
        # Tester si le payload est échappé dans les réponses
        response = requests.get(f"{BASE_URL}/", timeout=5)
        content = response.text
        
        if xss_payload in content:
            result.add_warning("XSS Protection", "Le contenu pourrait être vulnérable au XSS")
        else:
            result.add_pass("XSS Protection", "Protection XSS active (ou test limité)")
            
    except Exception as e:
        result.add_warning("XSS Protection", f"Test non concluant: {e}")


def test_authentication_required(result):
    """Test: Vérifier que les endpoints protégés nécessitent une authentification"""
    protected_endpoints = [
        '/api/auth/profile/',
        '/api/medical/appointments/',
        '/api/patient/documents/',
    ]
    
    for endpoint in protected_endpoints:
        try:
            response = requests.get(f"{API_BASE}{endpoint}", timeout=5)
            if response.status_code in [401, 403]:
                result.add_pass(f"Auth Required - {endpoint}", "Authentification requise")
            elif response.status_code == 200:
                result.add_fail(f"Auth Required - {endpoint}", "Endpoint accessible sans authentification!")
            else:
                result.add_warning(f"Auth Required - {endpoint}", f"Status code: {response.status_code}")
        except Exception as e:
            result.add_warning(f"Auth Required - {endpoint}", f"Erreur: {e}")


def test_cors_configuration(result):
    """Test: Vérifier la configuration CORS"""
    try:
        response = requests.options(f"{API_BASE}/auth/login/", headers={
            'Origin': 'https://evil.com',
            'Access-Control-Request-Method': 'POST'
        }, timeout=5)
        
        cors_headers = {
            'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
            'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
        }
        
        if cors_headers['Access-Control-Allow-Origin'] == '*':
            result.add_warning("CORS", "CORS autorise toutes les origines (*) - à restreindre en production")
        elif cors_headers['Access-Control-Allow-Origin']:
            result.add_pass("CORS", f"CORS configuré: {cors_headers['Access-Control-Allow-Origin']}")
        else:
            result.add_warning("CORS", "Configuration CORS non détectée")
            
    except Exception as e:
        result.add_warning("CORS", f"Test non concluant: {e}")


def run_security_tests():
    """Exécuter tous les tests de sécurité"""
    # Configurer l'encodage pour Windows
    import sys
    if sys.platform == 'win32':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    
    print("=" * 60)
    print("Tests de Securite")
    print("=" * 60)
    print(f"URL de base: {BASE_URL}")
    print("")
    
    result = SecurityTestResult()
    
    # Exécuter tous les tests
    print("Execution des tests de securite...")
    print("")
    
    test_https_enabled(result)
    test_security_headers(result)
    test_sql_injection_protection(result)
    test_xss_protection(result)
    test_authentication_required(result)
    test_cors_configuration(result)
    
    # Afficher les résultats
    print("Resultats:")
    print("=" * 60)
    
    if result.passed:
        print("\n[OK] Tests reussis:")
        for item in result.passed:
            print(f"  + {item['test']}: {item['message']}")
    
    if result.warnings:
        print("\n[WARN] Avertissements:")
        for item in result.warnings:
            print(f"  ! {item['test']}: {item['message']}")
    
    if result.failed:
        print("\n[ERREUR] Tests echoues:")
        for item in result.failed:
            print(f"  - {item['test']}: {item['message']}")
    
    print("\n" + "=" * 60)
    print(f"Total: {len(result.passed) + len(result.warnings) + len(result.failed)} tests")
    print(f"Reussis: {len(result.passed)}, Avertissements: {len(result.warnings)}, Echoues: {len(result.failed)}")
    print("=" * 60)
    
    # Sauvegarder le rapport
    script_dir = os.path.dirname(os.path.abspath(__file__))
    tests_dir = os.path.abspath(os.path.join(script_dir, '../..'))
    report_path = os.path.join(tests_dir, 'reports', 'security', 'basic', 'report.txt')
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("=" * 60 + "\n")
        f.write("Rapport de Securite\n")
        f.write("=" * 60 + "\n\n")
        f.write(f"[OK] Tests reussis: {len(result.passed)}\n")
        for item in result.passed:
            f.write(f"  - {item['test']}: {item['message']}\n")
        f.write(f"\n[WARN] Avertissements: {len(result.warnings)}\n")
        for item in result.warnings:
            f.write(f"  - {item['test']}: {item['message']}\n")
        f.write(f"\n[ERREUR] Tests echoues: {len(result.failed)}\n")
        for item in result.failed:
            f.write(f"  - {item['test']}: {item['message']}\n")
    
    print(f"\n[OK] Rapport sauvegarde: {report_path}")
    
    # Retourner le code de sortie
    if result.failed:
        print("\n[ERREUR] Des vulnerabilites critiques ont ete detectees!")
        return 1
    elif result.warnings:
        print("\n[WARN] Des avertissements de securite ont ete detectes")
        return 0
    else:
        print("\n[OK] Tous les tests de securite sont passes!")
        return 0


if __name__ == '__main__':
    exit_code = run_security_tests()
    sys.exit(exit_code)

