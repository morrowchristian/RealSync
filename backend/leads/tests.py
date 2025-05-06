from django.test import TestCase
from django.contrib.auth import get_user_model
from leads.models import Lead

Agent = get_user_model()

class LeadModelTest(TestCase):
    def setUp(self):
        self.agent = Agent.objects.create_user(username="agent1", password="testpass")
        self.lead = Lead.objects.create(
            full_name="John Doe",
            email="john@example.com",
            phone="1234567890",
            property_address="123 Elm Street",
            status="new",
            agent=self.agent
        )

    def test_lead_created(self):
        self.assertEqual(self.lead.full_name, "John Doe")
        self.assertEqual(self.lead.status, "new")
        self.assertEqual(self.lead.agent, self.agent)

    def test_status_choices(self):
        status_choices = dict(Lead.STATUS_CHOICES)
        self.assertIn(self.lead.status, status_choices)
