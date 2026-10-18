"""Hisob-kitob invariantlari va ko'p-bazali rejim uchun regressiya testlari."""
import os
import tempfile
from decimal import Decimal
from unittest import mock

from django.contrib.auth import get_user_model
from django.core.management import CommandError, call_command
from django.db import connections
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from apps.cash.models import CashAccount, DebtOffset, Payment
from apps.flights.models import Batch, BatchCategory
from apps.partners.models import Partner
from apps.sales.models import Sale
from core.db_state import reset_active_alias, set_active_alias

BUSINESS_MODELS = [BatchCategory, CashAccount, Partner, Batch, Sale, Payment, DebtOffset]


class MoneyPrecisionTests(TestCase):
    """Pul faqat Decimal bilan hisoblanishi kerak — sentlar yo'qolmasligi kerak."""

    def setUp(self):
        self.supplier = Partner.objects.create(name="Vendor", type="SUPPLIER")
        self.client_partner = Partner.objects.create(name="Client", type="CLIENT")
        self.batch = Batch.objects.create(
            batch_number="P-MONEY-1",
            route="TAS-DXB",
            flight_date="2026-12-01",
            supplier=self.supplier,
            total_qty=10,
            buy_price=Decimal("90.05"),
        )

    def test_cent_precision_is_exact(self):
        sale = Sale.objects.create(
            batch=self.batch,
            client=self.client_partner,
            qty=3,
            sell_price=Decimal("100.10"),
            buy_price=Decimal("90.05"),
            sale_date="2026-11-01",
        )
        sale.refresh_from_db()
        self.assertEqual(sale.total_amount, Decimal("300.30"))
        self.assertEqual(sale.profit, Decimal("30.15"))

    def test_float_input_is_quantized(self):
        # Brauzerdan float kelishi mumkin — natija baribir aniq bo'lishi kerak.
        sale = Sale(
            batch=self.batch,
            client=self.client_partner,
            qty=3,
            sell_price=100.1,
            buy_price=90.05,
            sale_date="2026-11-01",
        )
        sale.save()
        sale.refresh_from_db()
        self.assertEqual(sale.total_amount, Decimal("300.30"))
        self.assertEqual(sale.profit, Decimal("30.15"))

    def test_batch_total_cost_uses_decimal(self):
        batch = Batch.objects.create(
            batch_number="P-MONEY-2",
            route="TAS-IST",
            flight_date="2026-12-02",
            supplier=self.supplier,
            total_qty=3,
            buy_price=Decimal("33.34"),
        )
        batch.refresh_from_db()
        self.assertEqual(batch.total_cost, Decimal("100.02"))

    def test_partner_balance_is_exact(self):
        Sale.objects.create(
            batch=self.batch,
            client=self.client_partner,
            qty=3,
            sell_price=Decimal("100.10"),
            buy_price=Decimal("90.05"),
            sale_date="2026-11-01",
        )
        Payment.objects.create(
            partner=self.client_partner,
            type="INCOME",
            amount=Decimal("100.10"),
            payment_date="2026-11-02",
            payment_method="CASH",
        )
        self.client_partner.refresh_from_db()
        financials = self.client_partner.compute_financials()
        # 300.30 sotuv - 100.10 to'lov = 200.20 qarz (manfiy balans)
        self.assertEqual(financials["balance"], Decimal("-200.20"))
        self.assertEqual(financials["they_owe_us"], Decimal("200.20"))


