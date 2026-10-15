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
            username="tester", password="test-pass-12345"
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
                    "saleDate": "2026-11-20",
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
