# backend/Dawini2025/apps.py   (ou backend/backend/apps.py selon ton nom de projet)
from django.apps import AppConfig
from django.apps import AppConfig
from .mongo_models import ensure_mongo_setup  # Import from mongo_models


class DawiniConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'api'  # ou 'backend' selon ton projet

    def ready(self):
        """
        Cette fonction est exécutée AU DÉMARRAGE du serveur Django
        → On initialise MongoDB automatiquement
        """
        import api.mongo  # ← importe juste pour déclencher la création
     
        
        ensure_mongo_setup()  # Creates collections and indexes if needed
        print("MongoDB initialized with collections and indexes.")
      
