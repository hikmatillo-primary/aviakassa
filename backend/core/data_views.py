import logging
from decimal import Decimal, InvalidOperation

from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from rest_framework.response import Response

from apps.partners.models import Partner
from apps.partners.serializers import PartnerSerializer
from apps.flights.models import Batch, BatchCategory
from apps.flights.serializers import BatchCategorySerializer, BatchSerializer
from apps.sales.models import Sale
from apps.sales.serializers import SaleSerializer
from apps.cash.models import Payment, DebtOffset, CashAccount, account_for_payment_method
from apps.cash.serializers import PaymentSerializer, DebtOffsetSerializer, CashAccountSerializer
from core.db_state import get_active_alias
from core.money import ZERO, to_money

logger = logging.getLogger(__name__)


def _clean_date(value):
    """Frontenddagi bo'sh qiymatlarni None'ga aylantiradi."""
    if value in (None, "", "-"):
        return None
    return value


def _as_int(value, field, errors, minimum=None, default=None):
    if value in (None, ""):
        if default is not None:
            return default
        errors.append(f"{field}: qiymat majburiy.")
        return None
    try:
        number = int(value)
    except (TypeError, ValueError):
        errors.append(f"{field}: butun son bo'lishi kerak (kelgan: {value!r}).")
        return None
    if minimum is not None and number < minimum:
        errors.append(f"{field}: kamida {minimum} bo'lishi kerak.")
        return None
    return number


def _as_money(value, field, errors, minimum=Decimal("0")):
    try:
        amount = to_money(value, ZERO)
    except (InvalidOperation, ValueError):
        errors.append(f"{field}: noto'g'ri pul qiymati (kelgan: {value!r}).")
        return None
    if amount < minimum:
        errors.append(f"{field}: manfiy bo'lishi mumkin emas.")
        return None
    return amount


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def snapshot(request):
    """Butun bazani bitta javobda qaytaradi (frontend sahifalab yurmasligi uchun)."""
    partners = (
        Partner.objects.prefetch_related(
            "batches", "sales", "payments", "offsets_from", "offsets_to"
        )
        .all()
        .order_by("-created_at")
    )
    batches = Batch.objects.select_related("supplier").all().order_by("-created_at")
    sales = Sale.objects.select_related("batch", "client").all().order_by("-created_at")
    payments = Payment.objects.select_related("partner", "account").all().order_by("-created_at")
    offsets = DebtOffset.objects.select_related("from_partner", "to_partner").all().order_by("-created_at")
    accounts = CashAccount.objects.all().order_by("name")

    return Response(
        {
            "partners": PartnerSerializer(partners, many=True).data,
            "batches": BatchSerializer(batches, many=True).data,
            "sales": SaleSerializer(sales, many=True).data,
            "payments": PaymentSerializer(payments, many=True).data,
            "debtOffsets": DebtOffsetSerializer(offsets, many=True).data,
            "accounts": CashAccountSerializer(accounts, many=True).data,
            "categories": BatchCategorySerializer(
                BatchCategory.objects.all().order_by("name"), many=True
            ).data,
        }
    )


@api_view(["POST"])
@permission_classes([IsAdminUser])
def reset_data(request):
    """Barcha ma'lumotlarni (hamkorlar, partiyalar, sotuvlar, to'lovlar) o'chiradi."""
    with transaction.atomic(using=get_active_alias()):
        counts = {
            "debtOffsets": DebtOffset.objects.count(),
            "payments": Payment.objects.count(),
            "sales": Sale.objects.count(),
            "batches": Batch.objects.count(),
            "partners": Partner.objects.count(),
        }
        DebtOffset.objects.all().delete()
        Payment.objects.all().delete()
        Sale.objects.all().delete()
        Batch.objects.all().delete()
        Partner.objects.all().delete()
    logger.warning("MA'LUMOTLAR TOZALANDI: user=%s deleted=%s", request.user.username, counts)
    return Response({"status": "ok", "detail": "Barcha ma'lumotlar tozalandi.", "deleted": counts})


