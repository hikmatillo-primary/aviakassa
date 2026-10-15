from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from apps.partners.models import Partner
from apps.flights.models import Batch
from apps.sales.models import Sale
from apps.cash.models import Payment, DebtOffset


class CashModelTests(TestCase):
    def setUp(self):
        self.partner_a = Partner.objects.create(
            name="Hamkor A (Vendor)",
            type=Partner.PartnerType.SUPPLIER
        )
        self.partner_b = Partner.objects.create(
            name="Hamkor B (Agent)",
            type=Partner.PartnerType.CLIENT
        )

    def test_payment_creation(self):
        income = Payment.objects.create(
            partner=self.partner_b,
            type=Payment.PaymentType.INCOME,
            amount=Decimal("500.00"),
            payment_date="2026-10-25",
            payment_method=Payment.PaymentMethod.NAQD_USD
        )
        self.assertEqual(income.type, Payment.PaymentType.INCOME)
        self.assertEqual(self.partner_b.total_paid_to_us, 500.0)

        expense = Payment.objects.create(
            partner=self.partner_a,
            type=Payment.PaymentType.EXPENSE,
            amount=Decimal("1200.00"),
            payment_date="2026-10-25",
            payment_method=Payment.PaymentMethod.BANK_KARTA
        )
        self.assertEqual(expense.type, Payment.PaymentType.EXPENSE)
        self.assertEqual(self.partner_a.total_paid_by_us, 1200.0)

    def test_debt_offset_creation(self):
        offset = DebtOffset.objects.create(
            from_partner=self.partner_b,
            to_partner=self.partner_a,
            amount=Decimal("750.00"),
            date="2026-10-26",
            notes="Agent qarzini aviakompaniyaga surish"
        )
        self.assertEqual(offset.amount, Decimal("750.00"))
        self.assertEqual(self.partner_b.total_offset_from, 750.0)
        self.assertEqual(self.partner_a.total_offset_to, 750.0)


class CashAPITests(APITestCase):
    def setUp(self):
        user = get_user_model().objects.create_user(
            username="tester", password="test-pass-12345"
        )
        self.client.force_authenticate(user=user)
        self.supplier = Partner.objects.create(
            name="Uzbekistan Airways",
            type=Partner.PartnerType.SUPPLIER
        )
        self.client_partner = Partner.objects.create(
            name="Shashlik Travel",
            type=Partner.PartnerType.CLIENT
        )
        self.batch = Batch.objects.create(
            batch_number="TEST-BCH-01",
            route="TAS - NRT",
            flight_date="2026-11-01",
            supplier=self.supplier,
            total_qty=10,
            buy_price=Decimal("500.00")
        )

    def test_api_income_payment(self):
        """Mijozdan to'lov qabul qilish (INCOME) va balans o'zgarishi."""
        # Mijozga 2 ta chipta sotamiz: 2 * 600 = $1200
        Sale.objects.create(
            batch=self.batch,
            client=self.client_partner,
            qty=2,
            sell_price=Decimal("600.00"),
            sale_date="2026-10-10"
        )
        self.client_partner.refresh_from_db()
        self.assertEqual(self.client_partner.net_balance, -1200.0)

        # $500 to'lov qabul qilamiz
        payload = {
            "partnerId": self.client_partner.id,
            "type": "INCOME",
            "amount": 500.0,
            "paymentDate": "2026-10-11",
            "paymentMethod": "NAQD_USD",
            "notes": "Qisman to'lov"
        }
        res = self.client.post("/api/cash/payments/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        self.client_partner.refresh_from_db()
        self.assertEqual(self.client_partner.total_paid_to_us, 500.0)
        self.assertEqual(self.client_partner.net_balance, -700.0)
        self.assertEqual(self.client_partner.they_owe_us, 700.0)

    def test_api_expense_payment(self):
        """Ta'minotchiga to'lov qilish (EXPENSE) va bizning qarzimiz kamayishi."""
        # Partiya narxi: 10 * 500 = $5000 (Ta'minotchi haqi: +5000)
        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.net_balance, 5000.0)
        self.assertEqual(self.supplier.we_owe_them, 5000.0)

        # Ta'minotchiga $3000 to'laymiz
        payload = {
            "partnerId": self.supplier.id,
            "type": "EXPENSE",
            "amount": 3000.0,
            "paymentDate": "2026-10-12",
            "paymentMethod": "BANK",
            "notes": "Partiya uchun to'lov"
        }
        res = self.client.post("/api/cash/payments/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        self.supplier.refresh_from_db()
        self.assertEqual(self.supplier.total_paid_by_us, 3000.0)
        self.assertEqual(self.supplier.net_balance, 2000.0)
        self.assertEqual(self.supplier.we_owe_them, 2000.0)

    def test_api_overpayment_leads_to_positive_balance(self):
        """Mijoz qarzdorligidan ortiqcha to'lasa, uning balansi musbat (+) ga aylanadi."""
        Sale.objects.create(
            batch=self.batch,
            client=self.client_partner,
            qty=1,
            sell_price=Decimal("600.00"),
            sale_date="2026-10-10"
        )
        self.client_partner.refresh_from_db()
        self.assertEqual(self.client_partner.net_balance, -600.0)

        # Mijoz $1000 to'ladi (600 qarz, 400 avans/ortiqcha)
        payload = {
            "partnerId": self.client_partner.id,
            "type": "INCOME",
            "amount": 1000.0,
            "paymentDate": "2026-10-11",
            "paymentMethod": "NAQD_USD"
        }
        res = self.client.post("/api/cash/payments/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        self.client_partner.refresh_from_db()
        self.assertEqual(self.client_partner.net_balance, 400.0)
        self.assertEqual(self.client_partner.we_owe_them, 400.0)
        self.assertEqual(self.client_partner.they_owe_us, 0.0)

    def test_api_debt_offset(self):
        """Mijoz qarzini ta'minotchi qarzimiz hisobiga o'zaro surish (DebtOffset)."""
        # Mijoz $1200 qarzdor
        Sale.objects.create(
            batch=self.batch,
            client=self.client_partner,
            qty=2,
            sell_price=Decimal("600.00"),
            sale_date="2026-10-10"
        )
        # Ta'minotchi haqi: $5000 (batch total cost)
        # Mijozning butun $1200 qarzini ta'minotchiga o'tkazamiz
        payload = {
            "fromPartnerId": self.client_partner.id,
            "toPartnerId": self.supplier.id,
            "amount": 1200.0,
            "date": "2026-10-13",
            "notes": "Mijoz qarzini ta'minotchi hisobiga yopish"
        }
        res = self.client.post("/api/cash/offsets/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        self.client_partner.refresh_from_db()
        self.supplier.refresh_from_db()

        # Mijoz qarzi to'liq yopildi: balans 0
        self.assertEqual(self.client_partner.net_balance, 0.0)
        self.assertEqual(self.client_partner.they_owe_us, 0.0)

        # Ta'minotchi haqi 5000 dan 3800 ga kamaydi (+3800)
        self.assertEqual(self.supplier.net_balance, 3800.0)
        self.assertEqual(self.supplier.we_owe_them, 3800.0)
