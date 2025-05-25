# backend/tests/test_general.py
from backend.tests.base_api import BaseAPITestCase
from rest_framework import status

class GeneralTests(BaseAPITestCase):
    def test_ping(self):
        response = self.client.get('/api/ping/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], 'pong')

    def test_protected_access(self):
        response = self.client.get('/api/leads/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
