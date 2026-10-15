import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "core.settings")
django.setup()

from apps.sales.models import Sale
from apps.flights.models import Batch
from apps.cash.models import Payment, DebtOffset
from apps.partners.models import Partner

def clear_all():
    s = Sale.objects.all().delete()[0]
    b = Batch.objects.all().delete()[0]
    p = Payment.objects.all().delete()[0]
    o = DebtOffset.objects.all().delete()[0]
    pt = Partner.objects.all().delete()[0]
    print(f"Muvaffaqiyatli tozalandi: {s} ta sotuv, {b} ta partiya, {p} ta to'lov, {o} ta qarz surish, {pt} ta hamkor.")

if __name__ == "__main__":
    clear_all()
