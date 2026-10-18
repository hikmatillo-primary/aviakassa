import os
import tempfile
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db import connections
from rest_framework import status
from rest_framework.test import APITestCase

from apps.partners.models import Partner
from apps.flights.models import Batch, BatchCategory
from apps.sales.models import Sale
from apps.cash.models import Payment, DebtOffset, CashAccount

from . import services
from .models import DatabaseRegistry

BUSINESS_MODELS = [BatchCategory, CashAccount, Partner, Batch, Sale, Payment, DebtOffset]


class CategoryNormalizationTests(APITestCase):
    def test_empty_selection_stays_empty(self):
        self.assertEqual(services.normalize_categories({}), set())
        self.assertEqual(services.normalize_categories(None), set())

    def test_sales_pull_batches_and_partners(self):
        self.assertEqual(
            services.normalize_categories({"sales": True}),
            {"sales", "batches", "partners"},
        )

    def test_payments_pull_partners_and_accounts(self):
        self.assertEqual(
            services.normalize_categories({"payments": True}),
            {"payments", "partners", "accounts"},
        )

    def test_partners_only_is_independent(self):
        self.assertEqual(
            services.normalize_categories({"partners": True}), {"partners"}
        )


class RegistryAPITests(APITestCase):
    def setUp(self):
        services.invalidate_active_cache()
        self.admin = get_user_model().objects.create_user(
            username="dbadmin", password="test-pass-12345", is_staff=True
        )

    def test_requires_auth(self):
        res = self.client.get("/api/databases/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_forbidden_for_non_staff(self):
        user = get_user_model().objects.create_user(
            username="regular", password="test-pass-12345", is_staff=False
        )
        self.client.force_authenticate(user=user)
        res = self.client.get("/api/databases/")
        self.assertEqual(res.status_code, status.HTTP_403_FORBIDDEN)

    def test_list_adopts_default_database(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.get("/api/databases/")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["databases"]), 1)
        self.assertTrue(res.data["databases"][0]["isActive"])
        self.assertEqual(res.data["activeId"], res.data["databases"][0]["id"])

    def test_create_requires_name(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post("/api/databases/", {"name": "  "}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_activate_switches_active_flag(self):
        self.client.force_authenticate(user=self.admin)
        services.invalidate_active_cache()
        services.active_db_name()  # asosiy bazani ro'yxatga oladi
        first = DatabaseRegistry.objects.get()
        second = DatabaseRegistry.objects.create(
            name="Ikkinchi", db_name="aviakassa_ikkinchi"
        )

        res = self.client.post(f"/api/databases/{second.id}/activate/", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        first.refresh_from_db()
        second.refresh_from_db()
        self.assertFalse(first.is_active)
        self.assertTrue(second.is_active)
        self.assertEqual(services.active_db_name(), "aviakassa_ikkinchi")

    def test_close_marks_closed_but_keeps_active(self):
        self.client.force_authenticate(user=self.admin)
        services.invalidate_active_cache()
        services.active_db_name()
        obj = DatabaseRegistry.objects.get()
        res = self.client.post(f"/api/databases/{obj.id}/close/", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        obj.refresh_from_db()
        self.assertIsNotNone(obj.closed_at)
        self.assertTrue(obj.is_active)

    def test_activate_missing_returns_404(self):
        self.client.force_authenticate(user=self.admin)
        res = self.client.post("/api/databases/999999/activate/", {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class ActiveDatabaseResolutionTests(APITestCase):
    def setUp(self):
        services.invalidate_active_cache()

    def test_lazy_adoption_creates_single_row(self):
        services.invalidate_active_cache()
        name = services.active_db_name()
        self.assertEqual(name, services.default_db_name())
        self.assertEqual(DatabaseRegistry.objects.count(), 1)
        self.assertTrue(DatabaseRegistry.objects.get().is_active)

        services.invalidate_active_cache()
        services.active_db_name()
        self.assertEqual(DatabaseRegistry.objects.count(), 1)


class CopyDataTests(APITestCase):
    """Kategoriya ko'chirish: PK va created_at saqlanishi."""

    ALIAS = "copy_target"

    @classmethod
    def setUpClass(cls):
        # Alias va jadvalni `super().setUpClass()`dan OLDIN tayyorlaymiz:
        # run_checks class atributini ko'rmaydi, guard ham o'rnatilmaydi.
        cls.tmp = tempfile.NamedTemporaryFile(suffix=".sqlite3", delete=False)
        cls.tmp.close()
        config = dict(connections.databases["default"])
        config["NAME"] = cls.tmp.name
        connections.databases[cls.ALIAS] = config
        cls.databases = {"default", cls.ALIAS}

        conn = connections[cls.ALIAS]
        with conn.schema_editor() as editor:
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
        services.invalidate_active_cache()
        for model in reversed(BUSINESS_MODELS):
            model.objects.using(self.ALIAS).all().delete()

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
        self.account = CashAccount.objects.create(name="Bank hisob raqami")
        Payment.objects.create(
            partner=self.client_partner,
            type="INCOME",
            amount=Decimal("100.00"),
            payment_date="2026-11-21",
            payment_method="CASH",
            account=self.account,
        )
        DebtOffset.objects.create(
            from_partner=self.client_partner,
            to_partner=self.supplier,
            amount=Decimal("50.00"),
            date="2026-11-22",
        )

    def test_copy_selected_preserves_pk_and_created_at(self):
        original_created = Partner.objects.get(pk=self.supplier.pk).created_at
        original_id = self.supplier.pk

        copied = services.copy_selected(
            services.default_db_name(),
            self.ALIAS,
            {"accounts", "partners", "batches", "sales", "payments", "debtOffsets"},
        )

        self.assertEqual(copied["accounts"], 2)
        self.assertEqual(copied["partners"], 2)
        self.assertEqual(copied["batches"], 1)
        self.assertEqual(copied["sales"], 1)
        self.assertEqual(copied["payments"], 1)
        self.assertEqual(copied["debtOffsets"], 1)

        target = Partner.objects.using(self.ALIAS)
        self.assertEqual(target.count(), 2)
        copied_supplier = target.get(pk=original_id)
        self.assertEqual(copied_supplier.name, "Vendor")
        self.assertEqual(copied_supplier.created_at, original_created)

        copied_sale = Sale.objects.using(self.ALIAS).get()
        self.assertEqual(copied_sale.batch_id, self.batch.pk)
        self.assertEqual(copied_sale.client_id, self.client_partner.pk)

        copied_payment = Payment.objects.using(self.ALIAS).get()
        self.assertEqual(copied_payment.account_id, self.account.pk)

    def test_copy_only_selected_categories(self):
        copied = services.copy_selected(
            services.default_db_name(), self.ALIAS, {"partners"}
        )
        self.assertEqual(copied, {"partners": 2})
        self.assertEqual(Sale.objects.using(self.ALIAS).count(), 0)
        self.assertEqual(Partner.objects.using(self.ALIAS).count(), 2)
