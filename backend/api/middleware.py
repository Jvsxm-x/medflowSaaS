
# api/middleware.py
import jwt
from django.conf import settings
from django.contrib.auth.models import AnonymousUser
from django.http import JsonResponse
from .mongo_models import collections

class JWTAuthenticationMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/') and 'HTTP_AUTHORIZATION' in request.META:
            auth = request.META['HTTP_AUTHORIZATION'].split()
            if len(auth) == 2 and auth[0].lower() == 'bearer':
                token = auth[1]
                try:
                    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                    username = payload['username']
                    user_doc = collections['users'].find_one({"username": username})
                    if user_doc:
                        # On simule un user Django pour DRF
                        request.user = type('User', (), {
                            'is_authenticated': True,
                            'is_staff': user_doc.get('role') in ['doctor', 'admin'],
                            'is_superuser': user_doc.get('role') == 'admin',
                            'username': username,
                            'role': user_doc.get('role')
                        })()
                    else:
                        request.user = AnonymousUser()
                except jwt.ExpiredSignatureError:
                    return JsonResponse({"error": "Token expiré"}, status=401)
                except jwt.InvalidTokenError:
                    request.user = AnonymousUser()
        else:
            request.user = AnonymousUser()

        return self.get_response(request)
# api/middleware.py
from rest_framework.response import Response
from rest_framework import status
from .mongo_models import collections
users = collections['users']
LIMITS = {
    "free": {
        "storage_bytes": 500 * 1024 * 1024,    # 500 Mo
        "records_count": 200,
        "lab_orders_count": 10,
        "documents_count": 20
    },
    "premium": {
        "storage_bytes": 5 * 1024 * 1024 * 1024,   # 5 Go
        "records_count": 5000,
        "lab_orders_count": 100,
        "documents_count": 200
    }
}

class UsageLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if not request.user.is_authenticated:
            return self.get_response(request)

        user_doc = users.find_one({"username": request.user.username})
        if not user_doc:
            return self.get_response(request)

        plan = user_doc.get("plan", "free")
        limits = LIMITS.get(plan, LIMITS["free"])

        exceeded = []

        # Vérification stockage
        if user_doc.get("storage_used", 0) > limits["storage_bytes"]:
            exceeded.append("stockage")

        # Vérification nombre de mesures
        if user_doc.get("records_count", 0) > limits["records_count"]:
            exceeded.append("mesures")

        # Vérification demandes d'analyses
        if user_doc.get("lab_orders_count", 0) > limits["lab_orders_count"]:
            exceeded.append("analyses")

        # Routes à bloquer si dépassement
        blocked_paths = [
            '/api/records/',           # POST nouvelles mesures
            '/api/lab-orders/create/', # Créer une demande d'analyse (docteur)
            '/api/documents/upload/',  # Upload PDF
        ]

        if any(request.path.startswith(p) for p in blocked_paths) and request.method == "POST":
            if exceeded:
                return Response({
                    "error": "Limite dépassée",
                    "message": f"Vous avez dépassé la limite {', '.join(exceeded)} de votre forfait {plan.upper()}.",
                    "action_required": "upgrade_plan",
                    "upgrade_url": "https://dawini.tn/pricing"
                }, status=status.HTTP_403_FORBIDDEN)

        return self.get_response(request)