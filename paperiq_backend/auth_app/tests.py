from datetime import timedelta
from unittest.mock import patch

from django.test import SimpleTestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from paperiq_ai.models import User


class SessionTests(SimpleTestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User(email='session-test@example.com', name='Session Test', password_hash='unused')

    def tokens(self):
        token = RefreshToken.for_user(self.user)
        token['user_id'] = str(self.user.user_id)
        return token

    @patch('auth_app.authentication.User.objects')
    def test_refresh_accepts_valid_refresh_even_with_expired_authorization(self, users):
        users.get.return_value = self.user
        token = self.tokens()
        self.client.credentials(HTTP_AUTHORIZATION='Bearer expired-token')
        response = self.client.post('/api/auth/refresh/', {'refresh': str(token)}, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('access', response.data)

    def test_expired_refresh_is_rejected(self):
        token = self.tokens()
        token.set_exp(from_time=timezone.now() - timedelta(days=10), lifetime=timedelta(days=1))
        response = self.client.post('/api/auth/refresh/', {'refresh': str(token)}, format='json')
        self.assertEqual(response.status_code, 401)

    @patch('auth_app.views.check_password', return_value=True)
    @patch('auth_app.views.User.objects')
    def test_login_ignores_stale_authorization(self, users, check_password):
        users.get.return_value = self.user
        self.client.credentials(HTTP_AUTHORIZATION='Bearer expired-token')
        response = self.client.post('/api/auth/login/', {
            'email': self.user.email, 'password': 'test-password',
        }, format='json')
        self.assertEqual(response.status_code, 200)
        self.assertIn('refresh', response.data)

    @patch('auth_app.authentication.User.objects')
    def test_mongo_user_can_access_authenticated_profile(self, users):
        users.get.return_value = self.user
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.tokens().access_token}')
        response = self.client.get('/api/auth/user/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['email'], self.user.email)

    def test_anonymous_summary_requires_authentication(self):
        response = self.client.post('/api/summarize/', {}, format='multipart')
        self.assertEqual(response.status_code, 401)

    @patch('auth_app.authentication.User.objects')
    def test_missing_user_is_rejected(self, users):
        users.get.side_effect = User.DoesNotExist
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.tokens().access_token}')
        self.assertEqual(self.client.get('/api/auth/user/').status_code, 401)
