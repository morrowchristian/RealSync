# contracts/views.py
from django.shortcuts import get_object_or_404
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Contract
from .serializers import ContractSerializer

class ContractViewSet(viewsets.ModelViewSet):
    serializer_class = ContractSerializer

    def get_queryset(self):
        # ?all=true includes archived contracts; otherwise only active ones.
        if self.request.query_params.get('all') == 'true':
            return Contract.objects.all()
        return Contract.objects.filter(is_archived=False)

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
        contract = get_object_or_404(Contract, pk=pk)
        contract.is_archived = False
        contract.save()
        return Response({'status': 'restored'})

    def destroy(self, request, *args, **kwargs):
        # Same full-table lookup: an archived signed contract must still
        # hit the 403 guard, not 404. Delete the fetched instance
        # directly — super().destroy() would re-fetch via get_object()
        # and 404 on an archived contract.
        contract = get_object_or_404(Contract, pk=kwargs.get('pk'))
        if contract.status.lower() == 'signed':
            return Response({'error': 'Signed contracts cannot be deleted.'}, status=403)
        self.perform_destroy(contract)
        return Response(status=status.HTTP_204_NO_CONTENT)
