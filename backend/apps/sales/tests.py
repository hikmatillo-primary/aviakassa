from decimal import Decimal
from datetime import timedelta
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.core.exceptions import ValidationError
from django.utils import timezone
from rest_framework.test import APITestCase
from rest_framework import status
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
        sale = Sale.objects.create(
            batch=self.batch,
            client=self.client,
            qty=3,
            sell_price=Decimal("400.00"),
            sale_date="2026-11-15"
        )
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 2)

        sale.qty = 2
        sale.save()
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 3)
        self.assertEqual(sale.total_amount, Decimal("800.00"))

        sale.qty = 4
        sale.save()
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 1)
        self.assertEqual(sale.total_amount, Decimal("1600.00"))

    def test_sale_deletion_restores_inventory(self):
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

        sale.delete()
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 5)
        self.assertEqual(self.batch.status, Batch.Status.ACTIVE)


class SaleAPITests(APITestCase):
    def setUp(self):
        user = get_user_model().objects.create_user(
            username="tester", password="test-pass-12345"
        )
        self.client.force_authenticate(user=user)
        self.supplier = Partner.objects.create(
            name="Air Arabia",
            type=Partner.PartnerType.SUPPLIER
        )
        self.client_partner = Partner.objects.create(
            name="Ziyorat Travel",
            type=Partner.PartnerType.CLIENT
        )
        self.batch = Batch.objects.create(
            batch_number="TEST-SHJ-100",
            route="Toshkent - Sharja",
            flight_date="2026-12-10",
            supplier=self.supplier,
            total_qty=10,
            buy_price=Decimal("300.00")
        )

    def test_api_create_sale_with_float_payload(self):
        """Frontenddan keladigan float qiymatlarni API orqali to'g'ri qabul qilish."""
        payload = {
            "batchId": self.batch.id,
            "clientId": self.client_partner.id,
            "qty": 3,
            "sellPrice": 425.50,
            "saleDate": "2026-10-10",
            "notes": "Test sotuv"
        }
        response = self.client.post("/api/sales/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        sale = Sale.objects.get(id=response.data["id"])
        self.assertEqual(sale.qty, 3)
        self.assertEqual(sale.sell_price, Decimal("425.50"))
        self.assertEqual(sale.buy_price, Decimal("300.00"))  # Partiyadan avtomatik ko'chirilgan
        self.assertEqual(sale.total_amount, Decimal("1276.50"))
        self.assertEqual(sale.profit, Decimal("376.50"))  # 1276.50 - 900.00

        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 7)

    def test_api_exact_user_scenario_sale_and_payment_balance(self):
        """
        Foydalanuvchi ta'riflagan real holat:
        1. 10 ta chiptani donasi $330 dan jami $3300 ga sotamiz.
        2. Mijoz balansi -$3300 (bizdan qarzdor).
        3. Mijozdan $1300 to'lov qabul qilinadi.
        4. Balans aniq -$2000 bo'lishi kerak (haqimiz 1300 bo'lib qolmasligi lozim!).
        5. Sotuv o'chib ketmasligi, bazada saqlanib qolishi shart.
        """
        sale_payload = {
            "batchId": self.batch.id,
            "clientId": self.client_partner.id,
            "qty": 10,
            "sellPrice": 330.00,
            "saleDate": "2026-10-15"
        }
        res_sale = self.client.post("/api/sales/", sale_payload, format="json")
        self.assertEqual(res_sale.status_code, status.HTTP_201_CREATED)

        self.client_partner.refresh_from_db()
        self.assertEqual(self.client_partner.total_bought_from_us, 3300.0)
        self.assertEqual(self.client_partner.net_balance, -3300.0)
        self.assertEqual(self.client_partner.they_owe_us, 3300.0)

        # Partiya to'liq sotildi -> COMPLETED
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 0)
        self.assertEqual(self.batch.status, Batch.Status.COMPLETED)

        # $1300 to'lov qabul qilamiz
        payment_payload = {
            "partnerId": self.client_partner.id,
            "type": "INCOME",
            "amount": 1300.00,
            "paymentDate": "2026-10-15",
            "paymentMethod": "NAQD_USD"
        }
        res_pay = self.client.post("/api/cash/payments/", payment_payload, format="json")
        self.assertEqual(res_pay.status_code, status.HTTP_201_CREATED)

        # Balans tekshiruvi: 3300 - 1300 = 2000 qarzdor -> balans -2000
        self.client_partner.refresh_from_db()
        self.assertEqual(self.client_partner.total_paid_to_us, 1300.0)
        self.assertEqual(self.client_partner.net_balance, -2000.0)
        self.assertEqual(self.client_partner.they_owe_us, 2000.0)
        self.assertEqual(self.client_partner.we_owe_them, 0.0)

        # Sotuv saqlanib qolganini API orqali tekshiramiz
        res_list = self.client.get("/api/sales/")
        self.assertEqual(res_list.status_code, status.HTTP_200_OK)
        # Natijalar pagination ichida bo'lishi mumkin
        data_list = res_list.data.get("results", res_list.data)
        self.assertEqual(len(data_list), 1)
        self.assertEqual(data_list[0]["totalAmount"], 3300.0)

    def test_api_oversell_returns_400(self):
        """Partiyadagi qoldiqdan ortiqcha so'ralganda 400 xatosi qaytishi kerak."""
        payload = {
            "batchId": self.batch.id,
            "clientId": self.client_partner.id,
            "qty": 15,  # Qoldiq 10 ta, so'ralgan 15 ta
            "sellPrice": 400.00,
            "saleDate": "2026-10-10"
        }
        response = self.client.post("/api/sales/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("qty", response.data)

        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 10)  # Qoldiq o'zgarmagan bo'lishi kerak

    def test_api_zero_or_negative_qty_returns_400(self):
        """Chiptalar soni 0 yoki manfiy bo'lsa 400 xatosi chiqishi."""
        payload = {
            "batchId": self.batch.id,
            "clientId": self.client_partner.id,
            "qty": 0,
            "sellPrice": 400.00,
            "saleDate": "2026-10-10"
        }
        response = self.client.post("/api/sales/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_api_future_sale_date_rejected(self):
        """Sotuv sanasi kelajakda bo'lsa 400 xatosi qaytishi kerak."""
        tomorrow = timezone.localdate() + timedelta(days=1)
        payload = {
            "batchId": self.batch.id,
            "clientId": self.client_partner.id,
            "qty": 1,
            "sellPrice": 400.00,
            "saleDate": tomorrow.isoformat()
        }
        response = self.client.post("/api/sales/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("saleDate", response.data)

        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 10)
        self.assertEqual(Sale.objects.count(), 0)

    def test_api_patch_sale_quantity_and_price(self):
        """Sotuv miqdori yoki narxi API orqali o'zgartirilganda qoldiq va foyda moslashishi."""
        sale = Sale.objects.create(
            batch=self.batch,
            client=self.client_partner,
            qty=4,
            sell_price=Decimal("400.00"),
            sale_date="2026-11-20"
        )
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 6)

        # 4 tadan 6 taga oshiramiz
        patch_payload = {
            "qty": 6,
            "sellPrice": 420.00
        }
        res_patch = self.client.patch(f"/api/sales/{sale.id}/", patch_payload, format="json")
        self.assertEqual(res_patch.status_code, status.HTTP_200_OK)

        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 4)

        sale.refresh_from_db()
        self.assertEqual(sale.qty, 6)
        self.assertEqual(sale.sell_price, Decimal("420.00"))
        self.assertEqual(sale.total_amount, Decimal("2520.00"))
        self.assertEqual(sale.profit, Decimal("720.00"))  # 2520 - (6 * 300)

    def test_api_expired_batch_sale_rejected(self):
        """Muddati o'tgan partiyadan (parvoz sanasi o'tgan) chipta sotib bo'lmaydi."""
        past_date = timezone.localdate() - timedelta(days=1)
        expired_batch = Batch.objects.create(
            batch_number="TEST-EXPIRED-01",
            route="TAS - DXB",
            flight_date=past_date,
            supplier=self.supplier,
            total_qty=10,
            buy_price=Decimal("300.00")
        )
        payload = {
            "batchId": expired_batch.id,
            "clientId": self.client_partner.id,
            "qty": 2,
            "sellPrice": 400.00,
            "saleDate": timezone.localdate().isoformat()
        }
        response = self.client.post("/api/sales/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("batchId", response.data)

        expired_batch.refresh_from_db()
        self.assertEqual(expired_batch.remaining_qty, 10)
        self.assertEqual(Sale.objects.filter(batch=expired_batch).count(), 0)

    def test_api_round_trip_sale_allowed_until_return_date(self):
        """Borish-kelish partiyasida qaytish sanasi kelmagan bo'lsa sotish mumkin."""
        past_date = timezone.localdate() - timedelta(days=1)
        future_date = timezone.localdate() + timedelta(days=10)
        round_trip = Batch.objects.create(
            batch_number="TEST-ROUND-01",
            route="TAS - DXB",
            flight_date=past_date,
            is_round_trip=True,
            return_date=future_date,
            supplier=self.supplier,
            total_qty=10,
            buy_price=Decimal("300.00")
        )
        payload = {
            "batchId": round_trip.id,
            "clientId": self.client_partner.id,
            "qty": 2,
            "sellPrice": 400.00,
            "saleDate": timezone.localdate().isoformat()
        }
        response = self.client.post("/api/sales/", payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_api_delete_sale_restores_inventory(self):
        """Sotuv o'chirilganda partiyadagi chiptalar to'liq qaytishi."""
        sale = Sale.objects.create(
            batch=self.batch,
            client=self.client_partner,
            qty=10,
            sell_price=Decimal("400.00"),
            sale_date="2026-11-20"
        )
        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 0)
        self.assertEqual(self.batch.status, Batch.Status.COMPLETED)

        response = self.client.delete(f"/api/sales/{sale.id}/")
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

        self.batch.refresh_from_db()
        self.assertEqual(self.batch.remaining_qty, 10)
        self.assertEqual(self.batch.status, Batch.Status.ACTIVE)
