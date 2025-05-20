from django.test import TestCase
from rest_framework.test import APIClient
from users.models import Agent

class AuthFlowTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.username = "authuser"
        self.password = "securepass123"
        self.user = Agent.objects.create_user(username=self.username, password=self.password)

    def test_token_obtain_and_refresh(self):
        # Step 1: Obtain token
        response = self.client.post("/api/token/", {
            "username": self.username,
            "password": self.password
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

        access = response.data["access"]
        refresh = response.data["refresh"]

        # Step 2: Use access token to access a protected view
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        protected = self.client.get("/api/leads/")
        self.assertEqual(protected.status_code, 200)

        # Step 3: Refresh the access token
        refresh_response = self.client.post("/api/token/refresh/", {
            "refresh": refresh
        })
        self.assertEqual(refresh_response.status_code, 200)
        self.assertIn("access", refresh_response.data)

    def test_invalid_token_use(self):
        self.client.credentials(HTTP_AUTHORIZATION="Bearer invalidtoken")
        response = self.client.get("/api/leads/")
        self.assertEqual(response.status_code, 401)
