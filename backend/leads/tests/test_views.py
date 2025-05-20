# backend/leads/tests/test_views.py
from django.test import TestCase
from rest_framework.test import APIClient
from users.models import Agent
from leads.models import Lead

class LeadViewTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.agent = Agent.objects.create_user(username="viewuser", password="testpass")
        self.lead = Lead.objects.create(
            full_name="View Lead",
            email="view@example.com",
            phone="555-4444",
            property_address="5 View Ln",
            status="new",
            agent=self.agent,
        )

    def test_get_single_lead(self):
        response = self.client.get(f"/api/leads/{self.lead.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["id"], self.lead.id)

    def test_archive_lead(self):
        response = self.client.post(f"/api/leads/{self.lead.id}/archive/")
        self.assertEqual(response.status_code, 200)
        self.lead.refresh_from_db()
        self.assertTrue(self.lead.is_archived)