def _validate_payload(payload):
    """Import qilinadigan faylni yozishdan OLDIN tekshiradi.

    Xato bo'lsa hech narsa o'chirilmaydi — foydalanuvchi 400 va aniq sabab oladi.
    """
    errors = []
    partners = payload.get("partners") or []
    batches = payload.get("batches") or []
    sales = payload.get("sales") or []
    payments = payload.get("payments") or []
    offsets = payload.get("debtOffsets") or []
    for name, value in (
        ("partners", partners), ("batches", batches), ("sales", sales),
        ("payments", payments), ("debtOffsets", offsets),
    ):
        if not isinstance(value, list):
            errors.append(f"{name}: ro'yxat bo'lishi kerak.")
    if errors:
        return errors

    partner_ids = set()
    for index, p in enumerate(partners, start=1):
        if not isinstance(p, dict):
            errors.append(f"partners[{index}]: obyekt bo'lishi kerak.")
            continue
        if not (p.get("name") or "").strip():
            errors.append(f"partners[{index}]: nom majburiy.")
        partner_ids.add(p.get("id"))

    batch_ids = set()
    for index, b in enumerate(batches, start=1):
        if not isinstance(b, dict):
            errors.append(f"batches[{index}]: obyekt bo'lishi kerak.")
            continue
        if b.get("supplierId") not in partner_ids:
            errors.append(f"batches[{index}]: supplierId topilmadi.")
        if not _clean_date(b.get("flightDate")):
            errors.append(f"batches[{index}]: flightDate majburiy.")
        _as_int(b.get("totalQty"), f"batches[{index}].totalQty", errors, minimum=1)
        _as_money(b.get("buyPrice"), f"batches[{index}].buyPrice", errors)
        batch_ids.add(b.get("id"))

    for index, s in enumerate(sales, start=1):
        if not isinstance(s, dict):
            errors.append(f"sales[{index}]: obyekt bo'lishi kerak.")
            continue
        if s.get("batchId") not in batch_ids:
            errors.append(f"sales[{index}]: batchId topilmadi.")
        if s.get("clientId") not in partner_ids:
            errors.append(f"sales[{index}]: clientId topilmadi.")
        if not _clean_date(s.get("saleDate")):
            errors.append(f"sales[{index}]: saleDate majburiy.")
        _as_int(s.get("qty"), f"sales[{index}].qty", errors, minimum=1)
        _as_money(s.get("sellPrice"), f"sales[{index}].sellPrice", errors)
        if s.get("buyPrice") not in (None, ""):
            _as_money(s.get("buyPrice"), f"sales[{index}].buyPrice", errors)

    for index, p in enumerate(payments, start=1):
        if not isinstance(p, dict):
            errors.append(f"payments[{index}]: obyekt bo'lishi kerak.")
            continue
        if p.get("partnerId") not in partner_ids:
            errors.append(f"payments[{index}]: partnerId topilmadi.")
        if not _clean_date(p.get("paymentDate")):
            errors.append(f"payments[{index}]: paymentDate majburiy.")
        _as_money(p.get("amount"), f"payments[{index}].amount", errors, minimum=Decimal("0.01"))

    for index, o in enumerate(offsets, start=1):
        if not isinstance(o, dict):
            errors.append(f"debtOffsets[{index}]: obyekt bo'lishi kerak.")
            continue
        if o.get("fromPartnerId") not in partner_ids or o.get("toPartnerId") not in partner_ids:
            errors.append(f"debtOffsets[{index}]: hamkor topilmadi.")
        elif o.get("fromPartnerId") == o.get("toPartnerId"):
            errors.append(f"debtOffsets[{index}]: hamkorlar bir xil bo'lishi mumkin emas.")
        if not _clean_date(o.get("date")):
            errors.append(f"debtOffsets[{index}]: date majburiy.")
        _as_money(o.get("amount"), f"debtOffsets[{index}].amount", errors, minimum=Decimal("0.01"))

    return errors


