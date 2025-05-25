# backend/tests/base_crud.py
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken
from users.models import Agent

class BaseCRUDTestCase(APITestCase):
    model = None  # To be set by child classes
    endpoint = ""  # To be set by child classes (e.g., 'leads' or 'contracts')

    def setUp(self):
        self.agent = Agent.objects.create_user(username=f"{self.endpoint}_tester", password="testpass")
        refresh = RefreshToken.for_user(self.agent)
        self.access_token = str(refresh.access_token)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.access_token}')
        self.instance = self.create_instance()

    def create_instance(self):
        raise NotImplementedError("Subclasses must implement create_instance")

    def test_get_single(self):
        response = self.client.get(f"/api/{self.endpoint}/{self.instance.id}/")
        self.assertEqual(response.status_code, 200)

    def test_archive(self):
        response = self.client.post(f"/api/{self.endpoint}/{self.instance.id}/archive/")
        self.assertEqual(response.status_code, 200)
        self.instance.refresh_from_db()
        self.assertTrue(self.instance.is_archived)

    def test_restore(self):
        self.instance.is_archived = True
        self.instance.save()
        response = self.client.post(f"/api/{self.endpoint}/{self.instance.id}/restore/")
        self.assertEqual(response.status_code, 200)
        self.instance.refresh_from_db()
        self.assertFalse(self.instance.is_archived)
