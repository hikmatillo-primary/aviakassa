import logging

from django.db import transaction
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from apps.partners.models import Partner
from apps.flights.models import Batch
from apps.sales.models import Sale
from apps.cash.models import Payment, DebtOffset, account_for_payment_method
from core.db_state import get_active_alias

logger = logging.getLogger(__name__)


def _clean_date(value):
    """Frontenddagi bo'sh qiymatlarni None'ga aylantiradi."""
    if value in (None, "", "-"):
        return None
    return value


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

    created = {"partners": 0, "batches": 0, "sales": 0, "payments": 0, "debtOffsets": 0}

    with transaction.atomic(using=get_active_alias()):
        # 1. Avvalgi ma'lumotlarni bog'liqlik tartibida tozalash
        DebtOffset.objects.all().delete()
        Payment.objects.all().delete()
        Sale.objects.all().delete()
        Batch.objects.all().delete()
        Partner.objects.all().delete()

        # 2. Hamkorlar
        partner_map = {}
        for p in payload.get("partners", []) or []:
            name = (p.get("name") or "").strip()
            if not name:
                continue
            obj = Partner.objects.create(
                name=name,
                type=p.get("type") or "CLIENT",
                tags=p.get("tags") or [],
                phone=p.get("phone") or "",
                notes=p.get("notes") or "",
            )
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
            obj = Batch.objects.create(
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
                buy_price=b.get("buyPrice") or 0,
                status=b.get("status") or "ACTIVE",
                notes=b.get("notes") or "",
            )
            batch_map[b.get("id")] = obj
            created["batches"] += 1

        # 4. Sotuvlar (Sale.save partiyadan qoldiqni avtomatik ayiradi)
        for s in payload.get("sales", []) or []:
            batch = batch_map.get(s.get("batchId"))
            client = partner_map.get(s.get("clientId"))
            sale_date = _clean_date(s.get("saleDate"))
            if not batch or not client or not sale_date:
                continue
            Sale.objects.create(
                batch=batch,
                client=client,
                qty=int(s.get("qty") or 1),
                buy_price=s.get("buyPrice") or batch.buy_price,
                sell_price=s.get("sellPrice") or 0,
                passenger_names=s.get("passengerNames") or "",
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
            created["sales"] += 1

        # 5. Partiyalar qoldig'i va holatini fayldagi qiymatlarga moslash
        for b in payload.get("batches", []) or []:
            obj = batch_map.get(b.get("id"))
            if not obj:
                continue
            remaining = b.get("remainingQty")
            if remaining is None:
                continue
            remaining = max(0, int(remaining))
            status = b.get("status") or ("COMPLETED" if remaining == 0 else "ACTIVE")
            Batch.objects.filter(pk=obj.pk).update(remaining_qty=remaining, status=status)

        # 6. To'lovlar
        for p in payload.get("payments", []) or []:
            partner = partner_map.get(p.get("partnerId"))
            payment_date = _clean_date(p.get("paymentDate"))
            if not partner or not payment_date:
                continue
            Payment.objects.create(
                partner=partner,
                type=p.get("type") or "INCOME",
                amount=p.get("amount") or 0,
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
            DebtOffset.objects.create(
                from_partner=from_partner,
                to_partner=to_partner,
                amount=o.get("amount") or 0,
                date=date,
                notes=o.get("notes") or "",
            )
            created["debtOffsets"] += 1

    logger.warning("ZAXIRA NUSXA TIKLANDI: user=%s created=%s", request.user.username, created)
    return Response({"status": "ok", "detail": "Zaxira nusxa tiklandi.", "created": created})
