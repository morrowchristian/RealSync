from django.contrib import admin
from .models import FollowUp, Lead  # or Contract

admin.site.register(Lead)
admin.site.register(FollowUp)
