#leads/tests.py
from django.test import TestCase
from rest_framework.test import APIClient
from users.models import Agent
from leads.models import Lead

class LeadAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.agent = Agent.objects.create_user(username="agent1", password="testpass")
        self.lead = Lead.objects.create(
            full_name="John Doe",
            email="john@example.com",
            phone="123-456-7890",
            property_address="123 Main St",
            status="new",
            agent=self.agent,
        )

    def test_list_leads(self):
        response = self.client.get("/api/leads/")
        self.assertEqual(response.status_code, 200)

    def test_create_lead(self):
        data = {
            "full_name": "Jane Smith",
            "email": "jane@example.com",
            "phone": "987-555-1234",
            "property_address": "456 Elm St",
            "status": "new",
            "agent": self.agent.id,
        }
        response = self.client.post("/api/leads/", data)
        self.assertEqual(response.status_code, 201)
