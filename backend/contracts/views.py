# contracts/views.py
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import ValidationError
from rest_framework.response import Response
from leads.views import check_trial_quota
from .models import Contract
from .serializers import ContractSerializer

class ContractViewSet(viewsets.ModelViewSet):
    serializer_class = ContractSerializer

    def get_queryset(self):
        # Per-agent isolation: an agent only ever sees contracts on
        # their own leads. ?all=true includes archived contracts.
        qs = Contract.objects.filter(lead__agent=self.request.user)
        if self.request.query_params.get('all') == 'true':
            return qs
        return qs.filter(is_archived=False)

    def perform_create(self, serializer):
        lead = serializer.validated_data['lead']
        if lead.agent != self.request.user:
            raise ValidationError('You can only create contracts for your own leads.')
        check_trial_quota(
            self.request.user,
            Contract.objects.filter(lead__agent=self.request.user).count(),
            settings.TRIAL_CONTRACT_LIMIT,
            f"You've reached the {settings.TRIAL_CONTRACT_LIMIT} contract limit "
            "for a trial account",
        )
        serializer.save()

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        contract = self.get_object()
        contract.is_archived = True
        contract.save()
        return Response({'status': 'archived'})

    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        # Look up from the full table, not get_queryset() — an archived
        # contract is excluded from the default queryset, so get_object()
        # would 404 on exactly the item restore is meant to find.
        # Still scoped to the logged-in agent's leads.
        contract = get_object_or_404(
            Contract, pk=pk, lead__agent=request.user)
        contract.is_archived = False
        contract.save()
        return Response({'status': 'restored'})

    def destroy(self, request, *args, **kwargs):
        # Same full-table lookup: an archived signed contract must still
        # hit the 403 guard, not 404. Delete the fetched instance
        # directly — super().destroy() would re-fetch via get_object()
        # and 404 on an archived contract.
        contract = get_object_or_404(
            Contract, pk=kwargs.get('pk'), lead__agent=request.user)
        if contract.status.lower() == 'signed':
            return Response({'error': 'Signed contracts cannot be deleted.'}, status=403)
        self.perform_destroy(contract)
        return Response(status=status.HTTP_204_NO_CONTENT)
