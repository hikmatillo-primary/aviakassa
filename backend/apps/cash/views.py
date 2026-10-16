from rest_framework import viewsets, filters
from .models import Payment, DebtOffset, CashAccount
from .serializers import PaymentSerializer, DebtOffsetSerializer, CashAccountSerializer


class CashAccountViewSet(viewsets.ModelViewSet):
    queryset = CashAccount.objects.all().order_by('name')
    serializer_class = CashAccountSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'created_at']


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related('partner', 'account').all().order_by('-created_at')
    serializer_class = PaymentSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['partner__name', 'payment_method', 'notes']
    ordering_fields = ['payment_date', 'amount', 'created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        partner_id = self.request.query_params.get('partnerId')
        type_param = self.request.query_params.get('type')
        if partner_id:
            qs = qs.filter(partner_id=partner_id)
        if type_param:
            qs = qs.filter(type=type_param)
        return qs


class DebtOffsetViewSet(viewsets.ModelViewSet):
    queryset = DebtOffset.objects.select_related('from_partner', 'to_partner').all().order_by('-created_at')
    serializer_class = DebtOffsetSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['from_partner__name', 'to_partner__name', 'notes']
    ordering_fields = ['date', 'amount', 'created_at']
