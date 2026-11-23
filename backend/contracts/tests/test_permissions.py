# backend/contracts/tests/test_permissions.py
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import Agent
from leads.models import Lead
from contracts.models import Contract

class ContractPermissionTest(APITestCase):
    def setUp(self):
        self.agent = Agent.objects.create_user(username="permtest", password="testpass")
        # API requires JWT auth (session login does not authenticate
        # JWT-only endpoints): authenticate the test client with a token.
        refresh = RefreshToken.for_user(self.agent)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
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