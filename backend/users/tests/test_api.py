# backend/users/tests/test_api.py
from rest_framework.test import APITestCase
from rest_framework import status
from users.models import Agent

class AgentAPITests(APITestCase):
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