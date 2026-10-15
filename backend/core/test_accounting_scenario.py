from decimal import Decimal
from django.contrib.auth import get_user_model
from rest_framework.test import APITestCase
from rest_framework import status

from apps.partners.models import Partner
from apps.flights.models import Batch
from apps.sales.models import Sale
from apps.cash.models import Payment, DebtOffset


class AccountingScenarioTests(APITestCase):
    """To'liq biznes-zanjir: partiya -> sotuv -> to'lov -> o'zaro hisob-kitob."""

    def setUp(self):
        user = get_user_model().objects.create_user(username="acc", password="pass-12345678")
        self.client.force_authenticate(user=user)
        self.supplier = Partner.objects.create(name="Supplier", type=Partner.PartnerType.SUPPLIER)
        self.customer = Partner.objects.create(name="Customer", type=Partner.PartnerType.CLIENT)

    def _post(self, url, payload):
        res = self.client.post(url, payload, format="json")
        self.assertIn(res.status_code, (200, 201), msg=f"{url} -> {res.status_code} {res.data}")
        return res

    def test_full_flow_numbers(self):
        # 1. Partiya: 10 ta, tan narx 300 -> jami 3000
        self._post("/api/batches/", {
            "supplierId": self.supplier.id,
            "route": "TAS - DXB",
            "flightDate": "2026-12-01",
            "totalQty": 10,
            "buyPrice": 300,
        })
        batch = Batch.objects.get()
        self.assertEqual(batch.total_cost, Decimal("3000.00"))
        self.assertEqual(batch.remaining_qty, 10)
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.net_balance, 3000.0)  # biz undan 3000 oldik

        # 2. Sotuv: 4 ta, 400 dan -> 1600, foyda 400
        self._post("/api/sales/", {
            "batchId": batch.id,
            "clientId": self.customer.id,
            "qty": 4,
            "sellPrice": 400,
            "saleDate": "2026-11-20",
        })
        batch.refresh_from_db()
        self.assertEqual(batch.remaining_qty, 6)
        sale = Sale.objects.get()
        self.assertEqual(sale.total_amount, Decimal("1600.00"))
        self.assertEqual(sale.profit, Decimal("400.00"))
        self.assertEqual(sale.buy_price, Decimal("300.00"))
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.net_balance, -1600.0)  # mijoz bizga 1600 qarz

        # 3. Mijozdan 1000 kirim
        self._post("/api/cash/payments/", {
            "partnerId": self.customer.id,
            "type": "INCOME",
            "amount": 1000,
            "paymentDate": "2026-11-21",
            "paymentMethod": "CASH",
        })
        self.customer.refresh_from_db()
        self.assertEqual(self.customer.net_balance, -600.0)

        # 4. Ta'minotchiga 2000 chiqim
        self._post("/api/cash/payments/", {
            "partnerId": self.supplier.id,
            "type": "EXPENSE",
            "amount": 2000,
            "paymentDate": "2026-11-22",
            "paymentMethod": "BANK",
        })
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.net_balance, 1000.0)  # 3000 - 2000

        # 5. O'zaro hisob: mijozning 500 qarzini ta'minotchi hisobiga surish
        self._post("/api/cash/offsets/", {
            "fromPartnerId": self.customer.id,
            "toPartnerId": self.supplier.id,
            "amount": 500,
            "date": "2026-11-23",
        })
        self.customer.refresh_from_db()
        self.supplier.refresh_from_db()
        self.assertEqual(self.customer.net_balance, -100.0)   # 600 - 500
        self.assertEqual(self.supplier.net_balance, 500.0)    # 1000 - 500
        self.assertEqual(self.customer.they_owe_us, 100.0)
        self.assertEqual(self.supplier.we_owe_them, 500.0)

        # 6. Sof foyda va kassa balansi
        total_income = sum(p.amount for p in Payment.objects.filter(type="INCOME"))
        total_expense = sum(p.amount for p in Payment.objects.filter(type="EXPENSE"))
        self.assertEqual(float(total_income), 1000.0)
        self.assertEqual(float(total_expense), 2000.0)
        self.assertEqual(float(total_income - total_expense), -1000.0)
        self.assertEqual(float(Sale.objects.get().profit), 400.0)

    def test_oversell_is_blocked(self):
        self._post("/api/batches/", {
            "supplierId": self.supplier.id,
            "route": "TAS - JED",
            "flightDate": "2026-12-05",
            "totalQty": 2,
            "buyPrice": 500,
        })
        batch = Batch.objects.get()
        res = self.client.post("/api/sales/", {
            "batchId": batch.id,
            "clientId": self.customer.id,
            "qty": 3,
            "sellPrice": 600,
            "saleDate": "2026-11-20",
        }, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Sale.objects.count(), 0)

    def test_qty_edit_keeps_remaining_consistent(self):
        self._post("/api/batches/", {
            "supplierId": self.supplier.id,
            "route": "TAS - IST",
            "flightDate": "2026-12-10",
            "totalQty": 10,
            "buyPrice": 200,
        })
        batch = Batch.objects.get()
        sale = self._post("/api/sales/", {
            "batchId": batch.id,
            "clientId": self.customer.id,
            "qty": 3,
            "sellPrice": 300,
            "saleDate": "2026-11-20",
        }).data
        batch.refresh_from_db()
        self.assertEqual(batch.remaining_qty, 7)

        # Sotuv sonini 3 -> 5 (qo'shimcha 2 ta)
        self.client.patch(f"/api/sales/{sale['id']}/", {"qty": 5}, format="json")
        batch.refresh_from_db()
        self.assertEqual(batch.remaining_qty, 5)

        # Partiya sonini 10 -> 8 (delta -2)
        self.client.patch(f"/api/batches/{batch.id}/", {"totalQty": 8}, format="json")
        batch.refresh_from_db()
        self.assertEqual(batch.remaining_qty, 3)
        self.assertEqual(batch.total_cost, Decimal("1600.00"))  # 8 * 200

    def test_batch_price_change_updates_sale_profit(self):
        self._post("/api/batches/", {
            "supplierId": self.supplier.id,
            "route": "TAS - DXB",
            "flightDate": "2026-12-15",
            "totalQty": 5,
            "buyPrice": 200,
        })
        batch = Batch.objects.get()
        sale = self._post("/api/sales/", {
            "batchId": batch.id,
            "clientId": self.customer.id,
            "qty": 3,
            "sellPrice": 300,
            "saleDate": "2026-11-20",
        }).data
        self.assertEqual(float(Sale.objects.get().profit), 300.0)  # 900 - 600

        # Tan narxni 200 -> 250 qilamiz: foyda 900 - 750 = 150 bo'lishi kerak
        self.client.patch(f"/api/batches/{batch.id}/", {"buyPrice": 250}, format="json")
        sale_obj = Sale.objects.get(pk=sale["id"])
        self.assertEqual(sale_obj.buy_price, Decimal("250.00"))
        self.assertEqual(sale_obj.profit, Decimal("150.00"))
        self.assertEqual(sale_obj.total_amount, Decimal("900.00"))

    def test_cannot_reduce_total_below_sold(self):
        self._post("/api/batches/", {
            "supplierId": self.supplier.id,
            "route": "TAS - KUL",
            "flightDate": "2026-12-20",
            "totalQty": 5,
            "buyPrice": 200,
        })
        batch = Batch.objects.get()
        self._post("/api/sales/", {
            "batchId": batch.id,
            "clientId": self.customer.id,
            "qty": 3,
            "sellPrice": 300,
            "saleDate": "2026-11-20",
        })
        res = self.client.patch(f"/api/batches/{batch.id}/", {"totalQty": 2}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        batch.refresh_from_db()
        self.assertEqual(batch.total_qty, 5)
