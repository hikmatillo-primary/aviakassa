from rest_framework import viewsets, filters
from .models import Partner
from .serializers import PartnerSerializer

class PartnerViewSet(viewsets.ModelViewSet):
    queryset = Partner.objects.all().order_by('-created_at')
    serializer_class = PartnerSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'phone', 'notes']
    ordering_fields = ['name', 'created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        partner_type = self.request.query_params.get('type')
        if partner_type:
            qs = qs.filter(type__in=[partner_type, 'BOTH'])
        return qs
