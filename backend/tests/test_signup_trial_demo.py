# backend/tests/test_signup_trial_demo.py
"""Tests for public signup, trial quotas/expiry/cleanup, and the
read-only visitor demo. Backend only."""
import os
from datetime import timedelta
from unittest.mock import patch

from django.conf import settings
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from contracts.models import Contract
from leads.models import CustomField, Lead
from users.models import Agent
from users.views import TRIAL_EXPIRED_MESSAGE


def auth_client(agent):
    client = APIClient()
    refresh = RefreshToken.for_user(agent)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


def make_lead_payload(agent, **overrides):
    data = {
        "full_name": "Trial Lead",
        "email": "trial-lead@example.com",
        "phone": "555-123-4567",
        "property_address": "1 Trial St",
        "status": "new",
        "agent": agent.id,
    }
    data.update(overrides)
    return data


def make_trial(username="trialuser", **kwargs):
    return Agent.objects.create_user(
        username=username, email=f"{username}@example.com",
        password="trialpass123", is_trial=True, **kwargs)


def backdate(agent, days):
    Agent.objects.filter(pk=agent.pk).update(
        date_joined=timezone.now() - timedelta(days=days))


class RegistrationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_success_returns_tokens_and_trial_fields(self):
        response = self.client.post("/api/register/", {
            "username": "newtrial", "email": "new@example.com",
            "password": "strongpass123",
        }, format="json")
        self.assertEqual(response.status_code, 201, response.content)
        for key in ("id", "username", "email", "is_trial", "trial_ends_at",
                    "access", "refresh"):
            self.assertIn(key, response.data, key)
        self.assertTrue(response.data["is_trial"])
        self.assertEqual(response.data["username"], "newtrial")
        user = Agent.objects.get(username="newtrial")
        self.assertTrue(user.is_trial)
        self.assertTrue(user.check_password("strongpass123"))
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        # The returned tokens actually log the user in.
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {response.data['access']}")
        self.assertEqual(self.client.get("/api/leads/").status_code, 200)

    def test_register_duplicate_username_returns_400(self):
        make_trial("dupuser")
        response = self.client.post("/api/register/", {
            "username": "dupuser", "email": "other@example.com",
            "password": "strongpass123",
        }, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("username", response.data)
        self.assertIn("already exists", str(response.data))

    def test_register_bad_email_returns_400(self):
        response = self.client.post("/api/register/", {
            "username": "bademail", "email": "not-an-email",
            "password": "strongpass123",
        }, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("email", response.data)

    def test_register_short_password_returns_400(self):
        response = self.client.post("/api/register/", {
            "username": "shortpw", "email": "short@example.com",
            "password": "abc123",
        }, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)

    def test_register_missing_password_returns_400(self):
        response = self.client.post("/api/register/", {
            "username": "nopw", "email": "nopw@example.com",
        }, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("password", response.data)

    def test_register_cannot_create_staff_or_superuser(self):
        response = self.client.post("/api/register/", {
            "username": "sneaky", "email": "sneaky@example.com",
            "password": "strongpass123",
            "is_staff": True, "is_superuser": True, "is_trial": False,
        }, format="json")
        self.assertEqual(response.status_code, 201, response.content)
        user = Agent.objects.get(username="sneaky")
        self.assertFalse(user.is_staff)
        self.assertFalse(user.is_superuser)
        self.assertTrue(user.is_trial)

    def test_register_is_unauthenticated(self):
        # No credentials needed; the endpoint is public.
        response = self.client.post("/api/register/", {
            "username": "public", "email": "public@example.com",
            "password": "strongpass123",
        }, format="json")
        self.assertEqual(response.status_code, 201, response.content)


class TrialFieldsTestCase(TestCase):
    def test_trial_ends_at_and_days_remaining(self):
        trial = make_trial("fieldsuser")
        self.assertEqual(trial.days_remaining, settings.TRIAL_DAYS)
        self.assertEqual(
            trial.trial_ends_at,
            trial.date_joined + timedelta(days=settings.TRIAL_DAYS))
        # Serializer exposes the fields (Settings page display).
        client = auth_client(trial)
        response = client.get(f"/api/agents/{trial.id}/")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["is_trial"])
        self.assertIsNotNone(response.data["trial_ends_at"])
        self.assertEqual(response.data["days_remaining"], settings.TRIAL_DAYS)

    def test_non_trial_has_null_trial_fields(self):
        admin = Agent.objects.create_superuser(
            username="owner", email="owner@example.com", password="ownerpass123")
        self.assertIsNone(admin.trial_ends_at)
        self.assertIsNone(admin.days_remaining)
        self.assertFalse(admin.is_trial_expired)


class LeadQuotaTestCase(TestCase):
    def setUp(self):
        self.trial = make_trial("quotalead")
        self.client = auth_client(self.trial)

    def test_lead_quota_blocks_51st_with_plain_message(self):
        for i in range(settings.TRIAL_LEAD_LIMIT):
            Lead.objects.create(
                full_name=f"Lead {i}", email=f"lead{i}@example.com",
                property_address=f"{i} Quota St", agent=self.trial)
        response = self.client.post(
            "/api/leads/", make_lead_payload(self.trial), format="json")
        self.assertEqual(response.status_code, 400, response.content)
        self.assertIn("50 lead limit", str(response.data))

    def test_archived_leads_still_count_toward_quota(self):
        for i in range(settings.TRIAL_LEAD_LIMIT):
            Lead.objects.create(
                full_name=f"Lead {i}", email=f"lead{i}@example.com",
                property_address=f"{i} Quota St", agent=self.trial,
                is_archived=True)
        response = self.client.post(
            "/api/leads/", make_lead_payload(self.trial), format="json")
        self.assertEqual(response.status_code, 400, response.content)

    def test_below_quota_can_still_create(self):
        for i in range(settings.TRIAL_LEAD_LIMIT - 1):
            Lead.objects.create(
                full_name=f"Lead {i}", email=f"lead{i}@example.com",
                property_address=f"{i} Quota St", agent=self.trial)
        response = self.client.post(
            "/api/leads/", make_lead_payload(self.trial), format="json")
        self.assertEqual(response.status_code, 201, response.content)

    def test_non_trial_admin_is_not_quota_limited(self):
        admin = Agent.objects.create_superuser(
            username="quotaowner", email="qo@example.com", password="ownerpass123")
        admin_client = auth_client(admin)
        for i in range(settings.TRIAL_LEAD_LIMIT):
            Lead.objects.create(
                full_name=f"Lead {i}", email=f"lead{i}@example.com",
                property_address=f"{i} Quota St", agent=admin)
        response = admin_client.post(
            "/api/leads/", make_lead_payload(admin), format="json")
        self.assertEqual(response.status_code, 201, response.content)


class ContractQuotaTestCase(TestCase):
    def setUp(self):
        self.trial = make_trial("quotacontract")
        self.client = auth_client(self.trial)
        self.lead = Lead.objects.create(
            full_name="Contract Lead", email="c@example.com",
            property_address="1 Contract St", agent=self.trial)

    def _contract_payload(self):
        return {
            "lead": self.lead.id, "status": "pending",
            "document": SimpleUploadedFile(
                "contract.pdf", b"%PDF-1.4 dummy", content_type="application/pdf"),
        }

    def test_contract_quota_blocks_21st_with_plain_message(self):
        for _ in range(settings.TRIAL_CONTRACT_LIMIT):
            Contract.objects.create(lead=self.lead, status="pending")
        response = self.client.post(
            "/api/contracts/", self._contract_payload(), format="multipart")
        self.assertEqual(response.status_code, 400, response.content)
        self.assertIn("20 contract limit", str(response.data))

    def test_non_trial_admin_is_not_quota_limited(self):
        admin = Agent.objects.create_superuser(
            username="cqowner", email="cq@example.com", password="ownerpass123")
        admin_lead = Lead.objects.create(
            full_name="Admin Lead", email="a@example.com",
            property_address="1 Admin St", agent=admin)
        for _ in range(settings.TRIAL_CONTRACT_LIMIT):
            Contract.objects.create(lead=admin_lead, status="pending")
        admin_client = auth_client(admin)
        response = admin_client.post("/api/contracts/", {
            "lead": admin_lead.id, "status": "pending",
            "document": SimpleUploadedFile(
                "contract.pdf", b"%PDF-1.4 dummy", content_type="application/pdf"),
        }, format="multipart")
        self.assertEqual(response.status_code, 201, response.content)

    def test_cannot_create_contract_on_another_agents_lead(self):
        other = make_trial("otherleadowner")
        other_lead = Lead.objects.create(
            full_name="Other Lead", email="o@example.com",
            property_address="1 Other St", agent=other)
        response = self.client.post("/api/contracts/", {
            "lead": other_lead.id, "status": "pending",
            "document": SimpleUploadedFile(
                "contract.pdf", b"%PDF-1.4 dummy", content_type="application/pdf"),
        }, format="multipart")
        self.assertEqual(response.status_code, 400, response.content)
        self.assertEqual(Contract.objects.filter(lead=other_lead).count(), 0)


class CustomFieldQuotaTestCase(TestCase):
    def setUp(self):
        self.trial = make_trial("quotacf")
        self.client = auth_client(self.trial)

    def test_custom_field_quota_blocks_11th_with_plain_message(self):
        for i in range(settings.TRIAL_CUSTOM_FIELD_LIMIT):
            CustomField.objects.create(
                agent=self.trial, name=f"field-{i}", label=f"Field {i}",
                field_type="text")
        response = self.client.post("/api/custom-fields/", {
            "label": "One Too Many", "field_type": "text",
        }, format="json")
        self.assertEqual(response.status_code, 400, response.content)
        self.assertIn("10 custom field limit", str(response.data))

    def test_non_trial_admin_is_not_quota_limited(self):
        admin = Agent.objects.create_superuser(
            username="cfowner", email="cf@example.com", password="ownerpass123")
        for i in range(settings.TRIAL_CUSTOM_FIELD_LIMIT):
            CustomField.objects.create(
                agent=admin, name=f"field-{i}", label=f"Field {i}",
                field_type="text")
        admin_client = auth_client(admin)
        response = admin_client.post("/api/custom-fields/", {
            "label": "Eleventh", "field_type": "text",
        }, format="json")
        self.assertEqual(response.status_code, 201, response.content)


class TrialExpiryLoginTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_expired_trial_is_deleted_and_login_returns_trial_expired_error(self):
        trial = make_trial("expiredtrial")
        backdate(trial, days=settings.TRIAL_DAYS + 1)
        response = self.client.post("/api/token/", {
            "username": "expiredtrial", "password": "trialpass123",
        }, format="json")
        self.assertIn(response.status_code, (400, 401))
        self.assertIn("trial has expired", str(response.data).lower())
        self.assertFalse(Agent.objects.filter(username="expiredtrial").exists())

    def test_expired_trial_cascade_deletes_its_data(self):
        trial = make_trial("expireddata")
        lead = Lead.objects.create(
            full_name="Doomed Lead", email="doomed@example.com",
            property_address="1 Doomed St", agent=trial)
        Contract.objects.create(lead=lead, status="pending")
        CustomField.objects.create(
            agent=trial, name="doomed", label="Doomed", field_type="text")
        backdate(trial, days=settings.TRIAL_DAYS + 1)
        self.client.post("/api/token/", {
            "username": "expireddata", "password": "trialpass123",
        }, format="json")
        self.assertFalse(Lead.objects.filter(agent=trial).exists())
        self.assertFalse(Contract.objects.filter(lead__agent=trial).exists())
        self.assertFalse(CustomField.objects.filter(agent=trial).exists())

    def test_non_expired_trial_logs_in_fine(self):
        make_trial("freshtrial")
        response = self.client.post("/api/token/", {
            "username": "freshtrial", "password": "trialpass123",
        }, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertIn("access", response.data)
        self.assertTrue(Agent.objects.filter(username="freshtrial").exists())

    def test_non_trial_old_account_is_never_deleted_on_login(self):
        admin = Agent.objects.create_superuser(
            username="oldowner", email="old@example.com", password="ownerpass123")
        backdate(admin, days=365)
        response = self.client.post("/api/token/", {
            "username": "oldowner", "password": "ownerpass123",
        }, format="json")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertTrue(Agent.objects.filter(username="oldowner").exists())

    def test_wrong_password_still_returns_auth_error_not_trial_error(self):
        make_trial("badpw")
        response = self.client.post("/api/token/", {
            "username": "badpw", "password": "wrongpassword",
        }, format="json")
        self.assertEqual(response.status_code, 401)
        self.assertNotIn("trial has expired", str(response.data).lower())
        self.assertTrue(Agent.objects.filter(username="badpw").exists())


class CleanupEndpointTestCase(TestCase):
    URL = "/api/admin/cleanup-expired-trials/"

    def setUp(self):
        self.client = APIClient()
        self.expired_trial = make_trial("cleanup-expired")
        backdate(self.expired_trial, days=settings.TRIAL_DAYS + 1)
        self.fresh_trial = make_trial("cleanup-fresh")
        self.old_admin = Agent.objects.create_superuser(
            username="cleanup-owner", email="co@example.com",
            password="ownerpass123")
        backdate(self.old_admin, days=365)
        self.expired_lead = Lead.objects.create(
            full_name="Expired Lead", email="e@example.com",
            property_address="1 Expired St", agent=self.expired_trial)

    def test_missing_token_returns_403(self):
        with patch.dict(os.environ):
            os.environ.pop("CLEANUP_TOKEN", None)
            response = self.client.post(self.URL, {}, format="json")
        self.assertEqual(response.status_code, 403)
        self.assertTrue(Agent.objects.filter(username="cleanup-expired").exists())

    def test_wrong_token_returns_403(self):
        with patch.dict(os.environ, {"CLEANUP_TOKEN": "correct-token"}):
            response = self.client.post(
                self.URL, {}, format="json",
                HTTP_AUTHORIZATION="Bearer wrong-token")
        self.assertEqual(response.status_code, 403)
        self.assertTrue(Agent.objects.filter(username="cleanup-expired").exists())

    def test_unset_env_var_refuses_even_with_a_token(self):
        with patch.dict(os.environ):
            os.environ.pop("CLEANUP_TOKEN", None)
            response = self.client.post(
                self.URL, {}, format="json",
                HTTP_AUTHORIZATION="Bearer anything")
        self.assertEqual(response.status_code, 403)

    def test_correct_token_deletes_only_expired_trials(self):
        with patch.dict(os.environ, {"CLEANUP_TOKEN": "correct-token"}):
            response = self.client.post(
                self.URL, {}, format="json",
                HTTP_AUTHORIZATION="Bearer correct-token")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(response.data["deleted"], 1)
        self.assertFalse(Agent.objects.filter(username="cleanup-expired").exists())
        self.assertFalse(Lead.objects.filter(pk=self.expired_lead.pk).exists())
        # Fresh trial and the non-trial owner survive.
        self.assertTrue(Agent.objects.filter(username="cleanup-fresh").exists())
        self.assertTrue(Agent.objects.filter(username="cleanup-owner").exists())


class DemoEndpointTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_demo_returns_sample_data_with_expected_shape(self):
        response = self.client.get("/api/demo/")
        self.assertEqual(response.status_code, 200, response.content)
        self.assertEqual(set(response.data), {"leads", "contracts", "stats"})
        stats = response.data["stats"]
        self.assertEqual(set(stats), {
            "total_leads", "active_leads", "total_contracts",
            "pending_signature", "leads_by_status"})
        self.assertEqual(stats["total_leads"], len(response.data["leads"]))
        self.assertEqual(stats["total_contracts"], len(response.data["contracts"]))
        self.assertEqual(
            sum(stats["leads_by_status"].values()), stats["total_leads"])
        self.assertEqual(set(stats["leads_by_status"]), {
            "new", "contacted", "qualified", "converted", "lost"})
        self.assertEqual(stats["pending_signature"], sum(
            1 for c in response.data["contracts"] if c["status"] == "pending"))
        for lead in response.data["leads"]:
            self.assertEqual(set(lead), {
                "id", "name", "email", "phone", "property_address", "status",
                "company", "lead_source", "notes", "preferred_contact",
                "created_at"})
            self.assertIn(lead["status"], stats["leads_by_status"])
        for contract in response.data["contracts"]:
            self.assertEqual(set(contract), {
                "id", "lead_name", "status", "created_at"})

    def test_demo_contains_no_real_user_data(self):
        Lead.objects.create(
            full_name="Real Person XYZ", email="real-person-xyz@example.com",
            property_address="99 Real St",
            agent=make_trial("realowner"))
        response = self.client.get("/api/demo/")
        body = str(response.data)
        self.assertNotIn("Real Person XYZ", body)
        self.assertNotIn("real-person-xyz@example.com", body)

    def test_demo_is_get_only(self):
        self.assertEqual(self.client.post("/api/demo/", {}).status_code, 405)
        self.assertEqual(self.client.put("/api/demo/", {}).status_code, 405)
        self.assertEqual(self.client.delete("/api/demo/").status_code, 405)

    def test_demo_is_public_without_auth(self):
        # No credentials set on self.client; GET still returns 200.
        self.assertEqual(self.client.get("/api/demo/").status_code, 200)


class TrialIsolationTestCase(TestCase):
    def test_trial_account_data_invisible_to_another_account(self):
        owner = make_trial("iso-owner")
        other = make_trial("iso-other")
        lead = Lead.objects.create(
            full_name="Private Lead", email="private@example.com",
            property_address="1 Private St", agent=owner)
        contract = Contract.objects.create(lead=lead, status="pending")
        other_client = auth_client(other)

        response = other_client.get("/api/leads/")
        self.assertEqual(response.status_code, 200)
        self.assertNotIn(lead.id, [item["id"] for item in response.data])

        response = other_client.get(f"/api/leads/{lead.id}/")
        self.assertEqual(response.status_code, 404)

        response = other_client.get("/api/contracts/")
        self.assertEqual(response.status_code, 200)
        self.assertNotIn(contract.id, [item["id"] for item in response.data])

        response = other_client.get(f"/api/contracts/{contract.id}/")
        self.assertEqual(response.status_code, 404)

        # The owner still sees their own data.
        owner_client = auth_client(owner)
        self.assertEqual(owner_client.get(f"/api/leads/{lead.id}/").status_code, 200)
        self.assertEqual(
            owner_client.get(f"/api/contracts/{contract.id}/").status_code, 200)
