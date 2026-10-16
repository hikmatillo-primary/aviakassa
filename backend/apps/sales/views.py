from django.db import transaction
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.cash.models import Payment
from apps.cash.serializers import PaymentSerializer
from core.db_state import get_active_alias

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

    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk_create(self, request):
        """
        Bir nechta sotuv qatorini va ixtiyoriy to'lovni bitta atomik
        tranzaksiyada yaratadi. Biror qator xato bersa — hech narsa saqlanmaydi.
        """
        data = request.data or {}
        items = data.get('items') or []
        if not isinstance(items, list) or not items:
            return Response(
                {"items": ["Kamida bitta sotuv qatori bo'lishi kerak."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        shared = {
            "clientId": data.get("clientId"),
            "saleDate": data.get("saleDate"),
            "notes": data.get("notes") or "",
        }

        created = []
        payment = None
        with transaction.atomic(using=get_active_alias()):
            for item in items:
                serializer = self.get_serializer(data={**item, **shared})
                serializer.is_valid(raise_exception=True)
                created.append(serializer.save())

            paid_now = data.get("paidNow") or 0
            if paid_now and float(paid_now) > 0:
                payment_serializer = PaymentSerializer(data={
                    "partnerId": data.get("clientId"),
                    "type": Payment.PaymentType.INCOME,
                    "amount": paid_now,
                    "paymentDate": data.get("saleDate"),
                    "paymentMethod": data.get("paymentMethod") or Payment.PaymentMethod.CASH,
                    "notes": data.get("paymentNotes") or data.get("notes") or "",
                })
                payment_serializer.is_valid(raise_exception=True)
                payment = payment_serializer.save()

        return Response(
            {
                "created": self.get_serializer(created, many=True).data,
                "paymentId": getattr(payment, "id", None),
            },
            status=status.HTTP_201_CREATED,
        )
