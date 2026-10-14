from decimal import Decimal
from django.test import TestCase
from django.core.exceptions import ValidationError
from apps.partners.models import Partner
from apps.flights.models import Batch
from apps.sales.models import Sale


class SaleModelTests(TestCase):
    def setUp(self):
        self.supplier = Partner.objects.create(
            name="FlyDubai",
            type=Partner.PartnerType.SUPPLIER
        )
        self.client = Partner.objects.create(
            name="Sardor Turizm",
            type=Partner.PartnerType.CLIENT
        )
        self.batch = Batch.objects.create(
            batch_number="TEST-DXB-50",
            route="Toshkent - Dubay",
            flight_date="2026-12-01",
            supplier=self.supplier,
            total_qty=5,
            buy_price=Decimal("300.00")
        )

    def test_sale_creation_and_inventory_deduction(self):
        # 5 ta chiptadan 2 tasini sotamiz
        sale = Sale.objects.create(
            batch=self.batch,
            client=self.client,
            qty=2,
            sell_price=Decimal("400.00"),
            sale_date="2026-11-15"
        )
        # Partiya qoldig'i 3 ta qolishi kerak
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 3)
        self.assertEqual(self.batch.status, Batch.Status.ACTIVE)

        # Foyda: (400 * 2) - (300 * 2) = 800 - 600 = $200
        self.assertEqual(sale.total_amount, Decimal("800.00"))
        self.assertEqual(sale.profit, Decimal("200.00"))

    def test_oversell_prevention(self):
        # Qoldiq 5 ta, 6 ta sotishga urinilganda ValidationError chiqishi kerak
        sale = Sale(
            batch=self.batch,
            client=self.client,
            qty=6,
            sell_price=Decimal("400.00"),
            sale_date="2026-11-15"
        )
        with self.assertRaises(ValidationError):
            sale.clean()
        with self.assertRaises(ValidationError):
            sale.save()

    def test_batch_completes_when_zero_remaining(self):
        # Barcha 5 ta chiptani birdaniga sotamiz
        Sale.objects.create(
            batch=self.batch,
            client=self.client,
            qty=5,
            sell_price=Decimal("400.00"),
            sale_date="2026-11-15"
        )
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 0)
        self.assertEqual(self.batch.status, Batch.Status.COMPLETED)

    def test_sale_quantity_update_adjustment(self):
        # Dastlab 3 ta sotamiz (qoldiq 5 - 3 = 2 qoladi)
        sale = Sale.objects.create(
            batch=self.batch,
            client=self.client,
            qty=3,
            sell_price=Decimal("400.00"),
            sale_date="2026-11-15"
        )
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 2)

        # Sotuv sonini 3 tadan 2 taga kamaytiramiz (1 ta chipta partiyaga qaytishi kerak)
        sale.qty = 2
        sale.save()
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 3)
        self.assertEqual(sale.total_amount, Decimal("800.00"))

        # Endi 2 tadan 4 taga oshiramiz (2 ta chipta qo'shimcha olinishi kerak: 3 - 2 = 1 qoladi)
        sale.qty = 4
        sale.save()
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 1)
        self.assertEqual(sale.total_amount, Decimal("1600.00"))

    def test_sale_deletion_restores_inventory(self):
        # 5 ta chiptani to'liq sotamiz (status COMPLETED bo'ladi)
        sale = Sale.objects.create(
            batch=self.batch,
            client=self.client,
            qty=5,
            sell_price=Decimal("400.00"),
            sale_date="2026-11-15"
        )
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 0)
        self.assertEqual(self.batch.status, Batch.Status.COMPLETED)

        # Sotuv bekor qilinadi (o'chiriladi)
        sale.delete()
        self.batch.refresh_from_db()
        # Qoldiq yana 5 ta bo'lishi va status ACTIVE ga qaytishi kerak!
        self.assertEqual(self.batch.remaining_qty, 5)
        self.assertEqual(self.batch.status, Batch.Status.ACTIVE)
