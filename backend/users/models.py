import math

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


class Agent(AbstractUser):
    phone = models.CharField(max_length=20, blank=True)
    company = models.CharField(max_length=100, blank=True)
    # True only for accounts created via public signup (/api/register/).
    # The owner account (created by createsuperuser / ensure_superuser)
    # has this False and is never quota-limited or auto-deleted.
    is_trial = models.BooleanField(default=False)

    def __str__(self):
        return self.username

    @property
    def trial_ends_at(self):
        """When the trial expires (date_joined + TRIAL_DAYS), or None."""
        if not self.is_trial:
            return None
        return self.date_joined + timezone.timedelta(days=settings.TRIAL_DAYS)

    @property
    def days_remaining(self):
        """Whole days left in the trial (5 on signup day), 0 once expired.

        None for non-trial accounts.
        """
        if not self.is_trial:
            return None
        delta = self.trial_ends_at - timezone.now()
        return max(0, math.ceil(delta.total_seconds() / 86400))

    @property
    def is_trial_expired(self):
        """True only for trial accounts past their expiry."""
        return self.is_trial and timezone.now() > self.trial_ends_at
