# backend/leads/tests/test_api.py
from django.test import TestCase
from rest_framework.test import APIClient
from users.models import Agent
from leads.models import Lead

class LeadAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.agent = Agent.objects.create_user(username="apiuser", password="testpass")
        self.lead = Lead.objects.create(
            full_name="API Tester",
            email="api@example.com",
            phone="555-0000",
            property_address="1 API Way",
            status="new",
            agent=self.agent,
        )

    def test_get_leads(self):
        response = self.client.get("/api/leads/")
        self.assertEqual(response.status_code, 200)

    def test_create_lead(self):
        data = {
            "full_name": "New API Lead",
            "email": "lead@example.com",
            "phone": "555-1111",
            "property_address": "2 API Blvd",
            "status": "new",
            "agent": self.agent.id,
        }
        response = self.client.post("/api/leads/", data)
        self.assertEqual(response.status_code, 201)