@api_view(["POST"])
@permission_classes([IsAdminUser])
def import_data(request):
    """
    JSON zaxira nusxasini yuklaydi (hozirgi ma'lumotlarni almashtiradi).
    Eski fayl ID'lari yangi yozuvlarga qayta bog'lanadi.
    """
    payload = request.data or {}
    if not isinstance(payload, dict):
        return Response({"status": "error", "detail": "Noto'g'ri format."}, status=400)

    validation_errors = _validate_payload(payload)
    if validation_errors:
        return Response(
            {"status": "error", "detail": "Fayl tekshiruvdan o'tmadi.", "errors": validation_errors[:50]},
            status=400,
        )

    created = {"partners": 0, "batches": 0, "sales": 0, "payments": 0, "debtOffsets": 0}
    db = get_active_alias()

    with transaction.atomic(using=db):
        # 1. Avvalgi ma'lumotlarni bog'liqlik tartibida tozalash
        DebtOffset.objects.using(db).all().delete()
        Payment.objects.using(db).all().delete()
        Sale.objects.using(db).all().delete()
        Batch.objects.using(db).all().delete()
        Partner.objects.using(db).all().delete()

        # 2. Hamkorlar
        partner_map = {}
        for p in payload.get("partners", []) or []:
            name = (p.get("name") or "").strip()
            if not name:
                continue
            obj = Partner(
                name=name,
                type=p.get("type") or "CLIENT",
                tags=p.get("tags") or [],
                phone=p.get("phone") or "",
                notes=p.get("notes") or "",
            )
            obj.save(using=db)
            partner_map[p.get("id")] = obj
            created["partners"] += 1

        # 3. Partiyalar (qoldiqni vaqtincha to'liq qilib yaratamiz)
        batch_map = {}
        for b in payload.get("batches", []) or []:
            supplier = partner_map.get(b.get("supplierId"))
            flight_date = _clean_date(b.get("flightDate"))
            if not supplier or not flight_date:
                continue
            total_qty = int(b.get("totalQty") or 0)
            obj = Batch(
                batch_number=(b.get("batchNumber") or "").strip(),
                route=b.get("route") or "",
                flight_date=flight_date,
                flight_number=b.get("flightNumber") or "",
                departure_time=b.get("departureTime") or "08:00",
                arrival_time=b.get("arrivalTime") or "11:30",
                is_round_trip=bool(b.get("isRoundTrip")),
                return_date=_clean_date(b.get("returnDate")),
                return_flight_number=b.get("returnFlightNumber") or "",
                return_departure_time=b.get("returnDepartureTime") or "14:00",
                return_arrival_time=b.get("returnArrivalTime") or "17:30",
                purchase_date=_clean_date(b.get("purchaseDate")),
                baggage=b.get("baggage") or "20kg",
                supplier=supplier,
                total_qty=total_qty,
                remaining_qty=total_qty,
                return_remaining_qty=total_qty,
                buy_price=to_money(b.get("buyPrice"), ZERO),
                status=b.get("status") or "ACTIVE",
                notes=b.get("notes") or "",
            )
            obj.save(using=db)
            batch_map[b.get("id")] = obj
            created["batches"] += 1

        # 4. Sotuvlar (Sale.save partiyadan qoldiqni avtomatik ayiradi)
        for s in payload.get("sales", []) or []:
            batch = batch_map.get(s.get("batchId"))
            client = partner_map.get(s.get("clientId"))
            sale_date = _clean_date(s.get("saleDate"))
            if not batch or not client or not sale_date:
                continue
            sale = Sale(
                batch=batch,
                client=client,
                qty=int(s.get("qty") or 1),
                buy_price=to_money(s.get("buyPrice"), batch.buy_price),
                sell_price=to_money(s.get("sellPrice"), ZERO),
                passenger_names=s.get("passengerNames") or "",
                segment=s.get("segment") or "",
                sale_date=sale_date,
                route=s.get("route") or "",
                flight_date=_clean_date(s.get("flightDate")),
                flight_number=s.get("flightNumber") or "",
                departure_time=s.get("departureTime") or "",
                arrival_time=s.get("arrivalTime") or "",
                is_round_trip=bool(s.get("isRoundTrip")),
                return_date=_clean_date(s.get("returnDate")),
                return_flight_number=s.get("returnFlightNumber") or "",
                return_departure_time=s.get("returnDepartureTime") or "",
                return_arrival_time=s.get("returnArrivalTime") or "",
                notes=s.get("notes") or "",
            )
            sale.save(using=db)
            created["sales"] += 1

        # 5. Partiyalar qoldig'i (borish/kelish) va holatini fayldagi qiymatlarga moslash
        for b in payload.get("batches", []) or []:
            obj = batch_map.get(b.get("id"))
            if not obj:
                continue
            remaining = b.get("remainingQty")
            ret_remaining = b.get("returnRemainingQty")
            if remaining is None and ret_remaining is None:
                continue
            if remaining is None:
                remaining = obj.remaining_qty
            remaining = max(0, int(remaining))
            is_rt = bool(b.get("isRoundTrip"))
            ret_left = ret_remaining
            if ret_left is None:
                ret_left = obj.return_remaining_qty if obj.return_remaining_qty is not None else remaining
            ret_left = max(0, int(ret_left))
            finished = remaining == 0 and (not is_rt or ret_left == 0)
            status = b.get("status") or ("COMPLETED" if finished else "ACTIVE")
            # Fayldagi status tugallangan desa-yu, qoldiqlar hali bor bo'lsa — tuzatamiz.
            if status == "COMPLETED" and not finished:
                status = "ACTIVE"
            Batch.objects.using(db).filter(pk=obj.pk).update(
                remaining_qty=remaining,
                return_remaining_qty=ret_left,
                status=status,
            )

        # 6. To'lovlar
        for p in payload.get("payments", []) or []:
            partner = partner_map.get(p.get("partnerId"))
            payment_date = _clean_date(p.get("paymentDate"))
            if not partner or not payment_date:
                continue
            Payment.objects.using(db).create(
                partner=partner,
                type=p.get("type") or "INCOME",
                amount=to_money(p.get("amount"), ZERO),
                payment_date=payment_date,
                payment_method=p.get("paymentMethod") or "CASH",
                account=account_for_payment_method(p.get("paymentMethod") or "CASH"),
                notes=p.get("notes") or "",
            )
            created["payments"] += 1

        # 7. O'zaro hisob-kitoblar
        for o in payload.get("debtOffsets", []) or []:
            from_partner = partner_map.get(o.get("fromPartnerId"))
            to_partner = partner_map.get(o.get("toPartnerId"))
            date = _clean_date(o.get("date"))
            if not from_partner or not to_partner or from_partner == to_partner or not date:
                continue
            DebtOffset.objects.using(db).create(
                from_partner=from_partner,
                to_partner=to_partner,
                amount=to_money(o.get("amount"), ZERO),
                date=date,
                notes=o.get("notes") or "",
            )
            created["debtOffsets"] += 1

    logger.warning("ZAXIRA NUSXA TIKLANDI: user=%s created=%s", request.user.username, created)
    return Response({"status": "ok", "detail": "Zaxira nusxa tiklandi.", "created": created})
