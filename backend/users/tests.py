from django.test import TestCase
from django.contrib.admin.sites import site
from django.contrib.auth import get_user_model

Agent = get_user_model()

class AgentAdminTest(TestCase):
    def test_agent_model_registered_in_admin(self):
        self.assertIn(Agent, site._registry)

    def test_useradmin_is_used(self):
        from django.contrib.auth.admin import UserAdmin
        self.assertIsInstance(site._registry[Agent], UserAdmin)
