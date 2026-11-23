# backend/leads/models.py
from django.db import models
from django.utils.text import slugify
from users.models import Agent
from django.utils import timezone

class Lead(models.Model):
    STATUS_CHOICES = [
        ('new', 'New'),
        ('contacted', 'Contacted'),
        ('qualified', 'Qualified'),
        ('lost', 'Lost'),
        ('converted', 'Converted'),
    ]

    LEAD_SOURCE_CHOICES = [
        ('referral', 'Referral'),
        ('website', 'Website'),
        ('walk_in', 'Walk-in'),
        ('social_media', 'Social Media'),
        ('advertising', 'Advertising'),
        ('other', 'Other'),
    ]

    PREFERRED_CONTACT_CHOICES = [
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('either', 'Either'),
    ]

    full_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    property_address = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='leads')
    created_at = models.DateTimeField(default=timezone.now)
    is_archived = models.BooleanField(default=False)

    # Built-in optional fields (lead-form feature).
    company = models.CharField(max_length=100, blank=True, default='')
    lead_source = models.CharField(max_length=20, blank=True, default='', choices=LEAD_SOURCE_CHOICES)
    notes = models.TextField(blank=True, default='')
    preferred_contact = models.CharField(max_length=20, blank=True, default='', choices=PREFERRED_CONTACT_CHOICES)
    # Custom-field values, keyed by CustomField.name.
    custom_data = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return self.full_name


class CustomField(models.Model):
    """A per-agent custom field that appears on the lead form.

    Values for a lead live in Lead.custom_data, keyed by CustomField.name.
    """

    FIELD_TYPE_CHOICES = [
        ('text', 'Text'),
        ('textarea', 'Textarea'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('email', 'Email'),
        ('phone', 'Phone'),
        ('dropdown', 'Dropdown'),
        ('checkbox', 'Checkbox'),
    ]

    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='custom_fields')
    name = models.CharField(max_length=100)
    label = models.CharField(max_length=100)
    field_type = models.CharField(max_length=20, choices=FIELD_TYPE_CHOICES)
    required = models.BooleanField(default=False)
    options = models.JSONField(default=list, blank=True)
    order = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = [('agent', 'name')]
        ordering = ['order', 'id']

    def __str__(self):
        return f'{self.label} ({self.agent})'

    @classmethod
    def generate_unique_name(cls, agent, label):
        """Slugify `label` into a per-agent-unique `name` ('foo', 'foo-2', ...)."""
        base = slugify(label) or 'field'
        name = base
        suffix = 2
        while cls.objects.filter(agent=agent, name=name).exists():
            name = f'{base}-{suffix}'
            suffix += 1
        return name


# Built-in fields whose visibility/required-ness the lead form can toggle.
# full_name, email (always required + visible) and status (always visible)
# are NOT part of this config.
FORM_CONFIG_FIELDS = ('company', 'lead_source', 'notes', 'preferred_contact', 'phone', 'property_address')

DEFAULT_FIELD_CONFIG = {
    'company': {'visible': True, 'required': False},
    'lead_source': {'visible': True, 'required': False},
    'notes': {'visible': True, 'required': False},
    'preferred_contact': {'visible': True, 'required': False},
    'phone': {'visible': True, 'required': False},
    'property_address': {'visible': True, 'required': True},
}


def merge_field_config(stored):
    """Overlay a stored (possibly partial/unknown-keyed) config on the defaults.

    Unknown keys (e.g. full_name, email, status) are ignored. Per-field,
    only 'visible'/'required' are honoured; anything missing falls back
    to the default for that field.
    """
    merged = {key: dict(value) for key, value in DEFAULT_FIELD_CONFIG.items()}
    if isinstance(stored, dict):
        for key, value in stored.items():
            if key in merged and isinstance(value, dict):
                if 'visible' in value:
                    merged[key]['visible'] = bool(value['visible'])
                if 'required' in value:
                    merged[key]['required'] = bool(value['required'])
    return merged


class LeadFormSettings(models.Model):
    """Per-agent toggles for the built-in lead-form fields."""

    agent = models.OneToOneField(Agent, on_delete=models.CASCADE, related_name='lead_form_settings')
    field_config = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f'Lead form settings ({self.agent})'

    @property
    def merged_config(self):
        return merge_field_config(self.field_config)


class FollowUp(models.Model):
    """A reminder tied to a lead and/or an estimate.

    It lives in the leads app because it is a lead reminder. Both FKs
    are optional: a follow-up can be standalone. The Estimate FK uses
    a lazy 'contracts.Estimate' reference to avoid a circular import
    (contracts.models already imports leads.models).
    """

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='follow_ups', null=True, blank=True)
    estimate = models.ForeignKey('contracts.Estimate', on_delete=models.CASCADE, related_name='follow_ups', null=True, blank=True)
    title = models.CharField(max_length=200)
    due_date = models.DateField()
    completed = models.BooleanField(default=False)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Follow-up #{self.id} - {self.title}"
