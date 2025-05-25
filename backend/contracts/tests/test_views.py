# backend/contracts/tests/test_views.py
from tests.base_crud import BaseCRUDTestCase
from contracts.models import Contract
from leads.models import Lead

class ContractViewTestCase(BaseCRUDTestCase):
    model = Contract
    endpoint = "contracts"

    def create_instance(self):
        lead = Lead.objects.create(
            full_name="Lead for Contract",
            email="lead@contract.com",
            phone="111-222-3333",
            property_address="789 Contract Rd",
            status="new",
            agent=self.agent,
        )
        return Contract.objects.create(lead=lead, status="pending")