import uuid
from datetime import timedelta

from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_date
from rest_framework import filters, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.cash.models import Payment
from apps.cash.serializers import PaymentSerializer
from core.db_state import get_active_alias
from core.money import ZERO, to_money

from .models import Batch, BatchCategory
from .serializers import BatchCategorySerializer, BatchSerializer

MAX_AUTO_BATCHES = 60


class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.select_related('supplier', 'category').all().order_by('-created_at')
    serializer_class = BatchSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['batch_number', 'route', 'flight_number', 'supplier__name']
    ordering_fields = ['flight_date', 'created_at', 'remaining_qty']

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        status_param = params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        category = params.get('category')
        if category:
            qs = qs.filter(category_id=category)

        accounted = params.get('accounted')
        if accounted == 'pending':
            qs = qs.filter(accounted_at__isnull=True)
        elif accounted == 'done':
            qs = qs.filter(accounted_at__isnull=False)

        is_auto = params.get('auto')
        if is_auto == '1':
            qs = qs.filter(is_auto=True)
        elif is_auto == '0':
            qs = qs.filter(is_auto=False)

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
        fallback_category_id = data.get("categoryId")

        created = []
        payment = None
        with transaction.atomic(using=get_active_alias()):
            for item in items:
                item_data = {**shared, **item}
                if "categoryId" not in item_data or item_data["categoryId"] is None:
                    item_data["categoryId"] = fallback_category_id
                serializer = self.get_serializer(data=item_data)
                serializer.is_valid(raise_exception=True)
                created.append(serializer.save())

            paid_now = to_money(data.get("paidNow"), ZERO)
            if paid_now > ZERO:
                payment_serializer = PaymentSerializer(data={
                    "partnerId": data.get("supplierId"),
                    "type": Payment.PaymentType.EXPENSE,
                    "amount": paid_now,
                    "paymentDate": (
                        data.get("purchaseDate")
                        or data.get("saleDate")
                        or timezone.localdate().isoformat()
                    ),
                    "paymentMethod": data.get("paymentMethod") or Payment.PaymentMethod.CASH,
                    "accountId": data.get("accountId"),
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

    @action(detail=False, methods=['post'], url_path='auto')
    def create_auto(self, request):
        """Jadval bo'yicha haftalik avto-xarid partiyalarini yaratadi.

        Birinchi partiyaning barcha parametrlari (reys, vaqt, bagaj, son, narx)
        keyingi partiyalarga 1:1 ko'chiriladi. Qaytish sanasi har bir partiyada
        birinchi partiyadagi oraliq (masalan 13 kun) asosida hisoblanadi.

        Yaratilgan partiyalar `hisobga olinmagan` holatda bo'ladi — hamkor
        qarziga faqat «Hisobga qo'shish» bosilganda qo'shiladi.
        """
        data = request.data or {}
        errors = {}

        first_date = parse_date(str(data.get("flightDate") or ""))
        until = parse_date(str(data.get("until") or ""))
        if not first_date:
            errors["flightDate"] = ["Birinchi uchish sanasi majburiy."]
        if not until:
            errors["until"] = ["Tugash sanasi majburiy."]
        if first_date and until and until < first_date:
            errors["until"] = ["Tugash sanasi birinchi uchish sanasidan keyin bo'lishi kerak."]

        try:
            interval = int(data.get("intervalDays") or 7)
        except (TypeError, ValueError):
            interval = 0
        if not 1 <= interval <= 30:
            errors["intervalDays"] = ["Qadam 1 va 30 kun oralig'ida bo'lishi kerak."]

        is_round_trip = bool(data.get("isRoundTrip"))
        gap = None
        if is_round_trip:
            return_date = parse_date(str(data.get("returnDate") or ""))
            if not return_date:
                errors["returnDate"] = ["Borish-kelish uchun qaytish sanasi majburiy."]
            elif first_date and return_date <= first_date:
                errors["returnDate"] = ["Qaytish sanasi uchish sanasidan keyin bo'lishi kerak."]
            elif first_date:
                gap = (return_date - first_date).days

        if errors:
            return Response(errors, status=status.HTTP_400_BAD_REQUEST)

        template = {
            "supplierId": data.get("supplierId"),
            "route": data.get("route"),
            "flightDate": first_date.isoformat(),
            "flightNumber": data.get("flightNumber") or "",
            "departureTime": data.get("departureTime") or "08:00",
            "arrivalTime": data.get("arrivalTime") or "11:30",
            "isRoundTrip": is_round_trip,
            "returnFlightNumber": data.get("returnFlightNumber") or "",
            "returnDepartureTime": data.get("returnDepartureTime") or "14:00",
            "returnArrivalTime": data.get("returnArrivalTime") or "17:30",
            "baggage": data.get("baggage") or "",
            "totalQty": data.get("totalQty"),
            "buyPrice": data.get("buyPrice"),
            "returnTotalQty": data.get("returnTotalQty"),
            "returnBuyPrice": data.get("returnBuyPrice"),
            "returnBaggage": data.get("returnBaggage") or "",
            "purchaseDate": data.get("purchaseDate") or timezone.localdate().isoformat(),
            "notes": data.get("notes") or "",
            "categoryId": data.get("categoryId"),
        }
        template_serializer = self.get_serializer(data=template)
        template_serializer.is_valid(raise_exception=True)
        base = dict(template_serializer.validated_data)
        # Sanalar har bir partiya uchun alohida hisoblanadi.
        base.pop("flight_date", None)
        base.pop("return_date", None)

        try:
            from . import services
            created, skipped, series_id = services.generate_auto_batches(
                base_data=base,
                first_date=first_date,
                until_date=until,
                interval_days=interval,
                gap_days=gap,
                flight_number=template["flightNumber"],
                db=get_active_alias(),
            )
        except ValueError as exc:
            return Response(
                {"until": [str(exc)]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {
                "created": self.get_serializer(created, many=True).data,
                "skipped": skipped,
                "seriesId": series_id,
                "count": len(created),
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], url_path='account')
    def account(self, request, pk=None):
        """Partiya summasini hamkor qarziga qo'shadi (hisobga oladi)."""
        from . import services
        batch = self.get_object()
        services.account_batch(batch, db=get_active_alias())
        return Response(self.get_serializer(batch).data)

    @action(detail=False, methods=['post'], url_path='account-all')
    def account_all(self, request):
        """Bir nechta partiyani (yoki butun seriyani) birdan hisobga oladi."""
        from . import services
        data = request.data or {}
        try:
            updated = services.account_batches_bulk(
                series_id=data.get("seriesId"),
                ids=data.get("ids"),
                db=get_active_alias(),
            )
        except ValueError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({"updated": updated})


class BatchCategoryViewSet(viewsets.ModelViewSet):
    """Xarid turlari («1 oylik», «Yillik», «Namangan» va h.k.)."""

    queryset = BatchCategory.objects.all().order_by('name')
    serializer_class = BatchCategorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
