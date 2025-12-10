"""
Tests de performance avec Locust (alternative à JMeter)
Plus simple à installer et utiliser que JMeter
"""
from locust import HttpUser, task, between
import json
import os

# Charger la configuration
CONFIG_PATH = os.path.join(os.path.dirname(__file__), '../../config/test-config.json')
with open(CONFIG_PATH, 'r', encoding='utf-8') as f:
    CONFIG = json.load(f)

API_BASE = CONFIG['environments']['local']['api_base']


class MedflowUser(HttpUser):
    """Simule un utilisateur de MedflowSaaS"""
    wait_time = between(1, 3)  # Attente entre 1 et 3 secondes
    
    def on_start(self):
        """Exécuté au démarrage de chaque utilisateur"""
        # Se connecter pour obtenir un token
        response = self.client.post(f"{API_BASE}/auth/login/", json={
            "username": "test_patient",
            "password": "Test123!@#"
        })
        
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('token') or data.get('access') or ''
            self.headers = {'Authorization': f'Bearer {self.token}'}
        else:
            self.token = None
            self.headers = {}
    
    @task(3)
    def get_appointments(self):
        """Récupérer la liste des rendez-vous (poids 3 - plus fréquent)"""
        if self.token:
            self.client.get(f"{API_BASE}/medical/appointments/", headers=self.headers)
    
    @task(2)
    def get_clinics(self):
        """Récupérer la liste des cliniques (poids 2)"""
        self.client.get(f"{API_BASE}/clinics/")
    
    @task(2)
    def get_profile(self):
        """Récupérer le profil utilisateur (poids 2)"""
        if self.token:
            self.client.get(f"{API_BASE}/auth/profile/", headers=self.headers)
    
    @task(1)
    def get_documents(self):
        """Récupérer les documents (poids 1 - moins fréquent)"""
        if self.token:
            self.client.get(f"{API_BASE}/patient/documents/", headers=self.headers)
    
    @task(1)
    def login(self):
        """Tester la connexion (poids 1)"""
        self.client.post(f"{API_BASE}/auth/login/", json={
            "username": "test_patient",
            "password": "Test123!@#"
        })


# Pour exécuter avec Locust:
# locust -f performance_test.py --host=http://localhost:8000

