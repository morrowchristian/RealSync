# backend/users/tests.py
from django.test import TestCase
from rest_framework.test import APIClient
from users.models import Agent

class AgentAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        Agent.objects.create_user(username="agent3", password="testpass")

    def test_list_agents(self):
        response = self.client.get("/api/agents/")
        self.assertEqual(response.status_code, 200)

    def test_create_agent(self):
        data = {
            "username": "newagent",
            "password": "secretpass123",
            "email": "newagent@example.com",
        }
        response = self.client.post("/api/agents/", data)
        self.assertEqual(response.status_code, 201)
