import os
from django.test import SimpleTestCase

class MigrationFilesTest(SimpleTestCase):
    def test_leads_migrations_exist(self):
        self.assertTrue(os.path.exists('leads/migrations/0001_initial.py'))

    def test_contracts_migrations_exist(self):
        self.assertTrue(os.path.exists('contracts/migrations/0001_initial.py'))

    def test_users_migrations_exist(self):
        self.assertTrue(os.path.exists('users/migrations/0001_initial.py'))