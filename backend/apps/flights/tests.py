from decimal import Decimal
from django.test import TestCase
from apps.partners.models import Partner
from apps.flights.models import Batch
from apps.sales.models import Sale


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
        # return_remaining_qty ham avtomatik to'ldiriladi (kelish pooli)
        self.assertEqual(batch.return_remaining_qty, 20)
        # total_cost avtomatik buy_price * total_qty bo'lishi kerak
        self.assertEqual(batch.total_cost, Decimal("5000.00"))
        # status ACTIVE bo'lishi kerak
        self.assertEqual(batch.status, Batch.Status.ACTIVE)

    def test_round_trip_batch_completes_only_when_both_pools_empty(self):
        """Borish-kelish partiyasi faqat ikkala qoldiq ham tugaganda COMPLETED bo'ladi."""
        batch = Batch.objects.create(
            batch_number="TEST-SAM-RT",
            route="Samarqand - Dubay",
            flight_date="2026-11-01",
            is_round_trip=True,
            return_date="2026-11-10",
            supplier=self.supplier,
            total_qty=4,
            buy_price=Decimal("250.00")
        )
        self.assertEqual(batch.return_remaining_qty, 4)

        # Borish tugadi, kelish qoldig'i hali bor — hali COMPLETED emas
        batch.remaining_qty = 0
        batch.recalc_status()
        batch.save(update_fields=["remaining_qty", "status"])
        self.assertEqual(batch.status, Batch.Status.ACTIVE)

        # Kelish ham tugadi — endi COMPLETED
        batch.return_remaining_qty = 0
        batch.recalc_status()
        batch.save(update_fields=["return_remaining_qty", "status"])
        self.assertEqual(batch.status, Batch.Status.COMPLETED)

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

    def test_batch_flight_update_resyncs_sales(self):
        client = Partner.objects.create(name="Mijoz", type=Partner.PartnerType.CLIENT)
        batch = Batch.objects.create(
            batch_number="TEST-SAM-03",
            route="Samarqand - Dubay",
            flight_date="2026-12-01",
            flight_number="HY-101",
            supplier=self.supplier,
            total_qty=10,
            buy_price=Decimal("300.00"),
        )
        sale = Sale.objects.create(
            batch=batch,
            client=client,
            qty=2,
            buy_price=Decimal("300.00"),
            sell_price=Decimal("400.00"),
            sale_date="2026-11-15",
        )
        self.assertEqual(sale.route, "Samarqand - Dubay")
        self.assertEqual(sale.flight_number, "HY-101")

        # Partiya reysi o'zgarsa — undagi sotuvlar ham sinxronlanishi kerak (drift yo'q)
        batch.flight_number = "HY-202"
        batch.route = "Samarqand - Sharja"
        batch.save()
        sale.refresh_from_db()
        self.assertEqual(sale.flight_number, "HY-202")
        self.assertEqual(sale.route, "Samarqand - Sharja")

    def test_sale_qty_change_does_not_trigger_flight_resync(self):
        client = Partner.objects.create(name="Mijoz 2", type=Partner.PartnerType.CLIENT)
        batch = Batch.objects.create(
            batch_number="TEST-SAM-04",
            route="Samarqand - Moskva",
            flight_date="2026-12-05",
            flight_number="U6-303",
            supplier=self.supplier,
            total_qty=10,
            buy_price=Decimal("300.00"),
        )
        sale = Sale.objects.create(
            batch=batch,
            client=client,
            qty=2,
            buy_price=Decimal("300.00"),
            sell_price=Decimal("400.00"),
            sale_date="2026-11-16",
        )
        sale.qty = 3
        sale.save()
        batch.refresh_from_db()
        self.assertEqual(batch.remaining_qty, 7)
        sale.refresh_from_db()
        self.assertEqual(sale.flight_number, "U6-303")

    def test_propagate_to_future_updates_sales_on_future_batches(self):
        import uuid
        from apps.flights.serializers import BatchSerializer

        series_id = uuid.uuid4()
        client = Partner.objects.create(name="Mijoz Propagate", type=Partner.PartnerType.CLIENT)

        b1 = Batch.objects.create(
            batch_number="P00081",
            route="TAS - IST",
            flight_date="2026-11-01",
            flight_number="TK-101",
            departure_time="08:00",
            supplier=self.supplier,
            total_qty=10,
            buy_price=Decimal("300.00"),
            series_id=series_id,
        )
        b2 = Batch.objects.create(
            batch_number="P00082",
            route="TAS - IST",
            flight_date="2026-11-08",
            flight_number="TK-101",
            departure_time="08:00",
            supplier=self.supplier,
            total_qty=10,
            buy_price=Decimal("300.00"),
            series_id=series_id,
        )
        sale_b2 = Sale.objects.create(
            batch=b2,
            client=client,
            qty=1,
            buy_price=Decimal("300.00"),
            sell_price=Decimal("400.00"),
            sale_date="2026-10-25",
        )
        self.assertEqual(sale_b2.flight_number, "TK-101")

        serializer = BatchSerializer(
            instance=b1,
            data={"flightNumber": "TK-999", "propagateToFuture": True},
            partial=True,
        )
        self.assertTrue(serializer.is_valid(), serializer.errors)
        serializer.save()

        b2.refresh_from_db()
        self.assertEqual(b2.flight_number, "TK-999")
        sale_b2.refresh_from_db()
        self.assertEqual(sale_b2.flight_number, "TK-999")

    def test_batch_number_auto_generation_avoids_collision(self):
        b1 = Batch.objects.create(
            batch_number="",
            route="TAS - DXB",
            flight_date="2026-12-10",
            supplier=self.supplier,
            total_qty=10,
            buy_price=Decimal("200.00"),
        )
        self.assertTrue(b1.batch_number.startswith("P"))

        # Yangi partiya bo'sh raqam bilan yaratilganda avtomatik unikal raqam oladi
        b2 = Batch.objects.create(
            batch_number="",
            route="TAS - DXB",
            flight_date="2026-12-17",
            supplier=self.supplier,
            total_qty=10,
            buy_price=Decimal("200.00"),
        )
        self.assertNotEqual(b1.batch_number, b2.batch_number)

    def test_account_and_unaccount_batch(self):
        from apps.flights import services
        b = Batch.objects.create(
            batch_number="TEST-ACC-01",
            route="TAS - JED",
            flight_date="2026-12-10",
            supplier=self.supplier,
            total_qty=10,
            buy_price=Decimal("200.00"),
            is_auto=True,
            accounted_at=None,
        )
        self.assertIsNone(b.accounted_at)

        # Hisobga olish
        services.account_batch(b)
        b.refresh_from_db()
        self.assertIsNotNone(b.accounted_at)

        # Hisobdan chiqarish
        services.unaccount_batch(b)
        b.refresh_from_db()
        self.assertIsNone(b.accounted_at)

