"""
Tests unitaires pour les utilitaires
"""
import pytest
from datetime import datetime
from bson import ObjectId


class TestMongoUtils:
    """Tests pour les utilitaires MongoDB"""

    def test_objectid_conversion(self):
        """Test la conversion d'ObjectId en string"""
        obj_id = ObjectId()
        obj_id_str = str(obj_id)
        
        assert isinstance(obj_id_str, str)
        assert len(obj_id_str) == 24

    def test_objectid_from_string(self):
        """Test la création d'ObjectId depuis une string"""
        obj_id = ObjectId()
        obj_id_str = str(obj_id)
        
        new_obj_id = ObjectId(obj_id_str)
        assert new_obj_id == obj_id

    def test_datetime_normalization(self):
        """Test la normalisation des dates"""
        now = datetime.utcnow()
        iso_str = now.isoformat()
        
        # Vérifier que la conversion fonctionne
        assert isinstance(iso_str, str)
        assert 'T' in iso_str or ' ' in iso_str


class TestValidationUtils:
    """Tests pour les utilitaires de validation"""

    def test_email_validation(self):
        """Test la validation d'email"""
        def is_valid_email(email):
            return "@" in email and "." in email.split("@")[1] if "@" in email else False
        
        assert is_valid_email("test@example.com") == True
        assert is_valid_email("invalid") == False
        assert is_valid_email("test@") == False

    def test_password_strength(self):
        """Test la validation de la force du mot de passe"""
        def is_strong_password(password):
            if len(password) < 8:
                return False
            has_upper = any(c.isupper() for c in password)
            has_lower = any(c.islower() for c in password)
            has_digit = any(c.isdigit() for c in password)
            has_special = any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password)
            return has_upper and has_lower and has_digit and has_special
        
        assert is_strong_password("Test123!@#") == True
        assert is_strong_password("weak") == False
        assert is_strong_password("NoSpecial123") == False


class TestJWTUtils:
    """Tests pour les utilitaires JWT"""

    def test_jwt_token_generation(self):
        """Test la génération de token JWT"""
        import jwt
        from datetime import datetime, timedelta
        
        secret = "test-secret-key"
        payload = {
            'username': 'test_user',
            'exp': datetime.utcnow() + timedelta(hours=1)
        }
        
        token = jwt.encode(payload, secret, algorithm='HS256')
        
        assert isinstance(token, str)
        assert len(token) > 0

    def test_jwt_token_verification(self):
        """Test la vérification de token JWT"""
        import jwt
        from datetime import datetime, timedelta
        
        secret = "test-secret-key"
        payload = {
            'username': 'test_user',
            'exp': datetime.utcnow() + timedelta(hours=1)
        }
        
        token = jwt.encode(payload, secret, algorithm='HS256')
        decoded = jwt.decode(token, secret, algorithms=['HS256'])
        
        assert decoded['username'] == 'test_user'

