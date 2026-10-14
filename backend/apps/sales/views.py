from rest_framework import viewsets, filters
from .models import Sale
from .serializers import SaleSerializer

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.select_related('batch', 'client').all().order_by('-created_at')
    serializer_class = SaleSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = [
        'client__name',
        'passenger_names',
        'route',
        'flight_number',
        'batch__batch_number',
    ]
    ordering_fields = ['sale_date', 'created_at', 'total_amount', 'profit']

    def get_queryset(self):
        qs = super().get_queryset()
        batch_id = self.request.query_params.get('batchId')
        client_id = self.request.query_params.get('clientId')
        if batch_id:
            qs = qs.filter(batch_id=batch_id)
        if client_id:
            qs = qs.filter(client_id=client_id)
        return qs
