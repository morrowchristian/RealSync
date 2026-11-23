# backend/leads/tests/test_custom_fields.py
# Tests for built-in lead fields, CustomField CRUD/isolation, required
# custom-field validation, and lead-form-settings.
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import Agent
from leads.models import CustomField, Lead, LeadFormSettings


def auth_client(agent):
    client = APIClient()
    refresh = RefreshToken.for_user(agent)
    client.credentials(HTTP_AUTHORIZATION=f'Bearer {refresh.access_token}')
    return client


def lead_payload(agent, **overrides):
    data = {
        "full_name": "Form Lead",
        "email": "form@example.com",
        "phone": "+1 (555) 123-4567",
        "property_address": "9 Form St",
        "status": "new",
        "agent": agent.id,
    }
    data.update(overrides)
    return data


class CustomFieldAPITestCase(TestCase):
    def setUp(self):
        self.agent = Agent.objects.create_user(username="cfuser", password="testpass")
        self.other = Agent.objects.create_user(username="cfother", password="testpass")
        self.client = auth_client(self.agent)
        self.other_client = auth_client(self.other)

    def test_create_auto_slugifies_name_from_label(self):
        response = self.client.post("/api/custom-fields/", {
            "label": "Budget Range", "field_type": "dropdown",
            "options": ["low", "high"], "order": 1,
        }, format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.data["name"], "budget-range")
        self.assertEqual(response.data["agent"], self.agent.id)
        self.assertEqual(response.data["options"], ["low", "high"])

    def test_duplicate_label_appends_suffix(self):
        self.client.post("/api/custom-fields/", {"label": "Notes", "field_type": "text"})
        response = self.client.post("/api/custom-fields/", {"label": "Notes", "field_type": "text"})
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.data["name"], "notes-2")

    def test_same_name_allowed_for_different_agent(self):
        self.client.post("/api/custom-fields/", {"label": "Shared", "field_type": "text"})
        response = self.other_client.post("/api/custom-fields/", {"label": "Shared", "field_type": "text"})
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.data["name"], "shared")

    def test_list_ordered_by_order_then_id_and_scoped_to_agent(self):
        CustomField.objects.create(agent=self.agent, name="b-field", label="B", field_type="text", order=2)
        CustomField.objects.create(agent=self.agent, name="a-field", label="A", field_type="text", order=1)
        CustomField.objects.create(agent=self.other, name="other-field", label="Other", field_type="text", order=0)
        response = self.client.get("/api/custom-fields/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual([f["name"] for f in response.data], ["a-field", "b-field"])

    def test_other_agent_cannot_retrieve_update_or_delete(self):
        field = CustomField.objects.create(agent=self.agent, name="secret", label="Secret", field_type="text")
        for method, url in (
            ("get", f"/api/custom-fields/{field.id}/"),
            ("patch", f"/api/custom-fields/{field.id}/"),
            ("delete", f"/api/custom-fields/{field.id}/"),
        ):
            response = getattr(self.other_client, method)(url, {"label": "Hacked"} if method == "patch" else {})
            self.assertEqual(response.status_code, 404, (method, response.content))
        self.assertTrue(CustomField.objects.filter(pk=field.id).exists())

    def test_delete_is_hard_delete(self):
        field = CustomField.objects.create(agent=self.agent, name="gone", label="Gone", field_type="text")
        response = self.client.delete(f"/api/custom-fields/{field.id}/")
        self.assertEqual(response.status_code, 204)
        self.assertFalse(CustomField.objects.filter(pk=field.id).exists())

    def test_unauthenticated_is_rejected(self):
        response = APIClient().get("/api/custom-fields/")
        self.assertEqual(response.status_code, 401)


class LeadCustomFieldValidationTestCase(TestCase):
    def setUp(self):
        self.agent = Agent.objects.create_user(username="valuser", password="testpass")
        self.other = Agent.objects.create_user(username="valother", password="testpass")
        self.client = auth_client(self.agent)
        self.other_client = auth_client(self.other)

    def test_missing_required_custom_field_returns_400(self):
        CustomField.objects.create(
            agent=self.agent, name="budget", label="Budget",
            field_type="text", required=True,
        )
        response = self.client.post("/api/leads/", lead_payload(self.agent, custom_data={}), format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("Budget", str(response.data))

    def test_present_required_custom_field_returns_201(self):
        CustomField.objects.create(
            agent=self.agent, name="budget", label="Budget",
            field_type="text", required=True,
        )
        response = self.client.post(
            "/api/leads/", lead_payload(self.agent, custom_data={"budget": "$500k"}), format="json")
        self.assertEqual(response.status_code, 201, response.content)
        self.assertEqual(response.data["custom_data"], {"budget": "$500k"})

    def test_required_checkbox_must_be_true(self):
        CustomField.objects.create(
            agent=self.agent, name="consent", label="Consent",
            field_type="checkbox", required=True,
        )
        response = self.client.post(
            "/api/leads/", lead_payload(self.agent, custom_data={"consent": False}), format="json")
        self.assertEqual(response.status_code, 400)
        response = self.client.post(
            "/api/leads/", lead_payload(self.agent, custom_data={"consent": True}), format="json")
        self.assertEqual(response.status_code, 201, response.content)

    def test_other_agents_required_field_does_not_block(self):
        CustomField.objects.create(
            agent=self.other, name="other-req", label="Other Req",
            field_type="text", required=True,
        )
        response = self.client.post("/api/leads/", lead_payload(self.agent))
        self.assertEqual(response.status_code, 201, response.content)

    def test_inactive_required_field_does_not_block(self):
        CustomField.objects.create(
            agent=self.agent, name="old-req", label="Old Req",
            field_type="text", required=True, is_active=False,
        )
        response = self.client.post("/api/leads/", lead_payload(self.agent))
        self.assertEqual(response.status_code, 201, response.content)

    def test_required_validation_applies_on_update(self):
        CustomField.objects.create(
            agent=self.agent, name="budget", label="Budget",
            field_type="text", required=True,
        )
        lead = Lead.objects.create(
            full_name="Up", email="up@example.com", property_address="1 Up St",
            agent=self.agent, custom_data={"budget": "$100k"},
        )
        response = self.client.patch(
            f"/api/leads/{lead.id}/", {"custom_data": {"budget": ""}}, format="json")
        self.assertEqual(response.status_code, 400)

    def test_invalid_phone_rejected(self):
        response = self.client.post("/api/leads/", lead_payload(self.agent, phone="abc!!!"))
        self.assertEqual(response.status_code, 400)
        self.assertIn("phone", response.data)


class LeadBuiltInFieldsTestCase(TestCase):
    def setUp(self):
        self.agent = Agent.objects.create_user(username="builtinuser", password="testpass")
        self.client = auth_client(self.agent)

    def test_create_and_read_back_built_in_fields(self):
        response = self.client.post("/api/leads/", lead_payload(self.agent,
            company="Acme Realty",
            lead_source="referral",
            notes="Prefers mornings.",
            preferred_contact="email",
            custom_data={"budget": "$500k"},
        ), format="json")
        self.assertEqual(response.status_code, 201, response.content)
        lead_id = response.data["id"]
        response = self.client.get(f"/api/leads/{lead_id}/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data["company"], "Acme Realty")
        self.assertEqual(response.data["lead_source"], "referral")
        self.assertEqual(response.data["notes"], "Prefers mornings.")
        self.assertEqual(response.data["preferred_contact"], "email")
        self.assertEqual(response.data["custom_data"], {"budget": "$500k"})

    def test_built_in_fields_default_to_empty(self):
        lead = Lead.objects.create(
            full_name="Plain", email="plain@example.com",
            property_address="1 Plain St", agent=self.agent,
        )
        self.assertEqual(lead.company, "")
        self.assertEqual(lead.lead_source, "")
        self.assertEqual(lead.notes, "")
        self.assertEqual(lead.preferred_contact, "")
        self.assertEqual(lead.custom_data, {})


class LeadFormSettingsTestCase(TestCase):
    def setUp(self):
        self.agent = Agent.objects.create_user(username="settingsuser", password="testpass")
        self.other = Agent.objects.create_user(username="settingsother", password="testpass")
        self.client = auth_client(self.agent)
        self.other_client = auth_client(self.other)

    def test_get_returns_defaults_when_no_row_exists(self):
        response = self.client.get("/api/lead-form-settings/")
        self.assertEqual(response.status_code, 200)
        config = response.data["field_config"]
        self.assertEqual(set(config), {"company", "lead_source", "notes", "preferred_contact", "phone", "property_address"})
        for key, value in config.items():
            self.assertTrue(value["visible"], key)
            self.assertEqual(value["required"], key == "property_address", key)

    def test_put_merges_partial_config(self):
        self.client.put("/api/lead-form-settings/",
                        {"field_config": {"company": {"visible": False}}}, format="json")
        response = self.client.put("/api/lead-form-settings/",
                                   {"field_config": {"phone": {"required": True}}}, format="json")
        self.assertEqual(response.status_code, 200)
        config = response.data["field_config"]
        # Earlier PUT survived (merge, not wipe).
        self.assertFalse(config["company"]["visible"])
        self.assertFalse(config["company"]["required"])
        # New key applied, others untouched.
        self.assertTrue(config["phone"]["visible"])
        self.assertTrue(config["phone"]["required"])
        self.assertTrue(config["property_address"]["required"])
        # GET agrees with PUT.
        response = self.client.get("/api/lead-form-settings/")
        self.assertEqual(response.data["field_config"], config)

    def test_unknown_keys_ignored(self):
        response = self.client.put("/api/lead-form-settings/",
            {"field_config": {
                "full_name": {"visible": False, "required": False},
                "email": {"visible": False},
                "status": {"visible": False},
            }}, format="json")
        self.assertEqual(response.status_code, 200)
        self.assertNotIn("full_name", response.data["field_config"])
        self.assertNotIn("email", response.data["field_config"])
        self.assertNotIn("status", response.data["field_config"])

    def test_settings_are_per_agent(self):
        self.client.put("/api/lead-form-settings/",
                        {"field_config": {"company": {"visible": False}}}, format="json")
        response = self.other_client.get("/api/lead-form-settings/")
        self.assertTrue(response.data["field_config"]["company"]["visible"])
        self.assertEqual(LeadFormSettings.objects.count(), 2)

    def test_unauthenticated_is_rejected(self):
        response = APIClient().get("/api/lead-form-settings/")
        self.assertEqual(response.status_code, 401)
