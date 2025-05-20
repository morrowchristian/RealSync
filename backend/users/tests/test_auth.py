# backend/users/tests/test_auth.py
from rest_framework.test import APITestCase
from rest_framework import status
from users.models import Agent

class JWTAuthTests(APITestCase):
    def setUp(self):
        self.username = "authuser"
        self.password = "authpass123"
        self.agent = Agent.objects.create_user(username=self.username, password=self.password)

    def test_obtain_token_pair(self):
        response = self.client.post("/api/token/", {
            "username": self.username,
            "password": self.password
        }, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_access_protected_endpoint_with_token(self):
        token_response = self.client.post("/api/token/", {
            "username": self.username,
            "password": self.password
        }, format='json')
        access = token_response.data["access"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        protected_response = self.client.get("/api/leads/")
        self.assertEqual(protected_response.status_code, status.HTTP_200_OK)

    def test_refresh_token(self):
        token_response = self.client.post("/api/token/", {
            "username": self.username,
            "password": self.password
        }, format='json')
        refresh = token_response.data["refresh"]

        refresh_response = self.client.post("/api/token/refresh/", {
            "refresh": refresh
        }, format='json')

        self.assertEqual(refresh_response.status_code, status.HTTP_200_OK)
        self.assertIn("access", refresh_response.data)

    def test_invalid_token(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalidtoken")
        response = self.client.get("/api/leads/")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertIn("detail", response.data)