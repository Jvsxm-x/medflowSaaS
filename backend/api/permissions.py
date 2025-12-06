# api/permissions.py
import jwt
from rest_framework.permissions import BasePermission
from django.conf import settings
from .mongo_models import collections

class IsAuthenticatedMongo(BasePermission):
    def has_permission(self, request, view):
        auth = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth.startswith('Bearer '):
            return False

        token = auth.split(' ')[1]

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            username = payload.get('username')
            if not username:
                return False

            user = collections['users'].find_one({"username": username})
            if not user:
                return False

            # On attache un faux user pour compatibilité
            request.user = type('User', (), {
                'is_authenticated': True,
                'username': username,
                'role': user.get('role', 'patient'),
                'is_staff': user.get('role') in ['doctor', 'admin'],
                'is_superuser': user.get('role') == 'admin',
                
            })()

            return True
        except:
            return False
class IsAdminUser(BasePermission):
    def has_permission(self, request, view):
        auth = request.META.get('HTTP_AUTHORIZATION', '')
        if not auth.startswith('Bearer '):
            return False

        token = auth.split(' ')[1]

        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
            username = payload.get('username')
            if not username:
                return False

            user = collections['users'].find_one({"username": username})
            if not user or user.get('role') != 'admin':
                return False

            # On attache un faux user pour compatibilité
            request.user = type('User', (), {
                'is_authenticated': True,
                'username': username,
                'role': user.get('role', 'patient'),
                'is_staff': user.get('role') in ['doctor', 'admin'],
                'is_superuser': user.get('role') == 'admin',
            })()

            return True
        except:
            return False