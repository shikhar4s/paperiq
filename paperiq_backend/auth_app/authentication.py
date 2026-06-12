from rest_framework_simplejwt.authentication import JWTAuthentication
from paperiq_ai.models import User

class MongoJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user_id = validated_token.get("user_id")
        try:
            return User.objects.get(user_id=user_id)
        except User.DoesNotExist:
            return None
