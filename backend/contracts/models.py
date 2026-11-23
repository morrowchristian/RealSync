from django.db import models
from leads.models import Lead
from django.utils import timezone

class Contract(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('signed', 'Signed'),
        ('voided', 'Voided'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='contracts')
    document = models.FileField(upload_to='contracts/')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(default=timezone.now)
    is_archived = models.BooleanField(default=False)

    def __str__(self):
        return f"Contract #{self.id} - {self.status}"


class Estimate(models.Model):
    """A quote sent to a lead — the precursor to a Contract.

    Winning an estimate does NOT auto-create a Contract; a contract is
    only ever created explicitly.
    """

    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('followed_up', 'Followed Up'),
        ('won', 'Won'),
        ('lost', 'Lost'),
    ]

    lead = models.ForeignKey(Lead, on_delete=models.CASCADE, related_name='estimates')
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='sent')
    date_sent = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Estimate #{self.id} - {self.title}"
