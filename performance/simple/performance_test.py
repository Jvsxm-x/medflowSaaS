"""
Tests de performance simples avec requests et threading
Alternative si Locust n'est pas disponible
"""
import requests
import json
import time
import threading
from concurrent.futures import ThreadPoolExecutor
import statistics
import os

# Charger la configuration
# Le script est dans tests/performance/simple/, remonter à tests/
script_dir = os.path.dirname(os.path.abspath(__file__))
tests_dir = os.path.abspath(os.path.join(script_dir, '../..'))
CONFIG_PATH = os.path.join(tests_dir, 'config', 'test-config.json')
with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
    CONFIG = json.load(f)

API_BASE = CONFIG['environments']['local']['api_base']
BASE_URL = API_BASE.replace('/api', '')


def login_user():
    """Se connecter et obtenir un token"""
    try:
        response = requests.post(f"{API_BASE}/auth/login/", json={
            "username": "test_patient",
            "password": "Test123!@#"
        }, timeout=5)
        if response.status_code == 200:
            data = response.json()
            return data.get('token') or data.get('access') or ''
    except:
        pass
    return None


def test_endpoint(method, endpoint, headers=None, json_data=None, num_requests=10):
    """Tester un endpoint plusieurs fois et retourner les statistiques"""
    times = []
    success_count = 0
    error_count = 0
    
    for _ in range(num_requests):
        start_time = time.time()
        try:
            if method == 'GET':
                response = requests.get(f"{API_BASE}{endpoint}", headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(f"{API_BASE}{endpoint}", headers=headers, json=json_data, timeout=10)
            else:
                continue
            
            elapsed = time.time() - start_time
            times.append(elapsed * 1000)  # Convertir en ms
            
            if 200 <= response.status_code < 300:
                success_count += 1
            else:
                error_count += 1
        except Exception as e:
            error_count += 1
    
    if times:
        return {
            'endpoint': endpoint,
            'success_count': success_count,
            'error_count': error_count,
            'avg_time_ms': statistics.mean(times),
            'min_time_ms': min(times),
            'max_time_ms': max(times),
            'median_time_ms': statistics.median(times),
            'p95_time_ms': sorted(times)[int(len(times) * 0.95)] if times else 0
        }
    return None


def run_load_test(num_users=10, requests_per_user=5):
    """Exécuter un test de charge avec plusieurs utilisateurs"""
    # Configurer l'encodage pour Windows
    import sys
    if sys.platform == 'win32':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    
    print("=" * 60)
    print("Tests de Performance - Simulation de Charge")
    print("=" * 60)
    print(f"Utilisateurs simultanés: {num_users}")
    print(f"Requêtes par utilisateur: {requests_per_user}")
    print(f"URL de base: {BASE_URL}")
    print("")
    
    # Obtenir un token
    token = login_user()
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    
    # Définir les endpoints à tester
    endpoints = [
        ('GET', '/clinics/', {}),
        ('GET', '/medical/appointments/', headers if token else {}),
        ('GET', '/auth/profile/', headers if token else {}),
        ('GET', '/patient/documents/', headers if token else {}),
    ]
    
    results = []
    
    def run_user_requests():
        """Simuler les requêtes d'un utilisateur"""
        user_results = []
        for method, endpoint, req_headers in endpoints:
            result = test_endpoint(method, endpoint, req_headers, num_requests=requests_per_user)
            if result:
                user_results.append(result)
        return user_results
    
    # Exécuter avec plusieurs threads (simuler plusieurs utilisateurs)
    start_time = time.time()
    with ThreadPoolExecutor(max_workers=num_users) as executor:
        futures = [executor.submit(run_user_requests) for _ in range(num_users)]
        for future in futures:
            results.extend(future.result())
    
    total_time = time.time() - start_time
    
    # Afficher les résultats
    print("\nResultats:")
    print("=" * 60)
    
    # Grouper par endpoint
    endpoint_stats = {}
    for result in results:
        endpoint = result['endpoint']
        if endpoint not in endpoint_stats:
            endpoint_stats[endpoint] = {
                'endpoint': endpoint,
                'total_requests': 0,
                'success': 0,
                'errors': 0,
                'times': []
            }
        endpoint_stats[endpoint]['total_requests'] += result['success_count'] + result['error_count']
        endpoint_stats[endpoint]['success'] += result['success_count']
        endpoint_stats[endpoint]['errors'] += result['error_count']
        endpoint_stats[endpoint]['times'].append(result['avg_time_ms'])
    
    # Afficher les statistiques par endpoint
    for endpoint, stats in endpoint_stats.items():
        avg_time = statistics.mean(stats['times']) if stats['times'] else 0
        min_time = min(stats['times']) if stats['times'] else 0
        max_time = max(stats['times']) if stats['times'] else 0
        
        print(f"\n{endpoint}:")
        print(f"  Requêtes totales: {stats['total_requests']}")
        print(f"  Succès: {stats['success']}")
        print(f"  Erreurs: {stats['errors']}")
        print(f"  Temps moyen: {avg_time:.2f} ms")
        print(f"  Temps min: {min_time:.2f} ms")
        print(f"  Temps max: {max_time:.2f} ms")
    
    print("\n" + "=" * 60)
    print(f"Temps total d'exécution: {total_time:.2f} secondes")
    print(f"Throughput: {sum(s['total_requests'] for s in endpoint_stats.values()) / total_time:.2f} req/s")
    print("=" * 60)
    
    # Sauvegarder dans un fichier
    script_dir = os.path.dirname(os.path.abspath(__file__))
    tests_dir = os.path.abspath(os.path.join(script_dir, '../..'))
    report_path = os.path.join(tests_dir, 'reports', 'performance', 'simple', 'report.txt')
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("=" * 60 + "\n")
        f.write("Rapport de Performance\n")
        f.write("=" * 60 + "\n\n")
        for endpoint, stats in endpoint_stats.items():
            f.write(f"{endpoint}:\n")
            f.write(f"  Requêtes: {stats['total_requests']}, Succès: {stats['success']}, Erreurs: {stats['errors']}\n")
            f.write(f"  Temps moyen: {statistics.mean(stats['times']):.2f} ms\n")
        f.write(f"\nThroughput: {sum(s['total_requests'] for s in endpoint_stats.values()) / total_time:.2f} req/s\n")
    
    print(f"\n[OK] Rapport sauvegarde: {report_path}")
    
    # Vérifier les critères de performance
    all_avg_times = [statistics.mean(stats['times']) for stats in endpoint_stats.values() if stats['times']]
    if all_avg_times:
        overall_avg = statistics.mean(all_avg_times)
        print(f"\nTemps de reponse moyen global: {overall_avg:.2f} ms")
        
        if overall_avg < 2000:  # < 2 secondes
            print("[OK] Performance excellente (< 2s)")
            return 0
        elif overall_avg < 3000:  # < 3 secondes
            print("[WARN] Performance acceptable (< 3s)")
            return 0
        else:
            print("[ERREUR] Performance a ameliorer (> 3s)")
            return 1
    
    return 0


if __name__ == '__main__':
    import sys
    num_users = int(sys.argv[1]) if len(sys.argv) > 1 else 10
    requests_per_user = int(sys.argv[2]) if len(sys.argv) > 2 else 5
    
    exit_code = run_load_test(num_users, requests_per_user)
    sys.exit(exit_code)

