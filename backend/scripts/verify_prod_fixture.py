"""Prod ma'lumot nusxasini lokal sqlite'ga yuklab, hisob-kitobni tekshirish.

Ishlatish (backend papkasidan):
    python scripts/verify_prod_fixture.py ../_prod_fixture.json
"""
import os
import sys

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BASE)
os.chdir(BASE)

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
os.environ.setdefault("DEBUG", "True")
os.environ.setdefault("SECRET_KEY", "verify-only")
os.environ.setdefault("ALLOWED_HOSTS", "localhost,127.0.0.1,testserver")

import django  # noqa: E402
from django.conf import settings  # noqa: E402

tmp_dir = os.path.join(BASE, "_verify_db")
os.makedirs(tmp_dir, exist_ok=True)
settings.DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.sqlite3",
        "NAME": os.path.join(tmp_dir, "prod_copy.sqlite3"),
    }
}
if os.path.exists(settings.DATABASES["default"]["NAME"]):
    os.remove(settings.DATABASES["default"]["NAME"])

django.setup()

from django.core.management import call_command  # noqa: E402

fixture = sys.argv[1] if len(sys.argv) > 1 else os.path.join(BASE, "..", "_prod_fixture.json")
call_command("migrate", verbosity=0, interactive=False)
call_command("loaddata", fixture, verbosity=1)

from apps.cash.models import Payment  # noqa: E402
from apps.flights.models import Batch  # noqa: E402
from apps.partners.models import Partner  # noqa: E402
from apps.sales.models import Sale  # noqa: E402
from django.db.models import F  # noqa: E402

# Deploy paytida bu ikki ma'lumot migratsiyasi ishlaydi (fixture yuklangandan keyin
# bo'lgani uchun shu yerda qo'lda takrorlaymiz).
Batch.objects.filter(return_remaining_qty__isnull=True).update(
    return_remaining_qty=F("remaining_qty")
)
Sale.objects.filter(batch__is_round_trip=True, segment="").update(segment="BOTH")

print(
    "Yuklandi:",
    f"partners={Partner.objects.count()}",
    f"batches={Batch.objects.count()}",
    f"sales={Sale.objects.count()}",
    f"payments={Payment.objects.count()}",
)
call_command("check_integrity")

# ------------------------------------------------------------------
# End-to-end: haqiqiy API yo'llari orqali sotuv yaratish/o'zgartirish/o'chirish
# ------------------------------------------------------------------
from decimal import Decimal  # noqa: E402

from django.contrib.auth import get_user_model  # noqa: E402
from rest_framework.test import APIClient  # noqa: E402

admin = get_user_model().objects.create_user(
    username="verify_admin", password="verify-pass-12345", is_staff=True
)
api = APIClient()
api.force_authenticate(user=admin)

snapshot = api.get("/api/data/snapshot/")
assert snapshot.status_code == 200, snapshot.content
for key in ("partners", "batches", "sales", "payments", "debtOffsets", "accounts"):
    assert key in snapshot.data, f"snapshot'da {key} yo'q"
print("snapshot: OK, kalitlar:", ", ".join(sorted(snapshot.data.keys())))

supplier = Partner.objects.filter(type__in=["SUPPLIER", "BOTH"]).first()
client_partner = Partner.objects.create(name="E2E Client", type="CLIENT")

batch_res = api.post(
    "/api/batches/",
    {
        "supplierId": supplier.id,
        "route": "TAS-E2E",
        "flightDate": "2027-01-15",
        "totalQty": 10,
        "buyPrice": 300,
    },
    format="json",
)
assert batch_res.status_code == 201, batch_res.content
batch_id = batch_res.data["id"]
assert Decimal(str(batch_res.data["totalCost"])) == Decimal("3000.00"), batch_res.data

