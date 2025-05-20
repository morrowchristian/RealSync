# backend/contracts/tests/test_views.py
from rest_framework.test import APITestCase
from rest_framework import status
from users.models import Agent
from leads.models import Lead
from contracts.models import Contract

class ContractViewTests(APITestCase):
    def setUp(self):
        self.agent = Agent.objects.create_user(username="viewtester", password="testpass")
        self.client.login(username="viewtester", password="testpass")
        self.lead = Lead.objects.create(
            full_name="View Test",
            email="view@test.com",
            phone="0000000000",
            property_address="456 View St",
            status="new",
            agent=self.agent,
        )

    def test_create_contract(self):
        with open("contracts/dummy_contract.pdf", "rb") as pdf:
            data = {
                "lead": self.lead.id,
                "status": "pending",
                "document": pdf,
            }
            response = self.client.post("/api/contracts/", data, format="multipart")
            self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_archive_contract(self):
        contract = Contract.objects.create(lead=self.lead, status="pending")
        response = self.client.post(f"/api/contracts/{contract.id}/archive/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        contract.refresh_from_db()
        self.assertTrue(contract.is_archived)