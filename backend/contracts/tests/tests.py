# backend/contracts/tests/tests.py
from django.test import TestCase
from users.models import Agent
from leads.models import Lead
from contracts.models import Contract

class ContractModelTest(TestCase):
    def test_string_representation(self):
        agent = Agent.objects.create_user(username="modelagent", password="testpass")
        lead = Lead.objects.create(
            full_name="Model Lead",
            email="model@lead.com",
            phone="1111111111",
            property_address="789 Test Lane",
            status="new",
            agent=agent,
        )
        contract = Contract.objects.create(lead=lead, status="signed")
        self.assertEqual(str(contract), f"Contract #{contract.id} - signed")

    def test_defaults(self):
        agent = Agent.objects.create_user(username="defaultagent", password="testpass")
        lead = Lead.objects.create(
            full_name="Default Lead",
            email="default@lead.com",
            phone="0001112222",
            property_address="1010 Default Ave",
            status="new",
            agent=agent,
        )
        contract = Contract.objects.create(lead=lead)
        self.assertEqual(contract.status, "pending")
        self.assertFalse(contract.is_archived)
