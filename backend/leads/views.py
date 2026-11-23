# leads/views.py
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.exceptions import ValidationError
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from .models import CustomField, Lead, LeadFormSettings, merge_field_config
from .serializers import CustomFieldSerializer, LeadFormSettingsSerializer, LeadSerializer


def check_trial_quota(user, current_count, limit, message):
    """Raise a plain 400 if a trial account is at its creation limit.

    Non-trial accounts are never limited. Archived records still count
    (they occupy DB rows), so callers must count ALL of the agent's
    records, not just active ones.
    """
    if user.is_trial and current_count >= limit:
        raise ValidationError(message)


class LeadViewSet(viewsets.ModelViewSet):
    serializer_class = LeadSerializer

    def get_queryset(self):
        # Per-agent isolation: an agent only ever sees their own leads.
        # ?all=true includes archived leads; otherwise only active ones.
        qs = Lead.objects.filter(agent=self.request.user)
        if self.request.query_params.get('all') == 'true':
            return qs
        return qs.filter(is_archived=False)

    def perform_create(self, serializer):
        check_trial_quota(
            self.request.user,
            Lead.objects.filter(agent=self.request.user).count(),
            settings.TRIAL_LEAD_LIMIT,
            f"You've reached the {settings.TRIAL_LEAD_LIMIT} lead limit "
            "for a trial account",
        )
        # The lead always belongs to the logged-in agent, never to an
        # agent id supplied in the payload.
        serializer.save(agent=self.request.user)

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
        # Still scoped to the logged-in agent.
        lead = get_object_or_404(Lead, pk=pk, agent=request.user)
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
        check_trial_quota(
            self.request.user,
            CustomField.objects.filter(agent=self.request.user).count(),
            settings.TRIAL_CUSTOM_FIELD_LIMIT,
            f"You've reached the {settings.TRIAL_CUSTOM_FIELD_LIMIT} custom field "
            "limit for a trial account",
        )
        serializer.save(agent=self.request.user)


