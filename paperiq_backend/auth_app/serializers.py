from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .authentication import MongoJWTAuthentication


class MongoTokenRefreshSerializer(serializers.Serializer):
    refresh = serializers.CharField()
    access = serializers.CharField(read_only=True)

    def validate(self, attrs):
        # SimpleJWT's default refresh serializer looks up Django's SQL User.
        # PaperIQ accounts live in MongoDB; validate the same user as API auth.
        refresh = RefreshToken(attrs['refresh'])
        MongoJWTAuthentication().get_user(refresh)
        return {'access': str(refresh.access_token)}
