"""Avto-xarid, hisobga olish, vaqtni tarqatish va kategoriya testlari."""
from datetime import date, timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.flights.models import Batch, BatchCategory
from apps.partners.models import Partner


class AutoBatchAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="auto-user", password="test-pass-12345"
        )
        self.client.force_authenticate(user=self.user)
        self.supplier = Partner.objects.create(name="FlyOne Asia", type="SUPPLIER")

    def payload(self, **overrides):
        data = {
            "supplierId": self.supplier.id,
            "route": "FEG — JED",
            "flightNumber": "7Q2703",
            "departureTime": "15:30",
            "arrivalTime": "12:15",
            "isRoundTrip": True,
            "returnFlightNumber": "7Q2702",
            "returnDepartureTime": "23:10",
            "returnArrivalTime": "06:20",
            "baggage": "20kg",
            "totalQty": 60,
            "buyPrice": 300,
            "flightDate": "2026-10-20",
            "returnDate": "2026-11-02",
            "until": "2026-12-31",
            "intervalDays": 7,
        }
        data.update(overrides)
        return data

    def test_weekly_generation_until_date(self):
        res = self.client.post("/api/batches/auto/", self.payload(), format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(res.data["count"], 11)  # 20-okt ... 29-dek

        batches = Batch.objects.order_by("flight_date")
        self.assertEqual(batches.count(), 11)
        self.assertEqual(batches.first().flight_date, date(2026, 10, 20))
        self.assertEqual(batches.last().flight_date, date(2026, 12, 29))

        # Har bir partiya bir xil narx/son va 13 kunlik qaytish oraliği bilan
        for batch in batches:
            self.assertTrue(batch.is_auto)
            self.assertIsNone(batch.accounted_at)
            self.assertEqual(batch.total_qty, 60)
            self.assertEqual(batch.buy_price, Decimal("300.00"))
            self.assertEqual(batch.return_date - batch.flight_date, timedelta(days=13))
            self.assertEqual(batch.series_id, batches.first().series_id)

    def test_duplicate_dates_are_skipped(self):
        self.client.post("/api/batches/auto/", self.payload(), format="json")
        res = self.client.post("/api/batches/auto/", self.payload(), format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(res.data["count"], 0)
        self.assertEqual(len(res.data["skipped"]), 11)
        self.assertEqual(Batch.objects.count(), 11)

    def test_until_before_first_flight_is_rejected(self):
        res = self.client.post(
            "/api/batches/auto/",
            self.payload(until="2026-10-01"),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("until", res.data)

    def test_round_trip_requires_return_date(self):
        res = self.client.post(
            "/api/batches/auto/",
            self.payload(returnDate=None),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("returnDate", res.data)

    def test_max_batches_limit(self):
        res = self.client.post(
            "/api/batches/auto/",
            self.payload(until="2036-12-31"),
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class AccountingTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="account-user", password="test-pass-12345"
        )
        self.client.force_authenticate(user=self.user)
        self.supplier = Partner.objects.create(name="Supplier", type="SUPPLIER")

    def _auto(self, flight_date="2026-11-01", until="2026-11-15"):
        res = self.client.post(
            "/api/batches/auto/",
            {
                "supplierId": self.supplier.id,
                "route": "TAS-JED",
                "flightNumber": "7Q1000",
                "totalQty": 10,
                "buyPrice": 100,
                "flightDate": flight_date,
                "until": until,
                "intervalDays": 7,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        return res.data["created"], res.data["seriesId"]

    def test_auto_batches_are_not_in_balance_until_accounted(self):
        created, series_id = self._auto()
        self.assertEqual(len(created), 3)  # 01, 08, 15 noyabr

        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.compute_financials()["total_sold_to_us"], Decimal("0.00"))

        first = created[0]
        res = self.client.post(f"/api/batches/{first['id']}/account/")
        self.assertEqual(res.status_code, 200, res.data)
        self.assertIsNotNone(res.data["accountedAt"])

        self.supplier.refresh_from_db()
        self.assertEqual(
            self.supplier.compute_financials()["total_sold_to_us"], Decimal("1000.00")
        )

        res = self.client.post(
            "/api/batches/account-all/", {"seriesId": series_id}, format="json"
        )
        self.assertEqual(res.status_code, 200, res.data)
        self.assertEqual(res.data["updated"], 2)
        self.supplier.refresh_from_db()
        self.assertEqual(
            self.supplier.compute_financials()["total_sold_to_us"], Decimal("3000.00")
        )

    def test_manual_batch_is_accounted_immediately(self):
        res = self.client.post(
            "/api/batches/",
            {
                "supplierId": self.supplier.id,
                "route": "TAS-DXB",
                "flightDate": "2026-12-01",
                "totalQty": 5,
                "buyPrice": 200,
            },
            format="json",
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertFalse(res.data["isAuto"])
        self.assertIsNotNone(res.data["accountedAt"])
        self.supplier.refresh_from_db()
        self.assertEqual(
            self.supplier.compute_financials()["total_sold_to_us"], Decimal("1000.00")
        )


class TimePropagationTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="prop-user", password="test-pass-12345"
        )
        self.client.force_authenticate(user=self.user)
        supplier = Partner.objects.create(name="Supplier", type="SUPPLIER")
        self.series_id = "11111111-1111-1111-1111-111111111111"
        self.batches = []
        for index, day in enumerate((1, 8, 15, 22)):
            batch = Batch.objects.create(
                batch_number=f"P-PROP-{index}",
                route="TAS-JED",
                flight_date=date(2026, 11, day),
                flight_number="7Q9000",
                departure_time="10:00",
                arrival_time="14:00",
                supplier=supplier,
                total_qty=10,
                buy_price=Decimal("100.00"),
                is_auto=True,
                series_id=self.series_id,
                accounted_at=None,
            )
            self.batches.append(batch)

    def test_propagates_only_to_future_dates(self):
        middle = self.batches[1]  # 8-noyabr
        res = self.client.patch(
            f"/api/batches/{middle.pk}/",
            {"departureTime": "16:30", "propagateToFuture": True},
            format="json",
        )
        self.assertEqual(res.status_code, 200, res.data)

        for batch in self.batches:
            batch.refresh_from_db()
        self.assertEqual([b.departure_time for b in self.batches], ["10:00", "16:30", "16:30", "16:30"])

    def test_without_flag_only_single_batch_changes(self):
        middle = self.batches[1]
        res = self.client.patch(
            f"/api/batches/{middle.pk}/", {"departureTime": "16:30"}, format="json"
        )
        self.assertEqual(res.status_code, 200, res.data)
        for batch in self.batches:
            batch.refresh_from_db()
        self.assertEqual([b.departure_time for b in self.batches], ["10:00", "16:30", "10:00", "10:00"])


class CategoryTests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="cat-user", password="test-pass-12345"
        )
        self.client.force_authenticate(user=self.user)
        self.supplier = Partner.objects.create(name="Supplier", type="SUPPLIER")

    def test_create_category_and_attach_to_batch(self):
        res = self.client.post("/api/categories/", {"name": "1 oylik"}, format="json")
        self.assertEqual(res.status_code, 201, res.data)
        category_id = res.data["id"]

        batch_res = self.client.post(
            "/api/batches/",
            {
                "supplierId": self.supplier.id,
                "route": "TAS-DXB",
                "flightDate": "2026-12-01",
                "totalQty": 5,
                "buyPrice": 200,
                "categoryId": category_id,
            },
            format="json",
        )
        self.assertEqual(batch_res.status_code, 201, batch_res.data)
        self.assertEqual(batch_res.data["categoryId"], category_id)
        self.assertEqual(batch_res.data["categoryName"], "1 oylik")

        filtered = self.client.get(f"/api/batches/?category={category_id}")
        self.assertEqual(filtered.status_code, 200)
        self.assertEqual(len(filtered.data["results"]), 1)

    def test_snapshot_contains_categories(self):
        BatchCategory.objects.create(name="Yillik")
        res = self.client.get("/api/data/snapshot/")
        self.assertEqual(res.status_code, 200)
        self.assertIn("categories", res.data)
        self.assertEqual(len(res.data["categories"]), 1)
