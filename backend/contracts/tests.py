#contracts/tests.py
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from users.models import Agent
from leads.models import Lead
from contracts.models import Contract

class ContractAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.agent = Agent.objects.create_user(username="agent2", password="testpass")
        self.lead = Lead.objects.create(
            full_name="Buyer Bob",
            email="bob@example.com",
            phone="555-555-5555",
            property_address="789 Pine Ave",
            status="new",
            agent=self.agent,
        )
        self.contract = Contract.objects.create(
            lead=self.lead,
            status="PENDING"
        )

    def test_list_contracts(self):
        response = self.client.get("/api/contracts/")
        self.assertEqual(response.status_code, 200)

    def test_create_contract(self):
        dummy_file = SimpleUploadedFile(
            "test_contract.pdf",
            b"dummy pdf content",
            content_type="application/pdf"
        )
        data = {
            "lead": self.lead.id,
            "status": "signed",
            "document": dummy_file,
        }
        response = self.client.post("/api/contracts/", data, format="multipart")
        print("Create contract error:", response.data)
        self.assertEqual(response.status_code, 201)