class BatchPriceChangeTests(APITestCase):
    """Partiya tannarxi o'zgarsa sotuv foydasi ham yangilanishi kerak."""

    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="price-user", password="test-pass-12345"
        )
        self.client.force_authenticate(user=self.user)
        self.supplier = Partner.objects.create(name="Vendor", type="SUPPLIER")
        self.client_partner = Partner.objects.create(name="Client", type="CLIENT")
        self.batch = Batch.objects.create(
            batch_number="P-PRICE-1",
            route="TAS-DXB",
            flight_date="2026-12-01",
            supplier=self.supplier,
            total_qty=10,
            buy_price=Decimal("300.00"),
        )
        self.sale = Sale.objects.create(
            batch=self.batch,
            client=self.client_partner,
            qty=4,
            buy_price=Decimal("300.00"),
            sell_price=Decimal("450.00"),
            sale_date="2026-11-01",
        )

    def test_price_change_recalculates_sale_profit(self):
        self.assertEqual(self.sale.profit, Decimal("600.00"))
        res = self.client.patch(
            f"/api/batches/{self.batch.pk}/",
            {"buyPrice": 350},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.sale.refresh_from_db()
        self.assertEqual(self.sale.buy_price, Decimal("350.00"))
        self.assertEqual(self.sale.profit, Decimal("400.00"))


class MultiDatabaseSaleTests(APITestCase):
    """Faol baza `default` bo'lmasa ham sotuv o'sha bazaga va tranzaksiya ichida yozilishi kerak."""

    ALIAS = "tenant_regression"

    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.NamedTemporaryFile(suffix=".sqlite3", delete=False)
        cls.tmp.close()
        config = dict(connections.databases["default"])
        config["NAME"] = cls.tmp.name
        connections.databases[cls.ALIAS] = config
        cls.databases = {"default", cls.ALIAS}
        with connections[cls.ALIAS].schema_editor() as editor:
            for model in BUSINESS_MODELS:
                editor.create_model(model)
        super().setUpClass()
        cls.addClassCleanup(cls._cleanup_alias)

    @classmethod
    def _cleanup_alias(cls):
        try:
            connections[cls.ALIAS].close()
        except Exception:
            pass
        connections.databases.pop(cls.ALIAS, None)
        try:
            os.unlink(cls.tmp.name)
        except OSError:
            pass

    def setUp(self):
        for model in reversed(BUSINESS_MODELS):
            model.objects.using(self.ALIAS).all().delete()
            model.objects.using("default").all().delete()

    def _create_in_active_db(self):
        supplier = Partner.objects.create(name="Tenant Vendor", type="SUPPLIER")
        client = Partner.objects.create(name="Tenant Client", type="CLIENT")
        batch = Batch.objects.create(
            batch_number="P-TENANT-1",
            route="TAS-DXB",
            flight_date="2026-12-01",
            supplier=supplier,
            total_qty=5,
            buy_price=Decimal("300.00"),
        )
        return client, batch

    def test_sale_is_written_to_active_database_inside_transaction(self):
        token = set_active_alias(self.ALIAS)
        try:
            client, batch = self._create_in_active_db()
            atomic_state = {}

            original_save = Batch.save

            def probe(batch_instance, *args, **kwargs):
                atomic_state["tenant_atomic"] = connections[self.ALIAS].in_atomic_block
                atomic_state["default_atomic"] = connections["default"].in_atomic_block
                return original_save(batch_instance, *args, **kwargs)

            with mock.patch.object(Batch, "save", probe):
                sale = Sale.objects.create(
                    batch=batch,
                    client=client,
                    qty=2,
                    buy_price=Decimal("300.00"),
                    sell_price=Decimal("400.00"),
                    sale_date="2026-11-01",
                )

            self.assertTrue(
                atomic_state.get("tenant_atomic"),
                "Sotuv faol baza ulanishida tranzaksiya ichida yozilishi kerak",
            )
            self.assertTrue(Sale.objects.using(self.ALIAS).filter(pk=sale.pk).exists())
            self.assertFalse(Sale.objects.using("default").filter(pk=sale.pk).exists())
            batch.refresh_from_db()
            self.assertEqual(batch.remaining_qty, 3)
        finally:
            reset_active_alias(token)

    def test_oversell_in_active_database_does_not_write_anything(self):
        token = set_active_alias(self.ALIAS)
        try:
            client, batch = self._create_in_active_db()
            with self.assertRaises(Exception):
                Sale.objects.create(
                    batch=batch,
                    client=client,
                    qty=6,
                    buy_price=Decimal("300.00"),
                    sell_price=Decimal("400.00"),
                    sale_date="2026-11-01",
                )
            self.assertEqual(Sale.objects.using(self.ALIAS).count(), 0)
            batch.refresh_from_db()
            self.assertEqual(batch.remaining_qty, 5)
        finally:
            reset_active_alias(token)


class SnapshotAPITests(APITestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(
            username="snapshot-user", password="test-pass-12345"
        )
        self.supplier = Partner.objects.create(name="Vendor", type="SUPPLIER")
        self.batch = Batch.objects.create(
            batch_number="P-SNAP-1",
            route="TAS-DXB",
            flight_date="2026-12-01",
            supplier=self.supplier,
            total_qty=10,
            buy_price=Decimal("300.00"),
        )

    def test_requires_auth(self):
        res = self.client.get("/api/data/snapshot/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_returns_all_collections(self):
        self.client.force_authenticate(user=self.user)
        res = self.client.get("/api/data/snapshot/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        for key in ("partners", "batches", "sales", "payments", "debtOffsets", "accounts"):
            self.assertIn(key, res.data)
        self.assertEqual(len(res.data["batches"]), 1)

    def test_snapshot_uses_bounded_number_of_queries(self):
        """Snapshot N+1 bo'lib ketmasligi kerak (frontend bitta so'rov qiladi)."""
        from django.db import connection
        from django.test.utils import CaptureQueriesContext

        for index in range(5):
            partner = Partner.objects.create(name=f"Client {index}", type="CLIENT")
            batch = Batch.objects.create(
                batch_number=f"P-SNAP-EXTRA-{index}",
                route="TAS-DXB",
                flight_date="2026-12-02",
                supplier=self.supplier,
                total_qty=5,
                buy_price=Decimal("300.00"),
            )
            Sale.objects.create(
                batch=batch,
                client=partner,
                qty=1,
                buy_price=Decimal("300.00"),
                sell_price=Decimal("400.00"),
                sale_date="2026-11-01",
            )
        self.client.force_authenticate(user=self.user)
        with CaptureQueriesContext(connection) as queries:
            res = self.client.get("/api/data/snapshot/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertLess(len(queries), 20, f"Juda ko'p so'rov: {len(queries)}")


class ImportValidationTests(APITestCase):
    def setUp(self):
        self.admin = get_user_model().objects.create_user(
            username="import-admin", password="test-pass-12345", is_staff=True
        )
        self.client.force_authenticate(user=self.admin)
        self.supplier = Partner.objects.create(name="Vendor", type="SUPPLIER")

    def test_invalid_payload_does_not_delete_existing_data(self):
        res = self.client.post(
            "/api/data/import/",
            {
                "partners": [{"id": 1, "name": "Yangi"}],
                "batches": [{"id": 1, "supplierId": 999, "flightDate": "2026-12-01", "totalQty": 5}],
                "sales": [],
                "payments": [],
                "debtOffsets": [],
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(Partner.objects.filter(pk=self.supplier.pk).exists())

    def test_bad_number_returns_400_not_500(self):
        res = self.client.post(
            "/api/data/import/",
            {
                "partners": [{"id": 1, "name": "Hamkor"}],
                "batches": [
                    {
                        "id": 1,
                        "supplierId": 1,
                        "flightDate": "2026-12-01",
                        "totalQty": "ko'p",
                        "buyPrice": 100,
                    }
                ],
                "sales": [],
                "payments": [],
                "debtOffsets": [],
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("errors", res.data)


class CheckIntegrityCommandTests(TestCase):
    def setUp(self):
        self.supplier = Partner.objects.create(name="Vendor", type="SUPPLIER")
        self.client_partner = Partner.objects.create(name="Client", type="CLIENT")
        self.batch = Batch.objects.create(
            batch_number="P-CHECK-1",
            route="TAS-DXB",
            flight_date="2026-12-01",
            supplier=self.supplier,
            total_qty=5,
            buy_price=Decimal("300.00"),
        )
        Sale.objects.create(
            batch=self.batch,
            client=self.client_partner,
            qty=2,
            buy_price=Decimal("300.00"),
            sell_price=Decimal("400.00"),
            sale_date="2026-11-01",
        )

    def test_valid_data_passes(self):
        call_command("check_integrity", stdout=mock.MagicMock())

    def test_drift_is_detected(self):
        # 2 ta sotilgan, qoldiq 3 bo'lishi kerak — 4 qilib buzamiz (cheklovga tushadi).
        Batch.objects.filter(pk=self.batch.pk).update(remaining_qty=4)
        with self.assertRaises(CommandError):
            call_command("check_integrity", stdout=mock.MagicMock(), stderr=mock.MagicMock())
