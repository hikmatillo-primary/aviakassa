from rest_framework import viewsets, filters
from .models import Batch
from .serializers import BatchSerializer

class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.select_related('supplier').all().order_by('-created_at')
    serializer_class = BatchSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['batch_number', 'route', 'flight_number', 'supplier__name']
    ordering_fields = ['flight_date', 'created_at', 'remaining_qty']

    def get_queryset(self):
        qs = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs
