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

    def __str__(self):
        return f"Contract for {self.lead.full_name} - {self.status}"
