from decimal import Decimal
from django.test import TestCase
from apps.partners.models import Partner
from apps.flights.models import Batch


class FlightBatchTests(TestCase):
    def setUp(self):
        self.supplier = Partner.objects.create(
            name="Air Samarkand",
            type=Partner.PartnerType.SUPPLIER
        )

    def test_batch_creation_and_defaults(self):
        batch = Batch.objects.create(
            batch_number="TEST-SAM-01",
            route="Samarqand - Istanbul",
            flight_date="2026-11-01",
            supplier=self.supplier,
            total_qty=20,
            buy_price=Decimal("250.00")
        )
        # remaining_qty avtomatik total_qty ga teng bo'lishi kerak
        self.assertEqual(batch.remaining_qty, 20)
        # total_cost avtomatik buy_price * total_qty bo'lishi kerak
        self.assertEqual(batch.total_cost, Decimal("5000.00"))
        # status ACTIVE bo'lishi kerak
        self.assertEqual(batch.status, Batch.Status.ACTIVE)

    def test_batch_price_update(self):
        batch = Batch.objects.create(
            batch_number="TEST-SAM-02",
            route="Samarqand - Jidda",
            flight_date="2026-11-05",
            supplier=self.supplier,
            total_qty=10,
            buy_price=Decimal("200.00")
        )
        self.assertEqual(batch.total_cost, Decimal("2000.00"))

        # Narx o'zgarganda total_cost qayta hisoblanishi kerak
        batch.buy_price = Decimal("220.00")
        batch.save()
        self.assertEqual(batch.total_cost, Decimal("2200.00"))
