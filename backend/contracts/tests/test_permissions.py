# backend/contracts/tests/test_permissions.py
from rest_framework.test import APITestCase
from rest_framework import status
from users.models import Agent
from leads.models import Lead
from contracts.models import Contract

class ContractPermissionTest(APITestCase):
    def setUp(self):
        self.agent = Agent.objects.create_user(username="permtest", password="testpass")
        self.client.login(username="permtest", password="testpass")
        self.lead = Lead.objects.create(
            full_name="Test Lead",
            email="test@lead.com",
            property_address="123 Main",
            phone="1234567890",
            status="new",
            agent=self.agent,
        )
        self.contract = Contract.objects.create(lead=self.lead, status="signed")

    def test_signed_contract_cannot_be_deleted(self):
        response = self.client.delete(f"/api/contracts/{self.contract.id}/")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["error"], "Signed contracts cannot be deleted.")