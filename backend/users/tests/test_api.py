# backend/users/tests/test_api.py
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import Agent

class AgentAPITests(APITestCase):
    def setUp(self):
        # API requires JWT auth: authenticate the test client.
        self.agent = Agent.objects.create_user(username="authuser", password="testpass")
        refresh = RefreshToken.for_user(self.agent)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')

    def test_list_agents(self):
        Agent.objects.create_user(username="listuser", password="testpass")
        response = self.client.get("/api/agents/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)

    def test_create_agent(self):
        data = {
            "username": "newagent",
            "password": "strongpass123",
            "email": "new@agent.com"
        }
        response = self.client.post("/api/agents/", data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_agent_profile_exposes_company_not_brokerage(self):
        # Agent.brokerage was renamed to Agent.company (home-services
        # re-skin); the API field is now `company`.
        self.agent.company = "Summit Plumbing & HVAC"
        self.agent.save()
        response = self.client.get(f"/api/agents/{self.agent.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["company"], "Summit Plumbing & HVAC")
        self.assertNotIn("brokerage", response.data)