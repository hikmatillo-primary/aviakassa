from decimal import Decimal
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from apps.partners.models import Partner
from apps.flights.models import Batch
from apps.sales.models import Sale
from apps.cash.models import Payment, DebtOffset


class PartnerModelTests(TestCase):
    def setUp(self):
        self.supplier = Partner.objects.create(
            name="Centrum Air",
            type=Partner.PartnerType.SUPPLIER
        )
        self.client = Partner.objects.create(
            name="Ali Turizm",
            type=Partner.PartnerType.CLIENT
        )
        self.universal = Partner.objects.create(
            name="Oasis Travel",
            type=Partner.PartnerType.BOTH
        )

    def test_partner_creation(self):
        self.assertEqual(str(self.supplier), "Centrum Air")
        self.assertEqual(self.supplier.type, Partner.PartnerType.SUPPLIER)

    def test_partner_saldo_and_debt_offsets(self):
        # 1. Centrum Air dan 10 ta chipta oldik, 1 ta chipta = $300 ($3000)
        batch = Batch.objects.create(
            batch_number="TEST-P-1",
            route="Toshkent - Dubay",
            flight_date="2026-10-20",
            supplier=self.supplier,
            total_qty=10,
            buy_price=Decimal("300.00")
        )
        self.assertEqual(self.supplier.total_sold_to_us, 3000.0)
        # Biz ularga hech narsa to'lamaganmiz, shuning uchun ularning haqi $3000 (+)
        self.assertEqual(self.supplier.net_balance, 3000.0)
        self.assertEqual(self.supplier.we_owe_them, 3000.0)

        # 2. Centrum Air ga $1000 to'ladik (EXPENSE)
        Payment.objects.create(
            partner=self.supplier,
            type=Payment.PaymentType.EXPENSE,
            amount=Decimal("1000.00"),
            payment_date="2026-10-21"
        )
        # Haqi $2000 qolishi kerak (+)
        self.assertEqual(self.supplier.total_paid_by_us, 1000.0)
        self.assertEqual(self.supplier.net_balance, 2000.0)

        # 3. Ali Turizmga 4 ta chipta sotdik, donasi $350 ($1400)
        Sale.objects.create(
            batch=batch,
            client=self.client,
            qty=4,
            buy_price=Decimal("300.00"),
            sell_price=Decimal("350.00"),
            sale_date="2026-10-22"
        )
        # Ali Turizm bizdan $1400 qarzdor (-)
        self.assertEqual(self.client.total_bought_from_us, 1400.0)
        self.assertEqual(self.client.net_balance, -1400.0)
        self.assertEqual(self.client.they_owe_us, 1400.0)

        # 4. Ali Turizm $400 to'ladi (INCOME)
        Payment.objects.create(
            partner=self.client,
            type=Payment.PaymentType.INCOME,
            amount=Decimal("400.00"),
            payment_date="2026-10-23"
        )
        # Ali Turizm qarzi $1000 qoladi (-)
        self.assertEqual(self.client.net_balance, -1000.0)

        # 5. O'zaro qarz surish (DebtOffset): Ali Turizmning $1000 qarzini Centrum Air hisobiga suramiz
        DebtOffset.objects.create(
            from_partner=self.client,
            to_partner=self.supplier,
            amount=Decimal("1000.00"),
            date="2026-10-24"
        )

        # Ali Turizmning qarzi 0 bo'lishi kerak ($1000 qarz surildi)
        self.assertEqual(self.client.total_offset_from, 1000.0)
        self.assertEqual(self.client.net_balance, 0.0)

        # Centrum Air ning haqi $2000 dan $1000 ga tushishi kerak (+$1000)
        self.assertEqual(self.supplier.total_offset_to, 1000.0)
        self.assertEqual(self.supplier.net_balance, 1000.0)

    def test_universal_partner_dual_role(self):
        # Universal hamkor Oasis Travel: ham partiya sotadi, ham chipta oladi
        batch = Batch.objects.create(
            batch_number="TEST-P-OASIS",
            route="Toshkent - Dubay",
            flight_date="2026-10-20",
            supplier=self.universal,
            total_qty=10,
            buy_price=Decimal("300.00")
        )
        Sale.objects.create(
            batch=batch,
            client=self.universal,
            qty=4,
            sell_price=Decimal("500.00"),
            sale_date="2026-10-21"
        )
        # Hisob-kitob:
        # total_sold_to_us = 3000
        # total_bought_from_us = 2000
        # net_balance = 3000 - 2000 = +1000 (Oasis Travelning haqi bor)
        self.assertEqual(self.universal.total_sold_to_us, 3000.0)
        self.assertEqual(self.universal.total_bought_from_us, 2000.0)
        self.assertEqual(self.universal.net_balance, 1000.0)
        self.assertEqual(self.universal.we_owe_them, 1000.0)
        self.assertEqual(self.universal.they_owe_us, 0.0)


