# leads/views.py
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import Lead
from .serializers import LeadSerializer

class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer

    def get_queryset(self):
        # ?all=true includes archived leads; otherwise only active ones.
        if self.request.query_params.get('all') == 'true':
            return Lead.objects.all()
        return Lead.objects.filter(is_archived=False)

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        lead = self.get_object()
        lead.is_archived = True
        lead.save()
        return Response({'status': 'archived'})

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        # Look up from the full table, not get_queryset() — an archived
        # lead is excluded from the default queryset, so get_object()
        # would 404 on exactly the item restore is meant to find.
        lead = get_object_or_404(Lead, pk=pk)
        lead.is_archived = False
        lead.save()
        return Response({'status': 'restored'})

# Public health check — stays open even though the API default
# permission is IsAuthenticated.
@api_view(['GET'])
@permission_classes([AllowAny])
def ping(request):
    return Response({"message": "pong"})
