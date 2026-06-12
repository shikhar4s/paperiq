from django.contrib.auth.hashers import check_password
from paperiq_ai.models import User  # your MongoEngine User model

class MongoBackend:
    """
    Custom authentication backend for MongoEngine-based User model.
    """
    def authenticate(self, request, email=None, password=None, **kwargs):
        try:
            user = User.objects.get(email=email)
            if check_password(password, user.password_hash):
                return user
        except User.DoesNotExist:
            return None
        return None

    def get_user(self, user_id):
        try:
            return User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            return None
