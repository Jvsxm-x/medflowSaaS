"""
Tests de performance avec Locust (alternative à JMeter)
Plus facile à installer et utiliser que JMeter
"""
from locust import HttpUser, task, between
import json

class MedflowSaaSUser(HttpUser):
    """Simulation d'utilisateur pour tests de performance"""
    wait_time = between(1, 3)  # Attente entre 1 et 3 secondes
    
    def on_start(self):
        """Se connecter au démarrage"""
        # Se connecter
        login_data = {
            "username": "test_patient",
            "password": "Test123!@#"
        }
        response = self.client.post("/api/auth/login/", json=login_data)
        if response.status_code == 200:
            data = response.json()
            self.token = data.get('token') or data.get('access') or ''
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}
    
    @task(3)
    def view_appointments(self):
        """Consulter les rendez-vous (tâche fréquente)"""
        if self.token:
            self.client.get("/api/medical/appointments/", headers=self.headers)
    
    @task(2)
    def view_clinics(self):
        """Consulter les cliniques"""
        self.client.get("/api/clinics/")
    
    @task(1)
    def view_profile(self):
        """Consulter le profil"""
        if self.token:
            self.client.get("/api/auth/profile/", headers=self.headers)
    
    @task(1)
    def view_documents(self):
        """Consulter les documents"""
        if self.token:
            self.client.get("/api/patient/documents/", headers=self.headers)

