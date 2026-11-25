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

    def test_list_agents_returns_only_self(self):
        # Per-agent isolation: the list must never expose other
        # accounts, even though the Agent model is the user model.
        Agent.objects.create_user(username="listuser", password="testpass")
        response = self.client.get("/api/agents/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]["id"], self.agent.id)
        self.assertEqual(response.data[0]["username"], "authuser")

    def test_create_agent_via_api_is_not_allowed(self):
        # Account creation goes through public signup
        # (POST /api/register/) only — the agents endpoint must not
        # be a back door for creating accounts outside the trial flow.
        data = {
            "username": "newagent",
            "password": "strongpass123",
            "email": "new@agent.com"
        }
        response = self.client.post("/api/agents/", data)
        self.assertEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
        self.assertFalse(Agent.objects.filter(username="newagent").exists())

    def test_cannot_retrieve_another_agent(self):
        other = Agent.objects.create_user(username="otheruser", password="testpass")
        response = self.client.get(f"/api/agents/{other.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_cannot_update_another_agent(self):
        other = Agent.objects.create_user(
            username="otheruser", password="testpass", company="Original Co")
        response = self.client.patch(
            f"/api/agents/{other.id}/", {"company": "Hijacked Co"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        other.refresh_from_db()
        self.assertEqual(other.company, "Original Co")

    def test_cannot_delete_another_agent(self):
        other = Agent.objects.create_user(username="otheruser", password="testpass")
        response = self.client.delete(f"/api/agents/{other.id}/")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Agent.objects.filter(pk=other.pk).exists())

    def test_can_update_own_profile(self):
        response = self.client.patch(
            f"/api/agents/{self.agent.id}/",
            {"company": "Summit Plumbing & HVAC"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["company"], "Summit Plumbing & HVAC")

    def test_can_delete_own_account(self):
        response = self.client.delete(f"/api/agents/{self.agent.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Agent.objects.filter(pk=self.agent.pk).exists())

    def test_agent_profile_exposes_company_not_brokerage(self):
        # Agent.brokerage was renamed to Agent.company (home-services
        # re-skin); the API field is now `company`.
        self.agent.company = "Summit Plumbing & HVAC"
        self.agent.save()
        response = self.client.get(f"/api/agents/{self.agent.id}/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["company"], "Summit Plumbing & HVAC")
        self.assertNotIn("brokerage", response.data)