class LeadFormSettingsView(APIView):
    """Per-agent built-in lead-form field toggles.

    GET  /api/lead-form-settings/ -> {"field_config": {merged config}}
    PUT  /api/lead-form-settings/ {"field_config": {...}} (partial merge)
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        settings_obj, _ = LeadFormSettings.objects.get_or_create(agent=request.user)
        return Response(LeadFormSettingsSerializer(settings_obj).data)

    def put(self, request):
        settings_obj, _ = LeadFormSettings.objects.get_or_create(agent=request.user)
        incoming = request.data.get('field_config') or {}
        # Merge per key: only known fields, only visible/required honoured;
        # keys the client did not send are left untouched.
        stored = dict(settings_obj.field_config or {})
        if isinstance(incoming, dict):
            for key, value in incoming.items():
                if key in merge_field_config({}) and isinstance(value, dict):
                    entry = dict(stored.get(key) or {})
                    if 'visible' in value:
                        entry['visible'] = bool(value['visible'])
                    if 'required' in value:
                        entry['required'] = bool(value['required'])
                    stored[key] = entry
        settings_obj.field_config = stored
        settings_obj.save()
        return Response(LeadFormSettingsSerializer(settings_obj).data)


# ---------------------------------------------------------------------------
# Read-only visitor demo — GET /api/demo/ (public, no writes)
# ---------------------------------------------------------------------------
# Fixed, hardcoded sample data. It is clearly fictional and never comes
# from the database, so no real user's data can ever leak through it.
DEMO_LEADS = [
    {
        "id": 1,
        "name": "Maya Thompson",
        "email": "maya.thompson@example.com",
        "phone": "(555) 214-0187",
        "property_address": "12 Maple Grove Lane, Springfield, IL 62704",
        "status": "new",
        "company": "Maple Grove Realty",
        "lead_source": "referral",
        "notes": "First-time buyer, pre-approved, wants a 3-bed near the park.",
        "preferred_contact": "email",
        "created_at": "2026-11-20T10:00:00Z",
    },
    {
        "id": 2,
        "name": "Jordan Ellis",
        "email": "jordan.ellis@example.com",
        "phone": "(555) 309-4421",
        "property_address": "48 Cedar Hollow Rd, Springfield, IL 62711",
        "status": "contacted",
        "company": "",
        "lead_source": "website",
        "notes": "Called back once; asked for a weekend showing.",
        "preferred_contact": "phone",
        "created_at": "2026-11-19T14:30:00Z",
    },
    {
        "id": 3,
        "name": "Priya Nair",
        "email": "priya.nair@example.com",
        "phone": "(555) 726-9034",
        "property_address": "7 Birchwood Ct, Springfield, IL 62704",
        "status": "qualified",
        "company": "Nair Family Trust",
        "lead_source": "social_media",
        "notes": "Budget confirmed, ready to make an offer this month.",
        "preferred_contact": "either",
        "created_at": "2026-11-18T09:15:00Z",
    },
    {
        "id": 4,
        "name": "Sam Carter",
        "email": "sam.carter@example.com",
        "phone": "(555) 481-2276",
        "property_address": "230 Willow Bend Dr, Springfield, IL 62712",
        "status": "converted",
        "company": "",
        "lead_source": "referral",
        "notes": "Closed on the Willow Bend house — signed and funded.",
        "preferred_contact": "email",
        "created_at": "2026-11-15T11:45:00Z",
    },
    {
        "id": 5,
        "name": "Alex Rivera",
        "email": "alex.rivera@example.com",
        "phone": "(555) 902-1138",
        "property_address": "91 Summit Ave, Springfield, IL 62703",
        "status": "lost",
        "company": "Rivera Properties",
        "lead_source": "advertising",
        "notes": "Went with another agent; keep in touch for next year.",
        "preferred_contact": "email",
        "created_at": "2026-11-12T16:20:00Z",
    },
    {
        "id": 6,
        "name": "Dana Whitfield",
        "email": "dana.whitfield@example.com",
        "phone": "(555) 377-6640",
        "property_address": "5 Larkspur Way, Springfield, IL 62704",
        "status": "new",
        "company": "",
        "lead_source": "walk_in",
        "notes": "Walked in at the open house, interested in condos.",
        "preferred_contact": "phone",
        "created_at": "2026-11-21T08:05:00Z",
    },
]

DEMO_CONTRACTS = [
    {
        "id": 1,
        "lead_name": "Priya Nair",
        "status": "pending",
        "created_at": "2026-11-18T10:00:00Z",
    },
    {
        "id": 2,
        "lead_name": "Sam Carter",
        "status": "signed",
        "created_at": "2026-11-15T12:30:00Z",
    },
]


class DemoView(APIView):
    """GET /api/demo/ — read-only visitor demo (public).

    Returns the fixed sample dataset above. GET only; there is no
    write path, and nothing here touches the database.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        leads_by_status = {s: 0 for s in ('new', 'contacted', 'qualified', 'converted', 'lost')}
        for lead in DEMO_LEADS:
            leads_by_status[lead['status']] += 1
        # Active = still in the pipeline (new / contacted / qualified).
        active_leads = (
            leads_by_status['new'] + leads_by_status['contacted'] + leads_by_status['qualified']
        )
        return Response({
            'leads': DEMO_LEADS,
            'contracts': DEMO_CONTRACTS,
            'stats': {
                'total_leads': len(DEMO_LEADS),
                'active_leads': active_leads,
                'total_contracts': len(DEMO_CONTRACTS),
                'pending_signature': sum(
                    1 for c in DEMO_CONTRACTS if c['status'] == 'pending'
                ),
                'leads_by_status': leads_by_status,
            },
        })


# Public health check — stays open even though the API default
# permission is IsAuthenticated.
@api_view(['GET'])
@permission_classes([AllowAny])
def ping(request):
    return Response({"message": "pong"})
