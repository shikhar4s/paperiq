from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView
from .serializers import MongoTokenRefreshSerializer

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login_view, name='login'),
    path('refresh/', TokenRefreshView.as_view(serializer_class=MongoTokenRefreshSerializer), name='token_refresh'),
    path('user/', views.get_user, name='get_user'),
]
