"""Create the initial superuser from environment variables, if missing.

Reads DJANGO_SUPERUSER_USERNAME, DJANGO_SUPERUSER_EMAIL and
DJANGO_SUPERUSER_PASSWORD. If any of them is unset, or the user already
exists, this is a no-op — so it is safe to run on every deploy (the
Render build command runs it after migrate). This exists because the
free Render plan has no shell access, so `createsuperuser` cannot be
run on the deployed service directly.

Set the three variables in the Render dashboard (Environment tab) and
redeploy; then log in with that username/password. Change the password
later in the Django admin if you want.
"""

import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Create the initial superuser from env vars if it does not exist."

    def handle(self, *args, **options):
        username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL", "")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")

        if not username or not password:
            self.stdout.write(
                "ensure_superuser: DJANGO_SUPERUSER_USERNAME or "
                "DJANGO_SUPERUSER_PASSWORD not set, skipping."
            )
            return

        User = get_user_model()
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                f"ensure_superuser: user '{username}' already exists, skipping."
            )
            return

        User.objects.create_superuser(
            username=username, email=email, password=password
        )
        self.stdout.write(f"ensure_superuser: created superuser '{username}'.")
