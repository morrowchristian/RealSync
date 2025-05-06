from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
from leads.models import Lead
from contracts.models import Contract

Agent = get_user_model()

class ContractModelTest(TestCase):
    def setUp(self):
        self.agent = Agent.objects.create_user(username="agent2", password="testpass")
        self.lead = Lead.objects.create(
            full_name="Jane Smith",
            email="jane@example.com",
            phone="9876543210",
            property_address="456 Oak Ave",
            status="new",
            agent=self.agent
        )
        self.contract = Contract.objects.create(
            lead=self.lead,
            document=SimpleUploadedFile("contract.pdf", b"file content"),
            status="pending"
        )

    def test_contract_created(self):
        self.assertEqual(self.contract.lead, self.lead)
        self.assertEqual(self.contract.status, "pending")

    def test_contract_status_choices(self):
        status_choices = dict(Contract.STATUS_CHOICES)
        self.assertIn(self.contract.status, status_choices)
