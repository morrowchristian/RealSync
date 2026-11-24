# backend/leads/tests/test_follow_ups.py
# Tests for FollowUp CRUD and per-agent isolation. Follow-ups have NO
# trial quota.
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import Agent
from leads.models import FollowUp, Lead
from contracts.models import Estimate


def auth_client(agent):
    client = APIClient()
    refresh = RefreshToken.for_user(agent)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


def make_lead(agent, name="FollowUp Lead"):
    return Lead.objects.create(
        full_name=name, email="fu@example.com",
        property_address="1 FollowUp St", agent=agent,
    )


def follow_up_payload(**overrides):
    data = {
        "title": "Call about the AC quote",
        "due_date": "2026-11-25",
        "notes": "Customer is home after 5pm.",
    }
    data.update(overrides)
    return data


class FollowUpAPITestCase(TestCase):
    def setUp(self):
        self.agent = Agent.objects.create_user(username="fuuser", password="testpass")
        self.other = Agent.objects.create_user(username="fuother", password="testpass")
        self.client = auth_client(self.agent)
        self.other_client = auth_client(self.other)
        self.lead = make_lead(self.agent)
        self.other_lead = make_lead(self.other, name="Other Lead")
        self.estimate = Estimate.objects.create(lead=self.lead, title="AC replacement")
        self.other_estimate = Estimate.objects.create(lead=self.other_lead, title="Panel upgrade")

    def test_create_with_lead_and_read_back(self):
        response = self.client.post(
            "/api/follow-ups/", follow_up_payload(lead=self.lead.id), format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.data["title"], "Call about the AC quote")
        self.assertEqual(response.data["due_date"], "2026-11-25")
        self.assertFalse(response.data["completed"])
        self.assertEqual(response.data["notes"], "Customer is home after 5pm.")
        self.assertEqual(response.data["lead"], self.lead.id)
        self.assertIsNone(response.data["estimate"])

    def test_create_with_estimate_only(self):
        response = self.client.post(
            "/api/follow-ups/", follow_up_payload(estimate=self.estimate.id), format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertIsNone(response.data["lead"])
        self.assertEqual(response.data["estimate"], self.estimate.id)

    def test_create_standalone(self):
        # No lead and no estimate: allowed, but per the isolation rule
        # it belongs to no one, so it never shows up in any agent's list.
        response = self.client.post("/api/follow-ups/", follow_up_payload(), format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(self.client.get("/api/follow-ups/").data, [])

    def test_mark_completed(self):
        follow_up = FollowUp.objects.create(
            lead=self.lead, title="Call", due_date="2026-11-25")
        response = self.client.patch(
            f"/api/follow-ups/{follow_up.id}/", {"completed": True}, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(response.data["completed"])

    def test_list_scoped_to_own_leads(self):
        FollowUp.objects.create(lead=self.lead, title="Mine", due_date="2026-11-25")
        FollowUp.objects.create(
            estimate=self.estimate, title="Mine via estimate", due_date="2026-11-26")
        FollowUp.objects.create(lead=self.other_lead, title="Theirs", due_date="2026-11-25")
        FollowUp.objects.create(
            estimate=self.other_estimate, title="Theirs via estimate", due_date="2026-11-25")
        response = self.client.get("/api/follow-ups/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            sorted(f["title"] for f in response.data),
            ["Mine", "Mine via estimate"],
        )

    def test_estimate_only_follow_up_visible_only_to_estimate_owner(self):
        follow_up = FollowUp.objects.create(
            estimate=self.estimate, title="Estimate only", due_date="2026-11-25")
        response = self.other_client.get("/api/follow-ups/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data, [])
        response = self.other_client.get(f"/api/follow-ups/{follow_up.id}/")
        self.assertEqual(response.status_code, 404)

    def test_other_agent_cannot_retrieve_update_or_delete(self):
        follow_up = FollowUp.objects.create(
            lead=self.lead, title="Secret", due_date="2026-11-25")
        for method, url in (
            ("get", f"/api/follow-ups/{follow_up.id}/"),
            ("patch", f"/api/follow-ups/{follow_up.id}/"),
            ("delete", f"/api/follow-ups/{follow_up.id}/"),
        ):
            response = getattr(self.other_client, method)(url, {"title": "Hacked"} if method == "patch" else {})
            self.assertEqual(response.status_code, 404, (method, response.content))
        self.assertTrue(FollowUp.objects.filter(pk=follow_up.id).exists())

    def test_create_on_other_agents_lead_rejected(self):
        response = self.client.post(
            "/api/follow-ups/", follow_up_payload(lead=self.other_lead.id), format="json")
        self.assertEqual(response.status_code, 400, response.content)
        self.assertIn("only create follow-ups for your own leads", str(response.data))
        self.assertFalse(FollowUp.objects.filter(lead=self.other_lead).exists())

    def test_create_on_other_agents_estimate_rejected(self):
        response = self.client.post(
            "/api/follow-ups/", follow_up_payload(estimate=self.other_estimate.id), format="json")
        self.assertEqual(response.status_code, 400, response.content)
        self.assertIn("only create follow-ups for your own estimates", str(response.data))
        self.assertFalse(FollowUp.objects.filter(estimate=self.other_estimate).exists())

    def test_update_to_other_agents_lead_rejected(self):
        follow_up = FollowUp.objects.create(
            lead=self.lead, title="Mine", due_date="2026-11-25")
        response = self.client.patch(
            f"/api/follow-ups/{follow_up.id}/", {"lead": self.other_lead.id}, format="json")
        self.assertEqual(response.status_code, 400, response.content)
        follow_up.refresh_from_db()
        self.assertEqual(follow_up.lead, self.lead)

    def test_delete_is_hard_delete(self):
        follow_up = FollowUp.objects.create(
            lead=self.lead, title="Gone", due_date="2026-11-25")
        response = self.client.delete(f"/api/follow-ups/{follow_up.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(FollowUp.objects.filter(pk=follow_up.id).exists())

    def test_unauthenticated_is_rejected(self):
        response = APIClient().get("/api/follow-ups/")
        self.assertEqual(response.status_code, 401)


class FollowUpNoQuotaTestCase(TestCase):
    def test_trial_user_can_create_more_than_20_follow_ups(self):
        trial = Agent.objects.create_user(
            username="futrial", password="testpass", is_trial=True)
        client = auth_client(trial)
        lead = make_lead(trial)
        for i in range(25):
            response = client.post(
                "/api/follow-ups/",
                follow_up_payload(lead=lead.id, title=f"Reminder {i}"),
                format="json",
            )
            self.assertEqual(response.status_code, 201, (i, response.content))
        self.assertEqual(FollowUp.objects.filter(lead__agent=trial).count(), 25)
