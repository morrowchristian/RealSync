# contracts/views.py
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Contract
from .serializers import ContractSerializer

class ContractViewSet(viewsets.ModelViewSet):
    queryset = Contract.objects.filter(is_archived=False)
    serializer_class = ContractSerializer

    @action(detail=True, methods=['post'])
    def archive(self, request, pk=None):
        contract = self.get_object()
        contract.is_archived = True
        contract.save()
        return Response({'status': 'archived'})
    
    @action(detail=True, methods=['post'])
    def restore(self, request, pk=None):
        contract = self.get_object()
        contract.is_archived = False
        contract.save()
        return Response({'status': 'restored'})

    def destroy(self, request, *args, **kwargs):
        contract = self.get_object()
        if contract.status.lower() == 'signed':
            return Response({'error': 'Signed contracts cannot be deleted.'}, status=403)
        return super().destroy(request, *args, **kwargs)
