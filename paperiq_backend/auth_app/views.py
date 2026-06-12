from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.contrib.auth.hashers import check_password, make_password
from paperiq_ai.models import User  # ✅ MongoEngine User model
from mongoengine.errors import DoesNotExist

# ---------------- LOGIN ----------------
@api_view(['POST'])
def login_view(request):
    email = request.data.get("email")
    password = request.data.get("password")

    if not email or not password:
        return Response({"error": "Email and password are required."}, status=400)

    try:
        user = User.objects.get(email=email)
        if not check_password(password, user.password_hash):
            return Response({"error": "Invalid credentials"}, status=401)

        # ✅ Create JWT tokens
        refresh = RefreshToken.for_user(user)
        # Add Mongo user_id to payload
        refresh["user_id"] = str(user.user_id)
        refresh["email"] = user.email

        return Response({
            "refresh": str(refresh),
            "access": str(refresh.access_token),
            "user": {
                "id": str(user.user_id),
                "email": user.email,
                "name": user.name
            }
        })
    except DoesNotExist:
        return Response({"error": "User not found"}, status=404)


# ---------------- REGISTER ----------------
@api_view(['POST'])
def register(request):
    email = request.data.get("email")
    password = request.data.get("password")
    name = request.data.get("name")

    if not all([email, password, name]):
        return Response({"error": "All fields are required."}, status=400)

    if User.objects(email=email).first():
        return Response({"error": "Email already registered."}, status=400)

    user = User(
        email=email,
        password_hash=make_password(password),
        name=name
    )
    user.save()

    return Response({"message": "User registered successfully."})


# ---------------- REFRESH TOKEN ----------------
@api_view(['POST'])
def refresh_token(request):
    """
    Refresh JWT access token.
    """
    from rest_framework_simplejwt.views import TokenRefreshView
    view = TokenRefreshView.as_view()
    return view(request._request)


# ---------------- GET USER (Protected) ----------------
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request):
    user = request.user
    if not user:
        return Response({"error": "User not authenticated"}, status=401)

    return Response({
        "id": str(user.user_id),
        "email": user.email,
        "name": user.name
    })
