from django.core.management.base import BaseCommand
from apps.partners.models import Partner
from apps.flights.models import Batch
from apps.sales.models import Sale
from apps.cash.models import Payment, DebtOffset

class Command(BaseCommand):
    help = "Aviakassa demo ma'lumotlarini yuklash"

    def handle(self, *args, **options):
        self.stdout.write("Boshlang'ich ma'lumotlar tozalanmoqda...")
        DebtOffset.objects.all().delete()
        Payment.objects.all().delete()
        Sale.objects.all().delete()
        Batch.objects.all().delete()
        Partner.objects.all().delete()

        self.stdout.write("Hamkorlar yaratilmoqda...")
        p1 = Partner.objects.create(
            id=1,
            name="FlyDubai Bosh Diler",
            type="SUPPLIER",
            tags=["Birinchi qo'l", "Konsolidator"],
            phone="+998 90 111-22-33",
            notes="Dubay yo'nalishlari asosiy ta'minotchisi"
        )
        p2 = Partner.objects.create(
            id=2,
            name="Air Arabia Blok Hamkor",
            type="SUPPLIER",
            tags=["Birinchi qo'l", "Charter"],
            phone="+998 93 444-55-66",
            notes="Sharja va Jidda yo'nalishlari"
        )
        p3 = Partner.objects.create(
            id=3,
            name="Silk Road Travel MCHJ",
            type="CLIENT",
            tags=["B2B Agent", "Doimiy"],
            phone="+998 97 777-88-99",
            notes="Dubayga guruhli turlar oluvchi hamkor"
        )
        p4 = Partner.objects.create(
            id=4,
            name="Ziyorat Tour (Farg'ona)",
            type="CLIENT",
            tags=["Umra", "Regional"],
            phone="+998 91 222-33-44",
            notes="Umra ziyorati bo'yicha asosiy mijoz"
        )
        p5 = Partner.objects.create(
            id=5,
            name="Aliyev Jasur (Chakana)",
            type="CLIENT",
            tags=["Chakana"],
            phone="+998 90 999-00-11",
            notes="Doimiy yakka tartibdagi yo'lovchi"
        )

        self.stdout.write("Partiyalar yaratilmoqda...")
        b1 = Batch.objects.create(
            id=1,
            batch_number="P-DXB-101",
            route="Toshkent — Dubay",
            flight_date="2026-10-25",
            flight_number="FZ-780",
            departure_time="08:30",
            arrival_time="12:15",
            supplier=p1,
            total_qty=40,
            remaining_qty=25,
            buy_price=320.00,
            total_cost=12800.00,
            status="ACTIVE",
            notes="Ertalabki qulay reys"
        )
        b2 = Batch.objects.create(
            id=2,
            batch_number="P-JED-202",
            route="Toshkent — Jidda",
            flight_date="2026-11-05",
            flight_number="G9-551",
            departure_time="09:00",
            arrival_time="14:20",
            is_round_trip=True,
            return_date="2026-11-19",
            return_flight_number="G9-552",
            return_departure_time="16:00",
            return_arrival_time="21:45",
            supplier=p2,
            total_qty=50,
            remaining_qty=40,
            buy_price=380.00,
            total_cost=19000.00,
            status="ACTIVE",
            notes="Umra mavsumi bloki (Borish-qaytish)"
        )

        self.stdout.write("Sotuvlar yaratilmoqda...")
        Sale.objects.create(
            id=1,
            batch=b1,
            client=p3,
            route=b1.route,
            flight_date=b1.flight_date,
            flight_number=b1.flight_number,
            departure_time=b1.departure_time,
            arrival_time=b1.arrival_time,
            is_round_trip=False,
            buy_price=320.00,
            qty=10,
            sell_price=370.00,
            total_amount=3700.00,
            profit=500.00,
            passenger_names="Karimov A., Karimov B. (+8 kishi)",
            sale_date="2026-10-10",
            notes="Sayyohlik guruhi uchun"
        )
        Sale.objects.create(
            id=2,
            batch=b1,
            client=p5,
            route=b1.route,
            flight_date=b1.flight_date,
            flight_number=b1.flight_number,
            departure_time=b1.departure_time,
            arrival_time=b1.arrival_time,
            is_round_trip=False,
            buy_price=320.00,
            qty=2,
            sell_price=400.00,
            total_amount=800.00,
            profit=160.00,
            passenger_names="Aliyev Jasur, Aliyeva Nargiza",
            sale_date="2026-10-11",
            notes="Oila bilan dam olishga"
        )
        Sale.objects.create(
            id=3,
            batch=b2,
            client=p4,
            route=b2.route,
            flight_date=b2.flight_date,
            flight_number=b2.flight_number,
            departure_time=b2.departure_time,
            arrival_time=b2.arrival_time,
            is_round_trip=True,
            return_date=b2.return_date,
            return_flight_number=b2.return_flight_number,
            return_departure_time=b2.return_departure_time,
            return_arrival_time=b2.return_arrival_time,
            buy_price=380.00,
            qty=10,
            sell_price=440.00,
            total_amount=4400.00,
            profit=600.00,
            passenger_names="Hoji guruh (10 nafar)",
            sale_date="2026-10-12",
            notes="Umra dastlabki guruhi"
        )

        self.stdout.write("To'lovlar yaratilmoqda...")
        Payment.objects.create(
            id=1,
            partner=p3,
            type="INCOME",
            amount=2500.00,
            payment_date="2026-10-10",
            payment_method="BANK_KARTA",
            notes="Guruh chiptalariga avans to'lovi"
        )
        Payment.objects.create(
            id=2,
            partner=p1,
            type="EXPENSE",
            amount=5000.00,
            payment_date="2026-10-10",
            payment_method="HISOB_RAQAM",
            notes="Dubay partiyasiga boshlang'ich to'lov"
        )
        Payment.objects.create(
            id=3,
            partner=p5,
            type="INCOME",
            amount=800.00,
            payment_date="2026-10-11",
            payment_method="NAQD_USD",
            notes="To'liq naqd dollar to'landi"
        )
        Payment.objects.create(
            id=4,
            partner=p4,
            type="INCOME",
            amount=4400.00,
            payment_date="2026-10-12",
            payment_method="HISOB_RAQAM",
            notes="Bank o'tkazmasi orqali to'liq to'landi"
        )

        self.stdout.write(self.style.SUCCESS("Barcha demo ma'lumotlar muvaffaqiyatli yuklandi!"))
