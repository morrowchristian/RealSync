# leads/views.py
from django.shortcuts import get_object_or_404
from rest_framework import viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CustomField, Lead, LeadFormSettings, merge_field_config
from .serializers import CustomFieldSerializer, LeadFormSettingsSerializer, LeadSerializer

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

class CustomFieldViewSet(viewsets.ModelViewSet):
    """Per-agent custom lead fields. Hard delete on DELETE."""
    serializer_class = CustomFieldSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return CustomField.objects.filter(agent=self.request.user).order_by('order', 'id')

    def perform_create(self, serializer):
        serializer.save(agent=self.request.user)


class LeadFormSettingsView(APIView):
    """Per-agent built-in lead-form field toggles.

    GET  /api/lead-form-settings/ -> {"field_config": {merged config}}
    PUT  /api/lead-form-settings/ {"field_config": {...}} (partial merge)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings, _ = LeadFormSettings.objects.get_or_create(agent=request.user)
        return Response(LeadFormSettingsSerializer(settings).data)

    def put(self, request):
        settings, _ = LeadFormSettings.objects.get_or_create(agent=request.user)
        incoming = request.data.get('field_config') or {}
        # Merge per key: only known fields, only visible/required honoured;
        # keys the client did not send are left untouched.
        stored = dict(settings.field_config or {})
        if isinstance(incoming, dict):
            for key, value in incoming.items():
                if key in merge_field_config({}) and isinstance(value, dict):
                    entry = dict(stored.get(key) or {})
                    if 'visible' in value:
                        entry['visible'] = bool(value['visible'])
                    if 'required' in value:
                        entry['required'] = bool(value['required'])
                    stored[key] = entry
        settings.field_config = stored
        settings.save()
        return Response(LeadFormSettingsSerializer(settings).data)


# Public health check — stays open even though the API default
# permission is IsAuthenticated.
@api_view(['GET'])
@permission_classes([AllowAny])
def ping(request):
    return Response({"message": "pong"})
