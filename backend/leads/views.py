# leads/views.py
from django.http import JsonResponse
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Lead
from .serializers import LeadSerializer

class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer

    # Only return non-archived leads by default
    def get_queryset(self):
        return Lead.objects.filter(is_archived=False)

    # Custom action to archive a lead
    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        lead = self.get_object()
        lead.is_archived = True
        lead.save()
        return Response({'status': 'archived'})

def ping(request):
    return JsonResponse({"message": "pong"})
