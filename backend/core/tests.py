from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from apps.partners.models import Partner
from apps.flights.models import Batch
from apps.sales.models import Sale
from apps.cash.models import Payment, DebtOffset


class DataImportResetAPITests(APITestCase):
    def setUp(self):
        user = get_user_model().objects.create_user(
            username="tester", password="test-pass-12345", is_staff=True
        )
        self.client.force_authenticate(user=user)

    def _sample_payload(self):
        return {
            "partners": [
                {"id": 1, "name": "Vendor A", "type": "SUPPLIER"},
                {"id": 2, "name": "Client B", "type": "CLIENT"},
            ],
            "batches": [
                {
                    "id": 10,
                    "batchNumber": "P00001",
                    "route": "TAS - DXB",
                    "flightDate": "2026-12-01",
                    "supplierId": 1,
                    "totalQty": 10,
                    "remainingQty": 8,
                    "buyPrice": 300,
                    "status": "ACTIVE",
                }
            ],
            "sales": [
                {
                    "id": 100,
                    "batchId": 10,
                    "clientId": 2,
                    "qty": 2,
                    "sellPrice": 400,
                    "saleDate": "2026-10-10",
                }
            ],
            "payments": [
                {
                    "id": 200,
                    "partnerId": 2,
                    "type": "INCOME",
                    "amount": 500,
                    "paymentDate": "2026-11-21",
                    "paymentMethod": "CASH",
                }
            ],
            "debtOffsets": [
                {
                    "id": 300,
                    "fromPartnerId": 2,
                    "toPartnerId": 1,
                    "amount": 100,
                    "date": "2026-11-22",
                }
            ],
        }

    def test_import_data_requires_auth(self):
        self.client.force_authenticate(user=None)
        res = self.client.post("/api/data/import/", self._sample_payload(), format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_import_data_forbidden_for_non_staff(self):
        user = get_user_model().objects.create_user(
            username="regular", password="test-pass-12345", is_staff=False
        )
        self.client.force_authenticate(user=user)
        res = self.client.post("/api/data/import/", self._sample_payload(), format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_reset_data_forbidden_for_non_staff(self):
        user = get_user_model().objects.create_user(
            username="regular2", password="test-pass-12345", is_staff=False
        )
        self.client.force_authenticate(user=user)
        res = self.client.post("/api/data/reset/", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_import_data_replaces_and_remaps(self):
        self.assertEqual(Partner.objects.count(), 0)

        res = self.client.post("/api/data/import/", self._sample_payload(), format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["created"]["partners"], 2)

        self.assertEqual(Partner.objects.count(), 2)
        self.assertEqual(Batch.objects.count(), 1)
        self.assertEqual(Sale.objects.count(), 1)
        self.assertEqual(Payment.objects.count(), 1)
        self.assertEqual(DebtOffset.objects.count(), 1)

        batch = Batch.objects.get()
        self.assertEqual(batch.remaining_qty, 8)
        self.assertEqual(batch.status, Batch.Status.ACTIVE)
        self.assertEqual(batch.total_cost, Decimal("3000.00"))

        sale = Sale.objects.get()
        self.assertEqual(sale.client.name, "Client B")
        self.assertEqual(sale.total_amount, Decimal("800.00"))
        self.assertEqual(sale.profit, Decimal("200.00"))

        # Import idempotent: eski ma'lumotlar almashadi, dublikat qolmaydi
        res2 = self.client.post("/api/data/import/", self._sample_payload(), format="json")
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(Partner.objects.count(), 2)
        self.assertEqual(Sale.objects.count(), 1)

    def test_reset_data_clears_everything(self):
        self.client.post("/api/data/import/", self._sample_payload(), format="json")
        self.assertGreater(Partner.objects.count(), 0)

        res = self.client.post("/api/data/reset/", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

        self.assertEqual(Partner.objects.count(), 0)
        self.assertEqual(Batch.objects.count(), 0)
        self.assertEqual(Sale.objects.count(), 0)
        self.assertEqual(Payment.objects.count(), 0)
        self.assertEqual(DebtOffset.objects.count(), 0)


class BulkSaleAPITests(APITestCase):
    def setUp(self):
        user = get_user_model().objects.create_user(
            username="seller", password="test-pass-12345", is_staff=True
        )
        self.client.force_authenticate(user=user)
        self.supplier = Partner.objects.create(name="Vendor", type="SUPPLIER")
        self.client_partner = Partner.objects.create(name="Client", type="CLIENT")
        self.batch = Batch.objects.create(
            batch_number="P00001",
            route="TAS - DXB",
            flight_date="2026-12-01",
            supplier=self.supplier,
            total_qty=10,
            remaining_qty=10,
            buy_price=Decimal("300.00"),
        )

    def _payload(self, qty=2, paid_now=100):
        return {
            "clientId": self.client_partner.id,
            "saleDate": "2026-10-10",
            "paidNow": paid_now,
            "paymentMethod": "CASH",
            "paymentNotes": "Sotuv to'lovi",
            "items": [
                {"batchId": self.batch.id, "qty": qty, "sellPrice": 400}
            ],
        }

    def test_bulk_creates_sale_and_payment(self):
        res = self.client.post("/api/sales/bulk/", self._payload(), format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(res.data["created"]), 1)
        self.assertIsNotNone(res.data["paymentId"])

        self.assertEqual(Sale.objects.count(), 1)
        self.assertEqual(Payment.objects.count(), 1)
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 8)

    def test_bulk_rolls_back_on_invalid_item(self):
        res = self.client.post("/api/sales/bulk/", self._payload(qty=999), format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Sale.objects.count(), 0)
        self.assertEqual(Payment.objects.count(), 0)
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 10)


class BulkBatchAPITests(APITestCase):
    def setUp(self):
        user = get_user_model().objects.create_user(
            username="buyer", password="test-pass-12345", is_staff=True
        )
        self.client.force_authenticate(user=user)
        self.supplier = Partner.objects.create(name="Vendor", type="SUPPLIER")

    def test_bulk_creates_batches_and_payment(self):
        payload = {
            "supplierId": self.supplier.id,
            "purchaseDate": "2026-11-01",
            "paidNow": 500,
            "paymentMethod": "CASH",
            "paymentNotes": "Xarid to'lovi",
            "items": [
                {"route": "TAS - DXB", "flightDate": "2026-12-01", "totalQty": 10, "buyPrice": 300},
                {"route": "TAS - JED", "flightDate": "2026-12-05", "totalQty": 20, "buyPrice": 400},
            ],
        }
        res = self.client.post("/api/batches/bulk/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(res.data["created"]), 2)
        self.assertIsNotNone(res.data["paymentId"])
        self.assertEqual(Batch.objects.count(), 2)
        self.assertEqual(Payment.objects.count(), 1)


class ProtectedDeleteAPITests(APITestCase):
    def setUp(self):
        user = get_user_model().objects.create_user(
            username="deleter", password="test-pass-12345", is_staff=True
        )
        self.client.force_authenticate(user=user)
        self.supplier = Partner.objects.create(name="Vendor", type="SUPPLIER")
        self.client_partner = Partner.objects.create(name="Client", type="CLIENT")
        self.batch = Batch.objects.create(
            batch_number="P00001",
            route="TAS - DXB",
            flight_date="2026-12-01",
            supplier=self.supplier,
            total_qty=10,
            remaining_qty=10,
            buy_price=Decimal("300.00"),
        )
        Sale.objects.create(
            batch=self.batch,
            client=self.client_partner,
            qty=1,
            buy_price=Decimal("300.00"),
            sell_price=Decimal("400.00"),
            sale_date="2026-11-20",
        )

    def test_delete_batch_with_sales_returns_400(self):
        res = self.client.delete(f"/api/batches/{self.batch.id}/")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Batch.objects.filter(pk=self.batch.id).exists())

    def test_delete_partner_with_relations_returns_400(self):
        res = self.client.delete(f"/api/partners/{self.client_partner.id}/")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Partner.objects.filter(pk=self.client_partner.id).exists())


class BatchStatusReadOnlyTests(APITestCase):
    def setUp(self):
        user = get_user_model().objects.create_user(
            username="editor", password="test-pass-12345", is_staff=True
        )
        self.client.force_authenticate(user=user)
        self.supplier = Partner.objects.create(name="Vendor", type="SUPPLIER")
        self.batch = Batch.objects.create(
            batch_number="P00001",
            route="TAS - DXB",
            flight_date="2026-12-01",
            supplier=self.supplier,
            total_qty=10,
            remaining_qty=10,
            buy_price=Decimal("300.00"),
        )

    def test_status_cannot_be_patched(self):
        res = self.client.patch(
            f"/api/batches/{self.batch.id}/", {"status": "COMPLETED"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.status, Batch.Status.ACTIVE)


class LogoutAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="sessionuser", password="test-pass-12345", is_staff=True
        )

    def test_logout_blacklists_refresh_token(self):
        login = self.client.post(
            "/api/auth/login/",
            {"username": "sessionuser", "password": "test-pass-12345"},
            format="json",
        )
        self.assertEqual(login.status_code, status.HTTP_200_OK)
        access = login.data["access"]
        refresh = login.data["refresh"]

        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {access}")
        out = self.client.post("/api/auth/logout/", {"refresh": refresh}, format="json")
        self.assertEqual(out.status_code, status.HTTP_200_OK)

        # Bekor qilingan refresh token endi ishlamaydi
        self.client.credentials()
        refreshed = self.client.post("/api/auth/refresh/", {"refresh": refresh}, format="json")
        self.assertEqual(refreshed.status_code, status.HTTP_401_UNAUTHORIZED)
