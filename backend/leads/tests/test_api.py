# backend/leads/tests/test_api.py
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import Agent
from leads.models import Lead

class LeadAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.agent = Agent.objects.create_user(username="apiuser", password="testpass")
        # API requires JWT auth: authenticate the test client.
        refresh = RefreshToken.for_user(self.agent)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
        self.lead = Lead.objects.create(
            full_name="API Tester",
            email="api@example.com",
            phone="555-0000",
            property_address="1 API Way",
            status="new",
            agent=self.agent,
        )

    def test_get_leads(self):
        response = self.client.get("/api/leads/")
        self.assertEqual(response.status_code, 200)

    def test_create_lead(self):
        data = {
            "full_name": "New API Lead",
            "email": "lead@example.com",
            "phone": "555-1111",
            "property_address": "2 API Blvd",
            "status": "new",
            "agent": self.agent.id,
        }
        response = self.client.post("/api/leads/", data)
        self.assertEqual(response.status_code, 201)

    def test_create_lead_without_agent_succeeds_and_is_owned_by_request_user(self):
        # Regression test (PR #10 hotfix): the frontend no longer sends
        # `agent` in the payload. `agent` is read-only on the serializer
        # and set by the viewset from the logged-in user, so a create
        # with no `agent` must succeed and belong to the request user.
        data = {
            "full_name": "No Agent Lead",
            "email": "noagent@example.com",
            "phone": "555-2222",
            "property_address": "3 No Agent Ln",
            "status": "new",
        }
        response = self.client.post("/api/leads/", data)
        self.assertEqual(response.status_code, 201)
        lead = Lead.objects.get(id=response.data["id"])
        self.assertEqual(lead.agent, self.agent)
        self.assertEqual(response.data["agent"], self.agent.id)

    def test_create_lead_with_source_and_preferred_contact(self):
        # PR #10 dropdown fix must still hold: the backend choice keys
        # (not display labels) are accepted for lead_source and
        # preferred_contact.
        data = {
            "full_name": "Sourced Lead",
            "email": "sourced@example.com",
            "phone": "555-3333",
            "property_address": "4 Source St",
            "status": "new",
            "lead_source": "referral",
            "preferred_contact": "email",
        }
        response = self.client.post("/api/leads/", data)
        self.assertEqual(response.status_code, 201)
        lead = Lead.objects.get(id=response.data["id"])
        self.assertEqual(lead.agent, self.agent)
        self.assertEqual(lead.lead_source, "referral")
        self.assertEqual(lead.preferred_contact, "email")

    def test_create_lead_ignores_agent_id_in_payload(self):
        # The backend is the source of truth for ownership: a payload
        # `agent` must not let a user claim (or steal) another agent's
        # identity — read-only fields are dropped from validated input.
        other = Agent.objects.create_user(username="otheragent", password="testpass")
        data = {
            "full_name": "Spoofed Agent Lead",
            "email": "spoof@example.com",
            "phone": "555-4444",
            "property_address": "5 Spoof Ave",
            "status": "new",
            "agent": other.id,
        }
        response = self.client.post("/api/leads/", data)
        self.assertEqual(response.status_code, 201)
        lead = Lead.objects.get(id=response.data["id"])
        self.assertEqual(lead.agent, self.agent)

    def test_user_only_sees_own_leads(self):
        # Per-user isolation still holds after the serializer change.
        other = Agent.objects.create_user(username="isolation", password="testpass")
        Lead.objects.create(
            full_name="Someone Else's Lead",
            email="other@example.com",
            phone="555-5555",
            property_address="6 Other Rd",
            status="new",
            agent=other,
        )
        response = self.client.get("/api/leads/")
        self.assertEqual(response.status_code, 200)
        names = [item["full_name"] for item in response.data]
        self.assertIn("API Tester", names)
        self.assertNotIn("Someone Else's Lead", names)