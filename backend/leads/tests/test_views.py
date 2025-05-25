# backend/leads/tests/test_views.py
from tests.base_crud import BaseCRUDTestCase
from leads.models import Lead

class LeadViewTestCase(BaseCRUDTestCase):
    model = Lead
    endpoint = "leads"

    def create_instance(self):
        return Lead.objects.create(
            full_name="Lead Test",
            email="lead@test.com",
            phone="0000000000",
            property_address="123 Test St",
            status="new",
            agent=self.agent,
        )
