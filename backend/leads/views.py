# leads/views.py
from django.http import JsonResponse
from rest_framework import viewsets
from .models import Lead
from .serializers import LeadSerializer

class LeadViewSet(viewsets.ModelViewSet):
    queryset = Lead.objects.all()
    serializer_class = LeadSerializer

def ping(request):
    return JsonResponse({"message": "pong"})