sale_res = api.post(
    "/api/sales/",
    {
        "batchId": batch_id,
        "clientId": client_partner.id,
        "qty": 3,
        "sellPrice": 400.10,
        "saleDate": "2026-10-01",
    },
    format="json",
)
assert sale_res.status_code == 201, sale_res.content
sale_id = sale_res.data["id"]
assert Decimal(str(sale_res.data["totalAmount"])) == Decimal("1200.30"), sale_res.data
assert Decimal(str(sale_res.data["profit"])) == Decimal("300.30"), sale_res.data

batch = Batch.objects.get(pk=batch_id)
assert batch.remaining_qty == 7, batch.remaining_qty
print("sotuv yaratildi: total=1200.30, profit=300.30, qoldiq=7 — OK")

patch_res = api.patch(f"/api/batches/{batch_id}/", {"buyPrice": 350}, format="json")
assert patch_res.status_code == 200, patch_res.content
sale = Sale.objects.get(pk=sale_id)
assert sale.buy_price == Decimal("350.00"), sale.buy_price
assert sale.profit == Decimal("150.30"), sale.profit
print("tannarx o'zgardi: buy_price=350.00, profit=150.30 — OK")

delete_res = api.delete(f"/api/sales/{sale_id}/")
assert delete_res.status_code == 204, delete_res.content
batch.refresh_from_db()
assert batch.remaining_qty == 10, batch.remaining_qty
print("sotuv o'chirildi: qoldiq=10 — OK")

# E2E ma'lumotlarini tozalab, yakuniy tekshiruv
api.delete(f"/api/batches/{batch_id}/")
client_partner.delete()
call_command("check_integrity")
print("E2E: OK")

# ------------------------------------------------------------------
# Avto-xarid: haftalik generatsiya + hisobga olish
# ------------------------------------------------------------------
supplier.refresh_from_db()
balance_before = supplier.compute_financials()["total_sold_to_us"]

auto_res = api.post(
    "/api/batches/auto/",
    {
        "supplierId": supplier.id,
        "route": "TAS-AUTO",
        "flightNumber": "7Q-AUTO",
        "departureTime": "15:30",
        "arrivalTime": "12:15",
        "isRoundTrip": True,
        "returnFlightNumber": "7Q-AUTO2",
        "returnDepartureTime": "23:10",
        "returnArrivalTime": "06:20",
        "totalQty": 10,
        "buyPrice": 100,
        "flightDate": "2026-11-02",
        "returnDate": "2026-11-15",
        "until": "2026-12-14",
        "intervalDays": 7,
    },
    format="json",
)
assert auto_res.status_code == 201, auto_res.content
created_auto = auto_res.data["created"]
series_id = auto_res.data["seriesId"]
assert len(created_auto) == 7, len(created_auto)
assert all(b["accountedAt"] is None for b in created_auto)
for b in created_auto:
    assert b["isAuto"] is True
    assert b["totalQty"] == 10
    assert float(b["buyPrice"]) == 100.0
print("avto-xarid: 7 ta partiya (02.11 … 14.12), hisobga olinmagan — OK")

supplier.refresh_from_db()
assert supplier.compute_financials()["total_sold_to_us"] == balance_before, "balans o'zgarmasligi kerak"
print("hisobga olinmaguncha balans o'zgarmadi — OK")

account_res = api.post(f"/api/batches/{created_auto[0]['id']}/account/")
assert account_res.status_code == 200, account_res.content
supplier.refresh_from_db()
assert supplier.compute_financials()["total_sold_to_us"] == balance_before + Decimal("1000.00")
print("bitta partiya hisobga olindi: +$1000 — OK")

all_res = api.post("/api/batches/account-all/", {"seriesId": series_id}, format="json")
assert all_res.status_code == 200, all_res.content
assert all_res.data["updated"] == 6, all_res.data
supplier.refresh_from_db()
assert supplier.compute_financials()["total_sold_to_us"] == balance_before + Decimal("7000.00")
print("seriya to'liq hisobga olindi: +$7000 — OK")

# Tozalash (avto-partiyalar)
Batch.objects.filter(series_id=series_id).delete()
call_command("check_integrity")
print("Avto-xarid E2E: OK")


