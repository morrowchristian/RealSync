# backend/tests/base_api.py
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import Agent

class BaseAPITestCase(APITestCase):
    def setUp(self):
        self.agent = Agent.objects.create_user(username="apitester", password="testpass")
        refresh = RefreshToken.for_user(self.agent)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')