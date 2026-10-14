from decimal import Decimal
from django.test import TestCase
from apps.partners.models import Partner
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
