# leads/models.py
from django.db import models
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

    full_name = models.CharField(max_length=100)
    email = models.EmailField()
    phone = models.CharField(max_length=20, blank=True)
    property_address = models.CharField(max_length=255)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='leads')
    created_at = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return self.full_name
