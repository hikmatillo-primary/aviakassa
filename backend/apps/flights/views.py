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
            "categoryId": data.get("categoryId"),
        }

        created = []
        payment = None
        with transaction.atomic(using=get_active_alias()):
            for item in items:
                serializer = self.get_serializer(data={**item, **shared})
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

        dates = []
        cursor = first_date
        while cursor <= until and len(dates) < MAX_AUTO_BATCHES:
            dates.append(cursor)
            cursor += timedelta(days=interval)
        if len(dates) >= MAX_AUTO_BATCHES and cursor <= until:
            return Response(
                {"until": [f"Bir marta ko'pi bilan {MAX_AUTO_BATCHES} ta partiya yaratiladi. Sanani qisqartiring."]},
                status=status.HTTP_400_BAD_REQUEST,
            )

        db = get_active_alias()
        flight_number = template["flightNumber"].strip()
        skipped = []
        if flight_number:
            existing = set(
                Batch.objects.using(db)
                .filter(flight_number=flight_number, flight_date__in=dates)
                .values_list("flight_date", flat=True)
            )
            skipped = [d for d in dates if d in existing]
            dates = [d for d in dates if d not in existing]

        series_id = uuid.uuid4()
        created = []
        with transaction.atomic(using=db):
            for flight_date in dates:
                batch = Batch(
                    **base,
                    flight_date=flight_date,
                    return_date=(flight_date + timedelta(days=gap)) if gap is not None else None,
                    is_auto=True,
                    accounted_at=None,
                    series_id=series_id,
                    status=Batch.Status.ACTIVE,
                )
                batch.save(using=db)
                created.append(batch)

        return Response(
            {
                "created": self.get_serializer(created, many=True).data,
                "skipped": [d.isoformat() for d in skipped],
                "seriesId": str(series_id),
                "count": len(created),
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'], url_path='account')
    def account(self, request, pk=None):
        """Partiya summasini hamkor qarziga qo'shadi (hisobga oladi)."""
        batch = self.get_object()
        if batch.accounted_at is None:
            batch.accounted_at = timezone.now()
            batch.save(using=get_active_alias(), update_fields=["accounted_at"])
        return Response(self.get_serializer(batch).data)

    @action(detail=False, methods=['post'], url_path='account-all')
    def account_all(self, request):
        """Bir nechta partiyani (yoki butun seriyani) birdan hisobga oladi."""
        data = request.data or {}
        db = get_active_alias()
        qs = Batch.objects.using(db).filter(accounted_at__isnull=True)
        series_id = data.get("seriesId")
        ids = data.get("ids")
        if series_id:
            qs = qs.filter(series_id=series_id)
        elif isinstance(ids, list) and ids:
            qs = qs.filter(pk__in=ids)
        else:
            return Response(
                {"detail": "seriesId yoki ids ko'rsatilishi kerak."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        updated = qs.update(accounted_at=timezone.now())
        return Response({"updated": updated})


class BatchCategoryViewSet(viewsets.ModelViewSet):
    """Xarid turlari («1 oylik», «Yillik», «Namangan» va h.k.)."""

    queryset = BatchCategory.objects.all().order_by('name')
    serializer_class = BatchCategorySerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']