class PartnerAPITests(APITestCase):
    def setUp(self):
        user = get_user_model().objects.create_user(
            username="tester", password="test-pass-12345"
        )
        self.client.force_authenticate(user=user)
        self.client_partner = Partner.objects.create(
            name="Madina Tour",
            type=Partner.PartnerType.CLIENT
        )
        self.supplier = Partner.objects.create(
            name="FlyNas",
            type=Partner.PartnerType.SUPPLIER
        )

    def test_partner_api_crud(self):
        """Hamkor yaratish va API orqali olish."""
        payload = {
            "name": "Buxoro Turizm",
            "type": "CLIENT",
            "phone": "+998901234567",
            "notes": "Yangi agent"
        }
        res = self.client.post("/api/partners/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["name"], "Buxoro Turizm")
        self.assertEqual(res.data["balance"], 0.0)

    def test_partner_api_balance_reflection_after_sale_and_partial_payment(self):
        """API orqali so'ralganda hamkorning balansi qat'iy manfiy (-) yoki musbat (+) ko'rsatilishi."""
        batch = Batch.objects.create(
            batch_number="TEST-JED-55",
            route="TAS - JED",
            flight_date="2026-11-25",
            supplier=self.supplier,
            total_qty=10,
            buy_price=Decimal("400.00")
        )

        # 1. Sotuv yaratamiz: 5 ta chipta * $500 = $2500
        Sale.objects.create(
            batch=batch,
            client=self.client_partner,
            qty=5,
            sell_price=Decimal("500.00"),
            sale_date="2026-10-15"
        )

        res1 = self.client.get(f"/api/partners/{self.client_partner.id}/")
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data["totalBoughtFromUs"], 2500.0)
        self.assertEqual(res1.data["balance"], -2500.0)
        self.assertEqual(res1.data["theyOweUs"], 2500.0)

        # 2. Qisman to'lov: $1000
        Payment.objects.create(
            partner=self.client_partner,
            type=Payment.PaymentType.INCOME,
            amount=Decimal("1000.00"),
            payment_date="2026-10-15"
        )

        res2 = self.client.get(f"/api/partners/{self.client_partner.id}/")
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data["totalPaidToUs"], 1000.0)
        self.assertEqual(res2.data["balance"], -1500.0)
        self.assertEqual(res2.data["theyOweUs"], 1500.0)

        # 3. To'liq yopish va ortiqcha to'lov: yana $2000 to'laydi (qarz $1500 edi, $500 ortiqcha)
        Payment.objects.create(
            partner=self.client_partner,
            type=Payment.PaymentType.INCOME,
            amount=Decimal("2000.00"),
            payment_date="2026-10-16"
        )

        res3 = self.client.get(f"/api/partners/{self.client_partner.id}/")
        self.assertEqual(res3.status_code, status.HTTP_200_OK)
        self.assertEqual(res3.data["totalPaidToUs"], 3000.0)
        self.assertEqual(res3.data["balance"], 500.0)  # Musbat (+500): Endi mijozning haqi bor!
        self.assertEqual(res3.data["theyOweUs"], 0.0)
        self.assertEqual(res3.data["weOweThem"], 500.0)
