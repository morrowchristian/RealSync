# backend/leads/tests/test_models.py
from django.test import TestCase
from users.models import Agent
from leads.models import Lead

class LeadModelTestCase(TestCase):
    def setUp(self):
        self.agent = Agent.objects.create_user(username="modeluser", password="testpass")

    def test_lead_str(self):
        lead = Lead.objects.create(
            full_name="Model Test",
            email="model@example.com",
            phone="555-2222",
            property_address="3 Model St",
            status="new",
            agent=self.agent,
        )
        self.assertEqual(str(lead), "Model Test")

    def test_default_status(self):
        lead = Lead.objects.create(
            full_name="Default Status",
            email="default@example.com",
            phone="555-3333",
            property_address="4 Default Rd",
            agent=self.agent,
        )
        self.assertEqual(lead.status, "new")