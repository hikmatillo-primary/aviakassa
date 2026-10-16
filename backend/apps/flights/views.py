from django.db import transaction
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.cash.models import Payment
from apps.cash.serializers import PaymentSerializer

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

    @action(detail=False, methods=['post'], url_path='bulk')
    def bulk_create(self, request):
        """
        Bir nechta partiyani va ixtiyoriy to'lovni bitta atomik tranzaksiyada
        yaratadi. Biror qator xato bersa — hech narsa saqlanmaydi.
        """
        data = request.data or {}
        items = data.get('items') or []
        if not isinstance(items, list) or not items:
            return Response(
                {"items": ["Kamida bitta partiya qatori bo'lishi kerak."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        shared = {
            "supplierId": data.get("supplierId"),
            "purchaseDate": data.get("purchaseDate"),
        }

        created = []
        payment = None
        with transaction.atomic():
            for item in items:
                serializer = self.get_serializer(data={**item, **shared})
                serializer.is_valid(raise_exception=True)
                created.append(serializer.save())

            paid_now = data.get("paidNow") or 0
            if paid_now and float(paid_now) > 0:
                payment_serializer = PaymentSerializer(data={
                    "partnerId": data.get("supplierId"),
                    "type": Payment.PaymentType.EXPENSE,
                    "amount": paid_now,
                    "paymentDate": data.get("purchaseDate") or data.get("saleDate"),
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
