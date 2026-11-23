# backend/contracts/tests/test_estimates.py
# Tests for Estimate CRUD, per-agent isolation, and the trial quota.
# Winning an estimate must NOT auto-create a Contract.
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import Agent
from leads.models import Lead
from contracts.models import Contract, Estimate


def auth_client(agent):
    client = APIClient()
    refresh = RefreshToken.for_user(agent)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


def make_lead(agent, name="Est Lead"):
    return Lead.objects.create(
        full_name=name, email="est@example.com",
        property_address="1 Est St", agent=agent,
    )


def estimate_payload(lead, **overrides):
    data = {
        "lead": lead.id,
        "title": "Kitchen remodel quote",
        "description": "New sink and faucet install.",
        "amount": "1250.00",
        "status": "sent",
        "date_sent": "2026-11-23",
        "notes": "Call before visiting.",
    }
    data.update(overrides)
    return data


class EstimateAPITestCase(TestCase):
    def setUp(self):
        self.agent = Agent.objects.create_user(username="estuser", password="testpass")
        self.other = Agent.objects.create_user(username="estother", password="testpass")
        self.client = auth_client(self.agent)
        self.other_client = auth_client(self.other)
        self.lead = make_lead(self.agent)
        self.other_lead = make_lead(self.other, name="Other Lead")

    def test_create_and_read_back(self):
        response = self.client.post("/api/estimates/", estimate_payload(self.lead), format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.data["title"], "Kitchen remodel quote")
        self.assertEqual(response.data["description"], "New sink and faucet install.")
        self.assertEqual(response.data["amount"], "1250.00")
        self.assertEqual(response.data["status"], "sent")
        self.assertEqual(response.data["date_sent"], "2026-11-23")
        self.assertEqual(response.data["notes"], "Call before visiting.")
        self.assertEqual(response.data["lead"], self.lead.id)

    def test_create_defaults_status_to_sent(self):
        payload = estimate_payload(self.lead)
        del payload["status"]
        response = self.client.post("/api/estimates/", payload, format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.data["status"], "sent")

    def test_create_without_amount(self):
        payload = estimate_payload(self.lead)
        del payload["amount"]
        response = self.client.post("/api/estimates/", payload, format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertIsNone(response.data["amount"])

    def test_list_scoped_to_own_leads(self):
        Estimate.objects.create(lead=self.lead, title="Mine")
        Estimate.objects.create(lead=self.other_lead, title="Theirs")
        response = self.client.get("/api/estimates/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([e["title"] for e in response.data], ["Mine"])

    def test_other_agent_cannot_retrieve_update_or_delete(self):
        estimate = Estimate.objects.create(lead=self.lead, title="Secret")
        for method, url in (
            ("get", f"/api/estimates/{estimate.id}/"),
            ("patch", f"/api/estimates/{estimate.id}/"),
            ("delete", f"/api/estimates/{estimate.id}/"),
        ):
            response = getattr(self.other_client, method)(url, {"title": "Hacked"} if method == "patch" else {})
            self.assertEqual(response.status_code, 404, (method, response.content))
        self.assertTrue(Estimate.objects.filter(pk=estimate.id).exists())

    def test_create_on_other_agents_lead_rejected(self):
        response = self.client.post("/api/estimates/", estimate_payload(self.other_lead), format="json")
        self.assertEqual(response.status_code, 400, response.content)
        self.assertIn("only create estimates for your own leads", str(response.data))
        self.assertFalse(Estimate.objects.filter(lead=self.other_lead).exists())

    def test_update_to_other_agents_lead_rejected(self):
        estimate = Estimate.objects.create(lead=self.lead, title="Mine")
        response = self.client.patch(
            f"/api/estimates/{estimate.id}/", {"lead": self.other_lead.id}, format="json")
        self.assertEqual(response.status_code, 400, response.content)
        estimate.refresh_from_db()
        self.assertEqual(estimate.lead, self.lead)

    def test_update_status_to_won_does_not_create_contract(self):
        estimate = Estimate.objects.create(lead=self.lead, title="Mine", status="sent")
        response = self.client.patch(
            f"/api/estimates/{estimate.id}/", {"status": "won"}, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["status"], "won")
        self.assertEqual(Contract.objects.count(), 0)

    def test_delete_is_hard_delete(self):
        estimate = Estimate.objects.create(lead=self.lead, title="Gone")
        response = self.client.delete(f"/api/estimates/{estimate.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(Estimate.objects.filter(pk=estimate.id).exists())

    def test_unauthenticated_is_rejected(self):
        response = APIClient().get("/api/estimates/")
        self.assertEqual(response.status_code, 401)


class EstimateTrialQuotaTestCase(TestCase):
    def setUp(self):
        self.trial = Agent.objects.create_user(
            username="esttrial", password="testpass", is_trial=True)
        self.trial_client = auth_client(self.trial)
        self.trial_lead = make_lead(self.trial)
        self.agent = Agent.objects.create_user(username="estnontrial", password="testpass")
        self.client = auth_client(self.agent)
        self.lead = make_lead(self.agent)

    def test_trial_user_at_20_estimates_gets_400(self):
        for i in range(20):
            Estimate.objects.create(lead=self.trial_lead, title=f"Est {i}")
        response = self.trial_client.post(
            "/api/estimates/", estimate_payload(self.trial_lead), format="json")
        self.assertEqual(response.status_code, 400, response.content)
        self.assertIn("20 estimate limit", str(response.data))
        self.assertEqual(Estimate.objects.filter(lead__agent=self.trial).count(), 20)

    def test_non_trial_user_is_unlimited(self):
        for i in range(20):
            Estimate.objects.create(lead=self.lead, title=f"Est {i}")
        response = self.client.post(
            "/api/estimates/", estimate_payload(self.lead), format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(Estimate.objects.filter(lead__agent=self.agent).count(), 21)
