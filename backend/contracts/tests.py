# backend/contracts/tests.py
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
    
    def test_get_single_contract(self):
        response = self.client.get(f"/api/contracts/{self.contract.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["id"], self.contract.id)

    def test_archive_contract(self):
        response = self.client.post(f"/api/contracts/{self.contract.id}/archive/")
        self.assertEqual(response.status_code, 200)
        self.contract.refresh_from_db()
        self.assertTrue(self.contract.is_archived)

    def test_signed_contract_cannot_be_deleted(self):
        self.contract.status = 'signed'
        self.contract.save()
        response = self.client.delete(f"/api/contracts/{self.contract.id}/")
        self.assertEqual(response.status_code, 403)
